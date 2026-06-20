import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SandboxProvider, RunCommandResult, SandboxMount } from './provider';

const execAsync = promisify(exec);

export class DockerSandboxProvider implements SandboxProvider {
  private sandboxDir = path.join(process.cwd(), 'sandboxes');
  private mounts: Map<string, SandboxMount[]> = new Map();

  private getWorkspaceDir(id: string): string {
    return path.join(this.sandboxDir, id, 'workspace');
  }

  private async isDockerRunning(): Promise<boolean> {
    try {
      await execAsync('docker info');
      return true;
    } catch {
      return false;
    }
  }

  private async containerExists(name: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`docker ps -a --filter "name=${name}" --format "{{.Names}}"`);
      return stdout.trim().includes(name);
    } catch {
      return false;
    }
  }

  private async getContainerStatus(name: string): Promise<'running' | 'exited' | 'none'> {
    try {
      const { stdout } = await execAsync(`docker inspect -f "{{.State.Status}}" ${name}`);
      const status = stdout.trim();
      if (status === 'running') return 'running';
      if (status === 'exited' || status === 'created') return 'exited';
      return 'none';
    } catch {
      return 'none';
    }
  }

  async createSandbox(id: string): Promise<void> {
    const ws = this.getWorkspaceDir(id);
    if (!fs.existsSync(ws)) {
      fs.mkdirSync(ws, { recursive: true });
    }

    if (!(await this.isDockerRunning())) {
      console.warn(`[DockerSandbox] Docker not running. Fallback to local workspace files.`);
      return;
    }

    const containerName = `gcp-computer-sandbox-${id}`;
    if (await this.containerExists(containerName)) {
      await this.stopSandbox(id, true);
    }

    await this.startContainer(id);
    this.mounts.set(id, []);
  }

  private async startContainer(id: string): Promise<void> {
    const containerName = `gcp-computer-sandbox-${id}`;
    const ws = this.getWorkspaceDir(id);

    let mountFlags = `-v "${ws}:/workspace"`;
    const sandboxMounts = this.mounts.get(id) || [];
    for (const m of sandboxMounts) {
      mountFlags += ` -v "${m.hostPath}:${m.sandboxPath}"`;
    }

    const cmd = `docker run -d --name ${containerName} ${mountFlags} -w /workspace alpine tail -f /dev/null`;
    console.log(`[DockerSandbox] Launching: ${cmd}`);
    await execAsync(cmd);
  }

  async startSandbox(id: string): Promise<void> {
    const containerName = `gcp-computer-sandbox-${id}`;
    if (!(await this.isDockerRunning())) return;

    const status = await this.getContainerStatus(containerName);
    if (status === 'exited') {
      await execAsync(`docker start ${containerName}`);
    } else if (status === 'none') {
      await this.startContainer(id);
    }
  }

  async stopSandbox(id: string, force?: boolean): Promise<void> {
    const containerName = `gcp-computer-sandbox-${id}`;
    if (!(await this.isDockerRunning())) return;

    const status = await this.getContainerStatus(containerName);
    if (status === 'running') {
      await execAsync(`docker stop ${containerName}`);
    }
    
    if (force) {
      await execAsync(`docker rm -f ${containerName}`).catch(() => {});
    }
  }

  async deleteSandbox(id: string): Promise<void> {
    const containerName = `gcp-computer-sandbox-${id}`;
    if (await this.isDockerRunning()) {
      await execAsync(`docker rm -f ${containerName}`).catch(() => {});
    }

    this.mounts.delete(id);

    const ws = path.join(this.sandboxDir, id);
    if (fs.existsSync(ws)) {
      fs.rmSync(ws, { recursive: true, force: true });
    }
  }

  async executeCommand(id: string, command: string, workDir: string = ''): Promise<RunCommandResult> {
    const containerName = `gcp-computer-sandbox-${id}`;
    await this.startSandbox(id);

    if (!(await this.isDockerRunning())) {
      const ws = this.getWorkspaceDir(id);
      const cwd = workDir ? path.resolve(ws, workDir) : ws;
      try {
        const { stdout, stderr } = await execAsync(command, { cwd });
        return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
      } catch (error: any) {
        return {
          stdout: error.stdout ? error.stdout.trim() : '',
          stderr: error.stderr ? error.stderr.trim() : (error.message || 'Unknown error'),
          exitCode: error.code !== undefined ? error.code : 1
        };
      }
    }

    const formattedWorkDir = workDir 
      ? (workDir.startsWith('/') ? workDir : `/workspace/${workDir}`)
      : '/workspace';

    const escapedCommand = command.replace(/"/g, '\\"');
    const execCmd = `docker exec -w ${formattedWorkDir} ${containerName} sh -c "${escapedCommand}"`;

    try {
      const { stdout, stderr } = await execAsync(execCmd);
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0
      };
    } catch (error: any) {
      return {
        stdout: error.stdout ? error.stdout.trim() : '',
        stderr: error.stderr ? error.stderr.trim() : (error.message || 'Unknown error'),
        exitCode: error.code !== undefined ? error.code : 1
      };
    }
  }

  async writeFile(id: string, filePath: string, content: string): Promise<void> {
    const ws = this.getWorkspaceDir(id);
    const absolutePath = path.resolve(ws, filePath);
    
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content, 'utf8');
  }

  async readFile(id: string, filePath: string): Promise<string> {
    const ws = this.getWorkspaceDir(id);
    const absolutePath = path.resolve(ws, filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(absolutePath, 'utf8');
  }

  async mountDirectory(id: string, hostPath: string, sandboxPath: string): Promise<void> {
    const currentMounts = this.mounts.get(id) || [];
    const exists = currentMounts.some(m => m.hostPath === hostPath && m.sandboxPath === sandboxPath);
    if (exists) return;

    currentMounts.push({ hostPath, sandboxPath });
    this.mounts.set(id, currentMounts);

    if (!(await this.isDockerRunning())) return;

    const containerName = `gcp-computer-sandbox-${id}`;
    const status = await this.getContainerStatus(containerName);
    
    if (status !== 'none') {
      await execAsync(`docker rm -f ${containerName}`).catch(() => {});
      await this.startContainer(id);
    }
  }

  async getSandboxStatus(id: string): Promise<'provisioning' | 'running' | 'stopped' | 'failed'> {
    if (!(await this.isDockerRunning())) return 'running';

    const containerName = `gcp-computer-sandbox-${id}`;
    const status = await this.getContainerStatus(containerName);
    if (status === 'running') return 'running';
    if (status === 'exited') return 'stopped';
    return 'stopped';
  }

  getMounts(id: string): SandboxMount[] {
    return this.mounts.get(id) || [];
  }
}
