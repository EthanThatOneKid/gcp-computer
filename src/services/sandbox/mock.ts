import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SandboxProvider, RunCommandResult, SandboxMount } from './provider';

const execAsync = promisify(exec);

export class MockSandboxProvider implements SandboxProvider {
  private sandboxDir = path.join(process.cwd(), 'sandboxes');
  private statuses: Map<string, 'provisioning' | 'running' | 'stopped' | 'failed'> = new Map();
  private mounts: Map<string, SandboxMount[]> = new Map();

  private getWorkspaceDir(id: string): string {
    return path.join(this.sandboxDir, id, 'workspace');
  }

  async createSandbox(id: string): Promise<void> {
    const ws = this.getWorkspaceDir(id);
    if (!fs.existsSync(ws)) {
      fs.mkdirSync(ws, { recursive: true });
    }
    this.statuses.set(id, 'running');
    this.mounts.set(id, []);
    console.log(`[MockSandbox] Sandbox ${id} created at ${ws}`);
  }

  async startSandbox(id: string): Promise<void> {
    this.statuses.set(id, 'running');
    console.log(`[MockSandbox] Sandbox ${id} started`);
  }

  async stopSandbox(id: string, force?: boolean): Promise<void> {
    this.statuses.set(id, 'stopped');
    console.log(`[MockSandbox] Sandbox ${id} stopped`);
  }

  async deleteSandbox(id: string): Promise<void> {
    this.statuses.delete(id);
    this.mounts.delete(id);
    const ws = path.join(this.sandboxDir, id);
    if (fs.existsSync(ws)) {
      fs.rmSync(ws, { recursive: true, force: true });
    }
    console.log(`[MockSandbox] Sandbox ${id} deleted`);
  }

  async executeCommand(
    id: string,
    command: string,
    workDir: string = '',
  ): Promise<RunCommandResult> {
    const ws = this.getWorkspaceDir(id);
    const cwd = workDir ? path.resolve(ws, workDir) : ws;

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd, { recursive: true });
    }

    console.log(`[MockSandbox] Executing: "${command}" in ${cwd}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout ? error.stdout.trim() : '',
        stderr: error.stderr ? error.stderr.trim() : error.message || 'Unknown error',
        exitCode: error.code !== undefined ? error.code : 1,
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
    console.log(`[MockSandbox] Wrote file ${filePath}`);
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
    const ws = this.getWorkspaceDir(id);
    const sanitizedSandboxPath = sandboxPath.startsWith('/') ? sandboxPath.slice(1) : sandboxPath;
    const targetDir = path.resolve(ws, sanitizedSandboxPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(hostPath)) {
      const stats = fs.statSync(hostPath);
      if (stats.isDirectory()) {
        copyFolderSync(hostPath, targetDir);
      } else {
        fs.copyFileSync(hostPath, targetDir);
      }
    }

    const currentMounts = this.mounts.get(id) || [];
    currentMounts.push({ hostPath, sandboxPath });
    this.mounts.set(id, currentMounts);
    console.log(`[MockSandbox] Mounted ${hostPath} to ${sandboxPath}`);
  }

  async getSandboxStatus(id: string): Promise<'provisioning' | 'running' | 'stopped' | 'failed'> {
    return this.statuses.get(id) || 'stopped';
  }

  getMounts(id: string): SandboxMount[] {
    return this.mounts.get(id) || [];
  }
}

function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}
