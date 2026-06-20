import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sandboxManager } from '@/services/sandbox/manager';
import { getDb } from '@/db/index';

// Helper to verify that user owns the chat connected to the sandbox
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: sandboxId } = await params;
  const userId = (session.user as any).id;

  if (!(await verifySandboxOwnership(sandboxId, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const details = await sandboxManager.getSandboxDetails(sandboxId);
    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 400 });
  }
}
