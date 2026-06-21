import fs from 'fs';
import path from 'path';
import { SandboxMount, SandboxProvider, RunCommandResult } from './provider';

type VirtualNode =
  | { type: 'dir'; entries: Map<string, VirtualNode> }
  | { type: 'file'; content: string };

type SandboxState = {
  status: 'provisioning' | 'running' | 'stopped' | 'failed';
  root: VirtualNode;
  mounts: SandboxMount[];
};

function createDir(): VirtualNode {
  return { type: 'dir', entries: new Map() };
}

function normalizeVirtualPath(inputPath: string): string {
  const cleaned = inputPath.replace(/\\/g, '/').trim();
  if (!cleaned || cleaned === '.') return '/workspace';
  const prefixed = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return path.posix.normalize(prefixed);
}

function splitVirtualPath(virtualPath: string): string[] {
  return normalizeVirtualPath(virtualPath)
    .split('/')
    .filter(Boolean);
}

function cloneNode(node: VirtualNode): VirtualNode {
  if (node.type === 'file') {
    return { type: 'file', content: node.content };
  }

  const entries = new Map<string, VirtualNode>();
  for (const [name, child] of node.entries) {
    entries.set(name, cloneNode(child));
  }

  return { type: 'dir', entries };
}

class VirtualFilesystem {
  constructor(private root: VirtualNode) {}

  private getDirNode(dirPath: string, create = false): Extract<VirtualNode, { type: 'dir' }> {
    const segments = splitVirtualPath(dirPath);
    let current = this.root;

    if (current.type !== 'dir') {
      throw new Error('Root is not a directory');
    }

    for (const segment of segments) {
      let next: VirtualNode | undefined = current.entries.get(segment);
      if (!next) {
        if (!create) {
          throw new Error(`Directory not found: ${dirPath}`);
        }
        next = createDir();
        current.entries.set(segment, next);
      }

      if (next.type !== 'dir') {
        throw new Error(`Not a directory: ${dirPath}`);
      }
      current = next;
    }

    return current;
  }

  private getNode(nodePath: string): VirtualNode | undefined {
    const segments = splitVirtualPath(nodePath);
    let current = this.root;

    if (segments.length === 0) {
      return current;
    }

    for (const segment of segments) {
      if (current.type !== 'dir') return undefined;
      const next = current.entries.get(segment);
      if (!next) return undefined;
      current = next;
    }

    return current;
  }

  mkdirp(dirPath: string) {
    this.getDirNode(dirPath, true);
  }

  writeFile(filePath: string, content: string) {
    const normalizedPath = normalizeVirtualPath(filePath);
    const segments = splitVirtualPath(normalizedPath);
    const fileName = segments.pop();
    if (!fileName) throw new Error('Invalid file path');

    const parent = this.getDirNode(`/${segments.join('/')}`, true);
    parent.entries.set(fileName, { type: 'file', content });
  }

  readFile(filePath: string) {
    const node = this.getNode(filePath);
    if (!node || node.type !== 'file') {
      throw new Error(`File not found: ${filePath}`);
    }
    return node.content;
  }

  listDir(dirPath: string) {
    const node = this.getNode(dirPath);
    if (!node) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    if (node.type !== 'dir') {
      return [path.posix.basename(normalizeVirtualPath(dirPath))];
    }
    return Array.from(node.entries.keys()).sort();
  }

  removePath(targetPath: string) {
    const normalizedPath = normalizeVirtualPath(targetPath);
    const segments = splitVirtualPath(normalizedPath);
    const name = segments.pop();
    if (!name) return;

    const parent = this.getDirNode(`/${segments.join('/')}`, false);
    parent.entries.delete(name);
  }

  copyPath(fromPath: string, toPath: string) {
    const source = this.getNode(fromPath);
    if (!source) {
      throw new Error(`Path not found: ${fromPath}`);
    }

    const normalizedDest = normalizeVirtualPath(toPath);
    const destSegments = splitVirtualPath(normalizedDest);
    const destName = destSegments.pop();
    if (!destName) {
      throw new Error('Invalid destination path');
    }

    const destParent = this.getDirNode(`/${destSegments.join('/')}`, true);
    destParent.entries.set(destName, cloneNode(source));
  }

  movePath(fromPath: string, toPath: string) {
    this.copyPath(fromPath, toPath);
    this.removePath(fromPath);
  }

  statPath(targetPath: string) {
    const node = this.getNode(targetPath);
    if (!node) return undefined;
    return node.type;
  }

  copyHostDirectory(hostPath: string, sandboxPath: string) {
    const target = normalizeVirtualPath(sandboxPath);
    this.mkdirp(target);
    const dirEntries = fs.readdirSync(hostPath, { withFileTypes: true });
    for (const entry of dirEntries) {
      const sourcePath = path.join(hostPath, entry.name);
      const targetPath = path.posix.join(target, entry.name);
      if (entry.isDirectory()) {
        this.copyHostDirectory(sourcePath, targetPath);
      } else if (entry.isFile()) {
        this.mkdirp(path.posix.dirname(targetPath));
        this.writeFile(targetPath, fs.readFileSync(sourcePath, 'utf8'));
      }
    }
  }

