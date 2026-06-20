import { InstancesClient } from '@google-cloud/compute';
import { SandboxProvider, RunCommandResult, SandboxMount } from './provider';

// GCP Credentials should be configured in Environment variables
// GOOGLE_APPLICATION_CREDENTIALS or IAM Roles in production.
const project = process.env.GCP_PROJECT_ID || '';
const zone = process.env.GCP_ZONE || 'us-central1-a';

// Injected VM Startup Script
// Installs Node, writes a tiny server agent, and starts it on port 8888
const startupScript = `#!/bin/bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update && apt-get install -y nodejs git curl

# Create workspace
mkdir -p /workspace
cd /workspace

# Write runner server
cat << 'EOF' > agent.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Auth check via header
const SHARED_SECRET = process.env.AGENT_SECRET || 'gcp-computer-secret-token';
app.use((req, res, next) => {
  const token = req.headers['authorization'];
  if (token !== \`Bearer \${SHARED_SECRET}\`) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

app.post('/execute', (req, res) => {
  const { command, workDir } = req.body;
  const cwd = workDir ? path.resolve('/workspace', workDir) : '/workspace';
  
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  exec(command, { cwd }, (err, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || (err ? err.message : ''),
      exitCode: err ? err.code : 0
    });
  });
});

app.post('/write', (req, res) => {
  const { filePath, content } = req.body;
  const absPath = path.resolve('/workspace', filePath);
  
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf8');
  res.json({ success: true });
});

app.post('/read', (req, res) => {
  const { filePath } = req.body;
  const absPath = path.resolve('/workspace', filePath);
  
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json({ content: fs.readFileSync(absPath, 'utf8') });
});

app.post('/mount', (req, res) => {
  const { hostPath, sandboxPath } = req.body;
  const targetPath = sandboxPath.startsWith('/') ? sandboxPath : \`/\${sandboxPath}\`;
  
  // Simulated mount (directory mirroring on VM) for fast demo,
  // or formatting physical device block if attached.
  exec(\`mkdir -p \${targetPath}\`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ success: true, message: \`Simulated mount to \${targetPath} complete\` });
  });
});

app.listen(8888, () => console.log('VM agent listening on port 8888'));
EOF

npm install express
node agent.js > /var/log/agent.log 2>&1 &
`;

export class GCPComputeSandboxProvider implements SandboxProvider {
  private client: InstancesClient | null = null;
  private mounts: Map<string, SandboxMount[]> = new Map();
  private cacheIp: Map<string, string> = new Map();
  private sharedSecret = process.env.AGENT_SECRET || 'gcp-computer-secret-token';

  constructor() {
    try {
      if (project) {
        this.client = new InstancesClient();
      }
    } catch (e) {
      console.warn('[GCP Sandbox] Failed to initialize Compute Engine client. GCP operations will fail.', e);
    }
  }

  private getGCPName(id: string): string {
    return `sb-${id.replace(/-/g, '').substring(0, 30)}`;
  }

  private checkGCPConfig() {
    if (!this.client || !project) {
      throw new Error('GCP Compute Client is not configured. Add GCP_PROJECT_ID to your environment.');
    }
  }

  async getIpAddress(id: string): Promise<string | undefined> {
    if (this.cacheIp.has(id)) {
      return this.cacheIp.get(id);
    }

    this.checkGCPConfig();
    const instanceName = this.getGCPName(id);

    try {
      const [instance] = await this.client!.get({
        project,
        zone,
        instance: instanceName,
      });

      const publicIp = instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;
      if (publicIp) {
        this.cacheIp.set(id, publicIp);
      }
      return publicIp || undefined;
    } catch (err) {
      console.error('[GCP Sandbox] Failed to fetch IP for instance:', instanceName, err);
      return undefined;
    }
  }

