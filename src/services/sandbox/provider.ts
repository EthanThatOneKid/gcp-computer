export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SandboxMount {
  hostPath: string;
  sandboxPath: string;
}

export interface SandboxStatusInfo {
  id: string;
  provider: 'mock' | 'docker' | 'gcp';
  status: 'provisioning' | 'running' | 'stopped' | 'failed';
  mounts: SandboxMount[];
  lastActive: number;
  ipAddress?: string;
}

export interface SandboxProvider {
  createSandbox(id: string): Promise<void>;
  startSandbox(id: string): Promise<void>;
  stopSandbox(id: string, force?: boolean): Promise<void>;
  deleteSandbox(id: string): Promise<void>;
  executeCommand(id: string, command: string, workDir?: string): Promise<RunCommandResult>;
  writeFile(id: string, filePath: string, content: string): Promise<void>;
  readFile(id: string, filePath: string): Promise<string>;
  mountDirectory(id: string, hostPath: string, sandboxPath: string): Promise<void>;
  getSandboxStatus(id: string): Promise<'provisioning' | 'running' | 'stopped' | 'failed'>;
  getIpAddress?(id: string): Promise<string | undefined>;
}
