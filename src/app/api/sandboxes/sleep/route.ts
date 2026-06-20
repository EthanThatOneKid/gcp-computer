import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sandboxManager } from '@/services/sandbox/manager';
import { getDb } from '@/db/index';

async function verifySandboxOwnership(sandboxId: string, userId: string): Promise<boolean> {
  const db = getDb();
  try {
    const result = db
      .prepare(
        `SELECT c.user_id 
       FROM chats c
       JOIN chat_sandboxes cs ON c.id = cs.chat_id
       WHERE cs.sandbox_id = ?`,
      )
      .get(sandboxId) as { user_id: string } | undefined;
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
  const userId = (session.user as any).id;

  if (!sandboxId) {
    return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 });
  }

  if (!(await verifySandboxOwnership(sandboxId, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await sandboxManager.stopSandbox(sandboxId);
    return NextResponse.json({ success: true, status: 'stopped' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to hibernate' }, { status: 500 });
  }
}
