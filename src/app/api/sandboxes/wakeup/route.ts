import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sandboxManager } from '@/services/sandbox/manager';
import { getDb } from '@/db/index';

async function verifySandboxOwnership(sandboxId: string, userId: string): Promise<boolean> {
  const db = getDb();
  try {
    const result = (await db
      .prepare(
        `SELECT c.user_id 
       FROM chats c
       JOIN chat_sandboxes cs ON c.id = cs.chat_id
       WHERE cs.sandbox_id = ?`,
      )
      .get(sandboxId)) as { user_id: string } | undefined;
    return !!result && result.user_id === userId;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sandboxId } = await req.json();
  const userId = (session.user as { id: string }).id;

  if (!sandboxId) {
    return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 });
  }

  if (!(await verifySandboxOwnership(sandboxId, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const row = (await db
      .prepare(`SELECT status FROM sandbox_instances WHERE id = ?`)
      .get(sandboxId)) as { status: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 });
    }

    if (row.status !== 'running' && row.status !== 'provisioning') {
      await sandboxManager.startSandbox(sandboxId, false);
    }

    return NextResponse.json({ success: true, status: 'provisioning' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to wakeup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
