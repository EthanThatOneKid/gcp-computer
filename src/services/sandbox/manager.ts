import { getDb, transaction } from '@/db/index';
import { getRuntimeConfig } from '@/config/runtime';
import { SandboxProvider, SandboxStatusInfo } from './provider';
import { EmulatedSandboxProvider } from './emulated';
import { MockSandboxProvider } from './mock';
import { DockerSandboxProvider } from './docker';
import { GCPComputeSandboxProvider } from './gcp';
import { v4 as uuidv4 } from 'uuid';

const runtime = getRuntimeConfig();
const providerType = runtime.sandboxProvider;
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
    } else if (providerType === 'emulated') {
      this.provider = new EmulatedSandboxProvider();
    } else {
      this.provider = new MockSandboxProvider();
    }

    // Start reaper on server start
    this.startReaper();
  }

  startReaper() {
    if (typeof window !== 'undefined') return; // Server only
    if (process.env.NODE_ENV === 'production') return;
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
      const runningSandboxes = (await db
        .prepare(`SELECT id, last_active_at FROM sandbox_instances WHERE status = 'running'`)
        .all()) as { id: string; last_active_at: string }[];

      for (const sb of runningSandboxes) {
        const lastActiveDb = new Date(sb.last_active_at + 'Z').getTime();
        const lastActiveMem = this.activeTimestamps.get(sb.id) || 0;
        const lastActive = Math.max(lastActiveDb, lastActiveMem);

        if (now - lastActive > timeoutMs) {
          console.log(`[SandboxManager] Sandbox ${sb.id} is idle for >10 mins. Stopping...`);
          try {
            await this.provider.stopSandbox(sb.id);

            await db
              .prepare(
                `UPDATE sandbox_instances SET status = 'stopped', last_active_at = ? WHERE id = ?`,
              )
              .run(new Date().toISOString(), sb.id);

            this.activeTimestamps.delete(sb.id);
            console.log(`[SandboxManager] Sandbox ${sb.id} hibernation complete.`);
          } catch (err) {
            console.error(`[SandboxManager] Failed to stop sandbox ${sb.id}:`, err);
          }
        }
      }
    } catch {
      // Database might not be initialized yet
    }
  }

  async touchSandbox(id: string) {
    const now = Date.now();
    this.activeTimestamps.set(id, now);

    try {
      const db = getDb();
      await db
        .prepare(`UPDATE sandbox_instances SET last_active_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), id);
    } catch (e) {
      console.error('[SandboxManager] Touch failed:', e);
    }
  }

  async startSandbox(sandboxId: string, wait = false): Promise<void> {
    const db = getDb();

    // First, let's update the status in the DB to provisioning
    await db
      .prepare(
        `UPDATE sandbox_instances SET status = 'provisioning', last_active_at = ? WHERE id = ?`,
      )
      .run(new Date().toISOString(), sandboxId);

    const doStart = async () => {
      try {
        console.log(`[SandboxManager] Waking up sandbox ${sandboxId}...`);
        await this.provider.startSandbox(sandboxId);

        // Fetch IP address and update DB with cached IP address
        const ipAddress = this.provider.getIpAddress
          ? await this.provider.getIpAddress(sandboxId)
          : undefined;

        // Fetch connection_info
        const row = (await db
          .prepare(`SELECT connection_info FROM sandbox_instances WHERE id = ?`)
          .get(sandboxId)) as { connection_info: string } | undefined;
        let connInfo: Record<string, unknown> = {};
        if (row?.connection_info) {
          try {
            connInfo = JSON.parse(row.connection_info) as Record<string, unknown>;
          } catch {
            // connection_info is malformed
          }
        }
        if (ipAddress) {
          connInfo.ipAddress = ipAddress;
        }

        // Wait/poll until the agent is actually responsive
        let retries = 30; // 30 * 5s = 150s (2.5 minutes)
        let status = 'provisioning';
        while (retries > 0) {
          status = await this.provider.getSandboxStatus(sandboxId);
          if (status === 'running' || status === 'failed' || status === 'stopped') {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
          retries--;
        }

        if (status !== 'running') {
          throw new Error('Sandbox VM started but agent was unreachable.');
        }

        await db
          .prepare(
            `UPDATE sandbox_instances SET status = 'running', connection_info = ?, last_active_at = ? WHERE id = ?`,
          )
          .run(JSON.stringify(connInfo), new Date().toISOString(), sandboxId);

        console.log(`[SandboxManager] Sandbox ${sandboxId} successfully started & IP updated.`);
      } catch (err) {
        await db
          .prepare(`UPDATE sandbox_instances SET status = 'failed' WHERE id = ?`)
          .run(sandboxId);
        console.error(`[SandboxManager] startSandbox failed for ${sandboxId}:`, err);
      }
    };

    if (wait) {
      await doStart();
    } else {
      doStart().catch((err) =>
        console.error(`[SandboxManager] Background startSandbox failed:`, err),
      );
    }
  }

  async getOrCreateSandboxForChat(chatId: string): Promise<SandboxStatusInfo> {
    const db = getDb();

    const sandbox = (await db
      .prepare(
        `SELECT s.id, s.provider, s.status, s.connection_info, s.last_active_at 
       FROM sandbox_instances s
       JOIN chat_sandboxes cs ON s.id = cs.sandbox_id
       WHERE cs.chat_id = ?`,
      )
      .get(chatId)) as
      | {
          id: string;
          provider: string;
          status: string;
          connection_info: string;
          last_active_at: string;
        }
      | undefined;

    let sandboxId: string;
    let currentStatus = sandbox?.status;
    let connInfoStr = sandbox?.connection_info;

    if (!sandbox) {
      // Find the user ID for this chat
      const chatRow = (await db.prepare('SELECT user_id FROM chats WHERE id = ?').get(chatId)) as
        | { user_id: string }
        | undefined;

      if (!chatRow) {
        throw new Error(`Chat ${chatId} not found`);
      }
      const userId = chatRow.user_id;

      // Find if this user already has an active or stopped sandbox linked to any other chat
      const existingUserSandbox = (await db
        .prepare(
          `SELECT s.id, s.provider, s.status, s.connection_info, s.last_active_at 
         FROM sandbox_instances s
         JOIN chat_sandboxes cs ON s.id = cs.sandbox_id
         JOIN chats c ON cs.chat_id = c.id
         WHERE c.user_id = ?
         LIMIT 1`,
        )
        .get(userId)) as
        | {
            id: string;
            provider: string;
            status: string;
            connection_info: string;
            last_active_at: string;
          }
        | undefined;

      if (existingUserSandbox) {
        sandboxId = existingUserSandbox.id;
        currentStatus = existingUserSandbox.status;
        connInfoStr = existingUserSandbox.connection_info;
        const displayProviderType = providerType === 'mock' ? 'local host' : providerType;
        console.log(
          `[SandboxManager] Reusing existing ${displayProviderType} sandbox ${sandboxId} for user ${userId} in chat ${chatId}`,
        );

        // Insert link into chat_sandboxes
        await db
          .prepare('INSERT INTO chat_sandboxes (chat_id, sandbox_id) VALUES (?, ?)')
          .run(chatId, sandboxId);
      } else {
        sandboxId = uuidv4();
        currentStatus = 'provisioning';
        const displayProviderType = providerType === 'mock' ? 'local host' : providerType;
        console.log(
          `[SandboxManager] Provisioning new ${displayProviderType} sandbox for chat ${chatId}`,
        );

        // Update DB to provisioning immediately
        const connInfoObj = {
          createdAt: new Date().toISOString(),
          hostWorkspace: `sandboxes/${sandboxId}`,
        };
        connInfoStr = JSON.stringify(connInfoObj);

        await transaction(async (client) => {
          await client.query(
            `INSERT INTO sandbox_instances (id, provider, status, connection_info, last_active_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [sandboxId, providerType, 'provisioning', connInfoStr, new Date().toISOString()],
          );

          await client.query(`INSERT INTO chat_sandboxes (chat_id, sandbox_id) VALUES ($1, $2)`, [
            chatId,
            sandboxId,
          ]);
        });

        // Async creation so we don't block the UI
        const doCreate = async () => {
          try {
            await this.provider.createSandbox(sandboxId);
            const ipAddress = this.provider.getIpAddress
              ? await this.provider.getIpAddress(sandboxId)
              : undefined;

            const updatedConnObj = { ...connInfoObj, ipAddress };

            // Wait/poll until the agent is actually responsive
            let retries = 30; // 30 * 5s = 150s (2.5 minutes)
            let status = 'provisioning';
            while (retries > 0) {
              status = await this.provider.getSandboxStatus(sandboxId);
              if (status === 'running' || status === 'failed' || status === 'stopped') {
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 5000));
              retries--;
            }

            if (status !== 'running') {
              throw new Error('Sandbox VM created but agent was unreachable.');
            }

            await db
              .prepare(
                `UPDATE sandbox_instances SET status = 'running', connection_info = ?, last_active_at = ? WHERE id = ?`,
              )
              .run(JSON.stringify(updatedConnObj), new Date().toISOString(), sandboxId);
            console.log(`[SandboxManager] Sandbox ${sandboxId} running.`);
          } catch (err) {
            await db
              .prepare(`UPDATE sandbox_instances SET status = 'failed' WHERE id = ?`)
              .run(sandboxId);
            console.error(`[SandboxManager] Sandbox ${sandboxId} creation failed:`, err);
          }
        };

        void doCreate();
      }
    } else {
      sandboxId = sandbox.id;
    }

    void this.touchSandbox(sandboxId);

    // Get mounts
    const mounts = this.provider.getMounts?.(sandboxId) || [];

    // Read cached connection_info
    let connInfo: { ipAddress?: string; [key: string]: unknown } = {};
    if (connInfoStr) {
      try {
        connInfo = JSON.parse(connInfoStr) as { ipAddress?: string; [key: string]: unknown };
      } catch {
        // connection_info is malformed
      }
    }

    return {
      id: sandboxId,
      provider: (sandbox?.provider || providerType) as 'mock' | 'docker' | 'gcp' | 'emulated',
      status: currentStatus as 'provisioning' | 'running' | 'stopped' | 'failed',
      mounts,
      lastActive:
        this.activeTimestamps.get(sandboxId) ||
        new Date((sandbox?.last_active_at || new Date().toISOString()) + 'Z').getTime(),
      ipAddress: connInfo.ipAddress,
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
    const sandbox = (await db
      .prepare(
        `SELECT provider, status, connection_info, last_active_at FROM sandbox_instances WHERE id = ?`,
      )
      .get(sandboxId)) as
      | { provider: string; status: string; connection_info: string; last_active_at: string }
      | undefined;

    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    const currentStatus = await this.provider.getSandboxStatus(sandboxId);

    const mounts = this.provider.getMounts?.(sandboxId) || [];

    let ipAddress: string | undefined = undefined;
    if (currentStatus === 'running' && this.provider.getIpAddress) {
      ipAddress = await this.provider.getIpAddress(sandboxId);
    }

    // Read/update cached connection_info
    let connInfo: { ipAddress?: string; [key: string]: unknown } = {};
    if (sandbox.connection_info) {
      try {
        connInfo = JSON.parse(sandbox.connection_info) as {
          ipAddress?: string;
          [key: string]: unknown;
        };
      } catch {
        // connection_info is malformed
      }
    }

    let updated = false;
    if (currentStatus !== sandbox.status) {
      sandbox.status = currentStatus;
      updated = true;
    }
    if (ipAddress && connInfo.ipAddress !== ipAddress) {
      connInfo.ipAddress = ipAddress;
      updated = true;
    }

    if (updated) {
      await db
        .prepare(
          `UPDATE sandbox_instances SET status = ?, connection_info = ?, last_active_at = ? WHERE id = ?`,
        )
        .run(sandbox.status, JSON.stringify(connInfo), new Date().toISOString(), sandboxId);
    }

    return {
      id: sandboxId,
      provider: sandbox.provider as 'mock' | 'docker' | 'gcp' | 'emulated',
      status: currentStatus,
      mounts,
      lastActive:
        this.activeTimestamps.get(sandboxId) || new Date(sandbox.last_active_at + 'Z').getTime(),
      ipAddress: connInfo.ipAddress || ipAddress,
    };
  }

  async stopSandbox(sandboxId: string) {
    await this.provider.stopSandbox(sandboxId);
    const db = getDb();
    await db
      .prepare(`UPDATE sandbox_instances SET status = 'stopped', last_active_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), sandboxId);
    this.activeTimestamps.delete(sandboxId);
  }
}

export const sandboxManager = new SandboxManager();