  copyHostFile(hostPath: string, sandboxPath: string) {
    this.mkdirp(path.posix.dirname(normalizeVirtualPath(sandboxPath)));
    this.writeFile(sandboxPath, fs.readFileSync(hostPath, 'utf8'));
  }
}

function parseQuotedText(value: string) {
  return value.replace(/^['"]|['"]$/g, '');
}

function formatList(items: string[]) {
  return items.length > 0 ? items.join('\n') : '';
}

async function runCommandSegment(
  fsx: VirtualFilesystem,
  cwd: string,
  segment: string,
): Promise<{ output: string; cwd: string }> {
  const trimmed = segment.trim();
  if (!trimmed) {
    return { output: '', cwd };
  }

  if (trimmed.startsWith('cd ')) {
    const target = trimmed.slice(3).trim();
    const nextCwd = normalizeVirtualPath(path.posix.resolve(cwd, parseQuotedText(target)));
    fsx.mkdirp(nextCwd);
    return { output: '', cwd: nextCwd };
  }

  if (trimmed === 'pwd') {
    return { output: cwd, cwd };
  }

  if (trimmed.startsWith('mkdir ')) {
    const target = parseQuotedText(trimmed.replace(/^mkdir\s+(-p\s+)?/, ''));
    fsx.mkdirp(path.posix.resolve(cwd, target));
    return { output: '', cwd };
  }

  if (trimmed.startsWith('touch ')) {
    const target = parseQuotedText(trimmed.slice(6).trim());
    const absolute = normalizeVirtualPath(path.posix.resolve(cwd, target));
    if (fsx.statPath(absolute) == null) {
      fsx.writeFile(absolute, '');
    }
    return { output: '', cwd };
  }

  if (trimmed.startsWith('cat ')) {
    const target = parseQuotedText(trimmed.slice(4).trim());
    return { output: fsx.readFile(path.posix.resolve(cwd, target)), cwd };
  }

  if (trimmed.startsWith('ls')) {
    const target = trimmed.split(/\s+/).slice(1).filter((part) => !part.startsWith('-'))[0] || cwd;
    return { output: formatList(fsx.listDir(path.posix.resolve(cwd, parseQuotedText(target)))), cwd };
  }

  if (trimmed.startsWith('echo ')) {
    const redirMatch = trimmed.match(/^echo\s+(.+?)\s*(>>|>)\s*(.+)$/);
    if (redirMatch) {
      const [, value, op, dest] = redirMatch;
      const absoluteDest = path.posix.resolve(cwd, parseQuotedText(dest.trim()));
      const existing = op === '>>' && fsx.statPath(absoluteDest) === 'file' ? fsx.readFile(absoluteDest) + '\n' : '';
      fsx.writeFile(absoluteDest, `${existing}${parseQuotedText(value.trim())}`);
      return { output: '', cwd };
    }

    return { output: parseQuotedText(trimmed.slice(5).trim()), cwd };
  }

  if (trimmed.startsWith('grep ')) {
    const parts = trimmed.split(/\s+/);
    const needle = parseQuotedText(parts[1] || '');
    const target = parts.slice(2).filter((part) => !part.startsWith('-'))[0];
    if (!target) throw new Error('grep requires a file path');
    const content = fsx.readFile(path.posix.resolve(cwd, target));
    return {
      output: content
        .split(/\r?\n/)
        .filter((line) => line.includes(needle))
        .join('\n'),
      cwd,
    };
  }

  if (trimmed.startsWith('cp ')) {
    const [, from, to] = trimmed.split(/\s+/);
    fsx.copyPath(path.posix.resolve(cwd, parseQuotedText(from)), path.posix.resolve(cwd, parseQuotedText(to)));
    return { output: '', cwd };
  }

  if (trimmed.startsWith('mv ')) {
    const [, from, to] = trimmed.split(/\s+/);
    fsx.movePath(path.posix.resolve(cwd, parseQuotedText(from)), path.posix.resolve(cwd, parseQuotedText(to)));
    return { output: '', cwd };
  }

  if (trimmed.startsWith('rm ')) {
    const target = trimmed.split(/\s+/).filter((part) => !part.startsWith('-'))[1];
    if (target) {
      fsx.removePath(path.posix.resolve(cwd, parseQuotedText(target)));
    }
    return { output: '', cwd };
  }

  if (trimmed.startsWith('find ')) {
    const target = trimmed.split(/\s+/).filter((part) => !part.startsWith('-'))[1] || cwd;
    const absolute = normalizeVirtualPath(path.posix.resolve(cwd, parseQuotedText(target)));
    const lines: string[] = [];
    const walk = (nodePath: string, prefix = '') => {
      const nodeType = fsx.statPath(nodePath);
      const base = path.posix.basename(nodePath);
      if (nodeType === 'file') {
        lines.push(`${prefix}${base}`);
        return;
      }
      lines.push(`${prefix}${base || '/'}`);
      const children = fsx.listDir(nodePath);
      for (const child of children) {
        walk(path.posix.join(nodePath, child), `${prefix}  `);
      }
    };
    walk(absolute);
    return { output: lines.join('\n'), cwd };
  }

  if (trimmed.startsWith('git clone ')) {
    const parts = trimmed.split(/\s+/);
    const repoUrl = parts[2];
    const dest = parts[3] ? parseQuotedText(parts[3]) : path.posix.basename(repoUrl.replace(/\.git$/, ''));
    const destPath = path.posix.resolve(cwd, dest);
    fsx.mkdirp(destPath);
    fsx.writeFile(path.posix.join(destPath, 'README.md'), `Cloned in local emulation from ${repoUrl}\n`);
    return { output: `Cloned ${repoUrl} into ${dest}`, cwd };
  }

  if (trimmed.startsWith('npm install') || trimmed.startsWith('pnpm install') || trimmed.startsWith('yarn install')) {
    fsx.mkdirp(path.posix.resolve(cwd, 'node_modules'));
    fsx.writeFile(path.posix.resolve(cwd, 'node_modules/.emulated-install'), 'installed in local emulation');
    return { output: 'Packages installed in local emulation.', cwd };
  }

  if (trimmed.startsWith('npm run ')) {
    const script = trimmed.slice('npm run '.length).trim();
    return { output: `Emulated npm script completed: ${script}`, cwd };
  }

  if (trimmed.startsWith('python') || trimmed.startsWith('node ')) {
    return { output: 'Executed in local emulation.', cwd };
  }

  return {
    output: `Emulated shell does not support: ${trimmed}`,
    cwd,
  };
}

async function runCommandSequence(
  fsx: VirtualFilesystem,
  command: string,
  workDir: string,
): Promise<RunCommandResult> {
  const segments = command
    .split(/&&/)
    .map((part) => part.trim())
    .filter(Boolean);

  let cwd = normalizeVirtualPath(workDir || '/workspace');
  fsx.mkdirp(cwd);
  const outputs: string[] = [];

  for (const segment of segments) {
    const result = await runCommandSegment(fsx, cwd, segment);
    cwd = result.cwd;
    if (result.output) {
      outputs.push(result.output);
    }
  }

  return {
    stdout: outputs.join('\n').trim(),
    stderr: '',
    exitCode: 0,
  };
}

export class EmulatedSandboxProvider implements SandboxProvider {
  private sandboxes = new Map<string, SandboxState>();

  private getState(id: string): SandboxState {
    const state = this.sandboxes.get(id);
    if (!state) {
      throw new Error(`Sandbox ${id} not found`);
    }
    return state;
  }

  private getFs(id: string) {
    return new VirtualFilesystem(this.getState(id).root);
  }

  async createSandbox(id: string): Promise<void> {
    this.sandboxes.set(id, {
      status: 'running',
      root: createDir(),
      mounts: [],
    });

    const fsx = this.getFs(id);
    fsx.mkdirp('/workspace');
  }

  async startSandbox(id: string): Promise<void> {
    const state = this.getState(id);
    state.status = 'running';
  }

  async stopSandbox(id: string): Promise<void> {
    const state = this.getState(id);
    state.status = 'stopped';
  }

  async deleteSandbox(id: string): Promise<void> {
    this.sandboxes.delete(id);
  }

  async executeCommand(id: string, command: string, workDir = ''): Promise<RunCommandResult> {
    const state = this.getState(id);
    if (state.status === 'stopped') {
      state.status = 'running';
    }
    return await runCommandSequence(this.getFs(id), command, workDir || '/workspace');
  }

  async writeFile(id: string, filePath: string, content: string): Promise<void> {
    const fsx = this.getFs(id);
    fsx.mkdirp('/workspace');
    fsx.writeFile(filePath, content);
  }

  async readFile(id: string, filePath: string): Promise<string> {
    return this.getFs(id).readFile(filePath);
  }

  async mountDirectory(id: string, hostPath: string, sandboxPath: string): Promise<void> {
    const fsx = this.getFs(id);
    const state = this.getState(id);
    const absoluteSandboxPath = normalizeVirtualPath(sandboxPath);

    if (!fs.existsSync(hostPath)) {
      throw new Error(`Host path not found: ${hostPath}`);
    }

    const stats = fs.statSync(hostPath);
    if (stats.isDirectory()) {
      fsx.copyHostDirectory(hostPath, absoluteSandboxPath);
    } else {
      fsx.copyHostFile(hostPath, absoluteSandboxPath);
    }

    state.mounts.push({ hostPath, sandboxPath: absoluteSandboxPath });
  }

  async getSandboxStatus(id: string): Promise<'provisioning' | 'running' | 'stopped' | 'failed'> {
    return this.getState(id).status;
  }

  getMounts(id: string): SandboxMount[] {
    return this.getState(id).mounts;
  }
}
