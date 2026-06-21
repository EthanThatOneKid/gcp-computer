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

  const { sandboxId, hostPath, sandboxPath } = await req.json();
  const userId = (session.user as { id: string }).id;

  if (!sandboxId || !hostPath || !sandboxPath) {
    return NextResponse.json(
      { error: 'sandboxId, hostPath, and sandboxPath are required' },
      { status: 400 },
    );
  }

  if (!(await verifySandboxOwnership(sandboxId, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await sandboxManager.mountDirectory(sandboxId, hostPath, sandboxPath);
    const details = await sandboxManager.getSandboxDetails(sandboxId);
    return NextResponse.json({ success: true, details });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mount failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
