import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id: chatId } = await params;
  const db = getDb();

  try {
    const chat = db
      .prepare('SELECT id, title FROM chats WHERE id = ? AND user_id = ?')
      .get(chatId, userId) as { id: string; title: string } | undefined;

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = db
      .prepare(
        'SELECT id, sender, content, tool_calls, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      )
      .all(chatId) as any[];

    const parsedMessages = messages.map((msg) => ({
      ...msg,
      tool_calls: msg.tool_calls ? JSON.parse(msg.tool_calls) : null,
    }));

    const sandbox = await sandboxManager.getOrCreateSandboxForChat(chatId);

    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      messages: parsedMessages,
      sandbox,
    });
  } catch (error: any) {
    console.error('[API Chat Detail] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat details' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id: chatId } = await params;
  const db = getDb();

  try {
    const chat = db
      .prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?')
      .get(chatId, userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const links = db
      .prepare('SELECT sandbox_id FROM chat_sandboxes WHERE chat_id = ?')
      .all(chatId) as { sandbox_id: string }[];

    // Delete chat (cascades to messages and chat_sandboxes)
    db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);

    // Clean up sandboxes
    for (const link of links) {
      const activeCount = (
        db
          .prepare('SELECT COUNT(*) as count FROM chat_sandboxes WHERE sandbox_id = ?')
          .get(link.sandbox_id) as any
      ).count;

      if (activeCount === 0) {
        await sandboxManager.stopSandbox(link.sandbox_id);
        db.prepare('DELETE FROM sandbox_instances WHERE id = ?').run(link.sandbox_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Chat Detail] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
