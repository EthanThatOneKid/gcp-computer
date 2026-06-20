import { getDb } from '@/db/index';
import { SandboxProvider, SandboxMount, SandboxStatusInfo } from './provider';
import { MockSandboxProvider } from './mock';
import { DockerSandboxProvider } from './docker';
import { GCPComputeSandboxProvider } from './gcp';
import { v4 as uuidv4 } from 'uuid';

const providerType = process.env.SANDBOX_PROVIDER || 'mock'; // 'gcp' | 'docker' | 'mock'
const timeoutMs = process.env.SANDBOX_TIMEOUT_MS
  ? parseInt(process.env.SANDBOX_TIMEOUT_MS)
  : 10 * 60 * 1000; // 10 mins

class SandboxManager {
  private provider: SandboxProvider;
  private activeTimestamps: Map<string, number> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (providerType === 'gcp') {
      this.provider = new GCPComputeSandboxProvider();
    } else if (providerType === 'docker') {
      this.provider = new DockerSandboxProvider();
    } else {
      this.provider = new MockSandboxProvider();
    }

    // Start reaper on server start
    this.startReaper();
  }

  startReaper() {
    if (typeof window !== 'undefined') return; // Server only
    if (this.intervalId) return;

    console.log(`[SandboxManager] Starting idle reaper. Timeout: ${timeoutMs / 1000}s`);
    this.intervalId = setInterval(async () => {
      await this.reapIdleSandboxes();
    }, 30000); // Check every 30 seconds
  }

  stopReaper() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async reapIdleSandboxes() {
    const now = Date.now();

    try {
      const db = getDb();
      // Find all running sandboxes
      const runningSandboxes = db
        .prepare(`SELECT id, last_active_at FROM sandbox_instances WHERE status = 'running'`)
        .all() as { id: string; last_active_at: string }[];

      for (const sb of runningSandboxes) {
        const lastActiveDb = new Date(sb.last_active_at + 'Z').getTime();
        const lastActiveMem = this.activeTimestamps.get(sb.id) || 0;
        const lastActive = Math.max(lastActiveDb, lastActiveMem);

        if (now - lastActive > timeoutMs) {
          console.log(`[SandboxManager] Sandbox ${sb.id} is idle for >10 mins. Stopping...`);
          try {
            await this.provider.stopSandbox(sb.id);

            db.prepare(
              `UPDATE sandbox_instances SET status = 'stopped', last_active_at = ? WHERE id = ?`,
            ).run(new Date().toISOString(), sb.id);

            this.activeTimestamps.delete(sb.id);
            console.log(`[SandboxManager] Sandbox ${sb.id} hibernation complete.`);
          } catch (err) {
            console.error(`[SandboxManager] Failed to stop sandbox ${sb.id}:`, err);
          }
        }
      }
    } catch (e) {
      // Database might not be initialized yet
    }
  }

  touchSandbox(id: string) {
    const now = Date.now();
    this.activeTimestamps.set(id, now);

    try {
      const db = getDb();
      db.prepare(`UPDATE sandbox_instances SET last_active_at = ? WHERE id = ?`).run(
        new Date().toISOString(),
        id,
      );
    } catch (e) {
      console.error('[SandboxManager] Touch failed:', e);
    }
  }

  async getOrCreateSandboxForChat(chatId: string): Promise<SandboxStatusInfo> {
    const db = getDb();

    const sandbox = db
      .prepare(
        `SELECT s.id, s.provider, s.status, s.connection_info, s.last_active_at 
       FROM sandbox_instances s
       JOIN chat_sandboxes cs ON s.id = cs.sandbox_id
       WHERE cs.chat_id = ?`,
      )
      .get(chatId) as
      | {
          id: string;
          provider: string;
          status: string;
          connection_info: string;
          last_active_at: string;
        }
      | undefined;

    let sandboxId: string;

    if (!sandbox) {
      sandboxId = uuidv4();
      console.log(`[SandboxManager] Provisioning new ${providerType} sandbox for chat ${chatId}`);

      // Update DB to provisioning immediately
      const connInfo = JSON.stringify({
        createdAt: new Date().toISOString(),
        hostWorkspace: `sandboxes/${sandboxId}`,
      });

      db.prepare(
        `INSERT INTO sandbox_instances (id, provider, status, connection_info, last_active_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(sandboxId, providerType, 'provisioning', connInfo, new Date().toISOString());

      db.prepare(`INSERT INTO chat_sandboxes (chat_id, sandbox_id) VALUES (?, ?)`).run(
        chatId,
        sandboxId,
      );

      // Async creation so we don't block the UI
      this.provider
        .createSandbox(sandboxId)
        .then(() => {
          db.prepare(
            `UPDATE sandbox_instances SET status = 'running', last_active_at = ? WHERE id = ?`,
          ).run(new Date().toISOString(), sandboxId);
          console.log(`[SandboxManager] Sandbox ${sandboxId} running.`);
        })
        .catch((err) => {
          db.prepare(`UPDATE sandbox_instances SET status = 'failed' WHERE id = ?`).run(sandboxId);
          console.error(`[SandboxManager] Sandbox ${sandboxId} creation failed:`, err);
        });

      return {
        id: sandboxId,
        provider: providerType as any,
        status: 'provisioning',
        mounts: [],
        lastActive: Date.now(),
      };
    } else {
      sandboxId = sandbox.id;

      if (sandbox.status === 'stopped') {
        console.log(`[SandboxManager] Waking up sandbox ${sandboxId}...`);

        db.prepare(
          `UPDATE sandbox_instances SET status = 'provisioning', last_active_at = ? WHERE id = ?`,
        ).run(new Date().toISOString(), sandboxId);

        this.provider
          .startSandbox(sandboxId)
          .then(() => {
            db.prepare(
              `UPDATE sandbox_instances SET status = 'running', last_active_at = ? WHERE id = ?`,
            ).run(new Date().toISOString(), sandboxId);
          })
          .catch((err) => {
            db.prepare(`UPDATE sandbox_instances SET status = 'failed' WHERE id = ?`).run(
              sandboxId,
            );
            console.error(`[SandboxManager] Wakeup failed for ${sandboxId}:`, err);
          });
      }
    }

    this.touchSandbox(sandboxId);

    const currentStatus = await this.provider.getSandboxStatus(sandboxId);
    let mounts: SandboxMount[] = [];
    if ((this.provider as any).getMounts) {
      mounts = (this.provider as any).getMounts(sandboxId);
    }

    const ipAddress = this.provider.getIpAddress
      ? await this.provider.getIpAddress(sandboxId)
      : undefined;

    return {
      id: sandboxId,
      provider: sandbox.provider as any,
      status: currentStatus,
      mounts,
      lastActive: this.activeTimestamps.get(sandboxId) || Date.now(),
      ipAddress,
    };
  }

  async executeCommand(sandboxId: string, command: string, workDir?: string) {
    this.touchSandbox(sandboxId);
    return await this.provider.executeCommand(sandboxId, command, workDir);
  }

  async writeFile(sandboxId: string, filePath: string, content: string) {
    this.touchSandbox(sandboxId);
    return await this.provider.writeFile(sandboxId, filePath, content);
  }

  async readFile(sandboxId: string, filePath: string) {
    this.touchSandbox(sandboxId);
    return await this.provider.readFile(sandboxId, filePath);
  }

  async mountDirectory(sandboxId: string, hostPath: string, sandboxPath: string) {
    this.touchSandbox(sandboxId);
    await this.provider.mountDirectory(sandboxId, hostPath, sandboxPath);
  }

  async getSandboxDetails(sandboxId: string): Promise<SandboxStatusInfo> {
    const db = getDb();
    const sandbox = db
      .prepare(`SELECT provider, status FROM sandbox_instances WHERE id = ?`)
      .get(sandboxId) as { provider: string; status: string } | undefined;

    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    const currentStatus = await this.provider.getSandboxStatus(sandboxId);
    let mounts: SandboxMount[] = [];
    if ((this.provider as any).getMounts) {
      mounts = (this.provider as any).getMounts(sandboxId);
    }
    const ipAddress = this.provider.getIpAddress
      ? await this.provider.getIpAddress(sandboxId)
      : undefined;

    return {
      id: sandboxId,
      provider: sandbox.provider as any,
      status: currentStatus,
      mounts,
      lastActive: this.activeTimestamps.get(sandboxId) || Date.now(),
      ipAddress,
    };
  }

  async stopSandbox(sandboxId: string) {
    await this.provider.stopSandbox(sandboxId);
    const db = getDb();
    db.prepare(
      `UPDATE sandbox_instances SET status = 'stopped', last_active_at = ? WHERE id = ?`,
    ).run(new Date().toISOString(), sandboxId);
    this.activeTimestamps.delete(sandboxId);
  }
}

export const sandboxManager = new SandboxManager();