  async createSandbox(id: string): Promise<void> {
    this.checkGCPConfig();
    const instanceName = this.getGCPName(id);
    this.mounts.set(id, []);

    console.log(`[GCP Sandbox] Creating VM Instance: ${instanceName} in project ${project}`);

    const [operation] = await this.client!.insert({
      project,
      zone,
      instanceResource: {
        name: instanceName,
        machineType: `zones/${zone}/machineTypes/e2-micro`,
        disks: [
          {
            boot: true,
            initializeParams: {
              sourceImage: 'projects/debian-cloud/global/images/family/debian-11',
              diskSizeGb: '10',
            },
          },
        ],
        networkInterfaces: [
          {
            network: 'global/networks/default',
            accessConfigs: [
              {
                type: 'ONE_TO_ONE_NAT',
                name: 'External NAT',
              },
            ],
          },
        ],
        metadata: {
          items: [
            {
              key: 'startup-script',
              value: startupScript,
            },
            {
              key: 'agent-secret',
              value: this.sharedSecret,
            },
          ],
        },
      },
    });

    console.log(`[GCP Sandbox] Creation operation queued. Wait for start...`);
    await operation.promise();
    console.log(`[GCP Sandbox] VM instance ${instanceName} successfully created.`);
  }

  async startSandbox(id: string): Promise<void> {
    this.checkGCPConfig();
    const instanceName = this.getGCPName(id);
    console.log(`[GCP Sandbox] Starting VM Instance: ${instanceName}`);
    
    const [operation] = await this.client!.start({
      project,
      zone,
      instance: instanceName,
    });
    await operation.promise();
  }

  async stopSandbox(id: string, force?: boolean): Promise<void> {
    this.checkGCPConfig();
    const instanceName = this.getGCPName(id);
    console.log(`[GCP Sandbox] Stopping VM Instance: ${instanceName}`);
    
    const [operation] = await this.client!.stop({
      project,
      zone,
      instance: instanceName,
    });
    await operation.promise();
    this.cacheIp.delete(id);
  }

  async deleteSandbox(id: string): Promise<void> {
    this.checkGCPConfig();
    const instanceName = this.getGCPName(id);
    console.log(`[GCP Sandbox] Deleting VM Instance: ${instanceName}`);
    
    const [operation] = await this.client!.delete({
      project,
      zone,
      instance: instanceName,
    });
    await operation.promise();
    this.mounts.delete(id);
    this.cacheIp.delete(id);
  }

  private async callAgent(id: string, endpoint: string, body: any): Promise<any> {
    const ip = await this.getIpAddress(id);
    if (!ip) {
      throw new Error(`Instance IP address is not available yet for sandbox ${id}.`);
    }

    const url = `http://${ip}:8888${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sharedSecret}`,
      },
      body: JSON.stringify(body),
      // Set short timeouts to avoid hanging Next.js
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`VM Agent Error (${response.status}): ${errText}`);
    }

    return await response.json();
  }

  async executeCommand(id: string, command: string, workDir?: string): Promise<RunCommandResult> {
    console.log(`[GCP Sandbox] Forwarding command to VM ${id}: ${command}`);
    return await this.callAgent(id, '/execute', { command, workDir });
  }

  async writeFile(id: string, filePath: string, content: string): Promise<void> {
    console.log(`[GCP Sandbox] Forwarding write request to VM ${id}: ${filePath}`);
    await this.callAgent(id, '/write', { filePath, content });
  }

  async readFile(id: string, filePath: string): Promise<string> {
    console.log(`[GCP Sandbox] Forwarding read request to VM ${id}: ${filePath}`);
    const res = await this.callAgent(id, '/read', { filePath });
    return res.content;
  }

  async mountDirectory(id: string, hostPath: string, sandboxPath: string): Promise<void> {
    console.log(`[GCP Sandbox] Forwarding mount request to VM ${id}: ${hostPath} -> ${sandboxPath}`);
    await this.callAgent(id, '/mount', { hostPath, sandboxPath });
    
    const currentMounts = this.mounts.get(id) || [];
    currentMounts.push({ hostPath, sandboxPath });
    this.mounts.set(id, currentMounts);
  }

  async getSandboxStatus(id: string): Promise<'provisioning' | 'running' | 'stopped' | 'failed'> {
    if (!this.client || !project) return 'running'; // Mock fallback for compilation/development

    const instanceName = this.getGCPName(id);
    try {
      const [instance] = await this.client.get({
        project,
        zone,
        instance: instanceName,
      });

      const status = instance.status;
      if (status === 'RUNNING') return 'running';
      if (status === 'PROVISIONING' || status === 'STAGING') return 'provisioning';
      if (status === 'TERMINATED' || status === 'STOPPING') return 'stopped';
      return 'stopped';
    } catch {
      return 'stopped';
    }
  }

  getMounts(id: string): SandboxMount[] {
    return this.mounts.get(id) || [];
  }
}
