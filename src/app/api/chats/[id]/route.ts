import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';

type MessageRow = {
  id: string;
  sender: string;
  content: string;
  tool_calls: string | null;
  created_at: string;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id: chatId } = await params;
  const db = getDb();

  try {
    const chat = (await db
      .prepare('SELECT id, title FROM chats WHERE id = ? AND user_id = ?')
      .get(chatId, userId)) as { id: string; title: string } | undefined;

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = (await db
      .prepare(
        'SELECT id, sender, content, tool_calls, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      )
      .all(chatId)) as MessageRow[];

    const parsedMessages = messages.map((msg) => ({
      ...msg,
      tool_calls: msg.tool_calls ? (JSON.parse(msg.tool_calls) as unknown) : null,
    }));

    const sandbox = await sandboxManager.getOrCreateSandboxForChat(chatId);

    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      messages: parsedMessages,
      sandbox,
    });
  } catch (error) {
    console.error('[API Chat Detail] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat details' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id: chatId } = await params;
  const db = getDb();

  try {
    const chat = await db
      .prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?')
      .get(chatId, userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const links = (await db
      .prepare('SELECT sandbox_id FROM chat_sandboxes WHERE chat_id = ?')
      .all(chatId)) as { sandbox_id: string }[];

    // Delete chat (cascades to messages and chat_sandboxes)
    await db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);

    // Clean up sandboxes
    for (const link of links) {
      const activeCount = (
        (await db
          .prepare('SELECT COUNT(*) as count FROM chat_sandboxes WHERE sandbox_id = ?')
          .get(link.sandbox_id)) as { count: number }
      ).count;

      if (activeCount === 0) {
        await sandboxManager.stopSandbox(link.sandbox_id);
        await db.prepare('DELETE FROM sandbox_instances WHERE id = ?').run(link.sandbox_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Chat Detail] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id: chatId } = await params;
  const db = getDb();

  try {
    const { title } = await req.json();
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify chat ownership
    const chat = await db
      .prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?')
      .get(chatId, userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update title
    await db.prepare('UPDATE chats SET title = ? WHERE id = ?').run(title.trim(), chatId);

    return NextResponse.json({ success: true, title: title.trim() });
  } catch (error) {
    console.error('[API Chat Detail] Rename error:', error);
    return NextResponse.json({ error: 'Failed to rename chat' }, { status: 500 });
  }
}
