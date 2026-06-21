import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const db = getDb();

  try {
    const chats = await db
      .prepare(
        `SELECT c.id, c.title, c.created_at,
        (SELECT m.content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
        FROM chats c
        WHERE c.user_id = ?
        ORDER BY COALESCE(last_message_time, c.created_at) DESC`,
      )
      .all(userId) as any[];

    return NextResponse.json(chats);
  } catch (error: any) {
    console.error('[API Chats] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { title } = await req.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const db = getDb();
  const chatId = uuidv4();

  try {
    await db.prepare('INSERT INTO chats (id, user_id, title) VALUES (?, ?, ?)').run(
      chatId,
      userId,
      title,
    );

    // Initialize sandbox in background
    const sandbox = await sandboxManager.getOrCreateSandboxForChat(chatId);

    return NextResponse.json(
      {
        id: chatId,
        title,
        sandbox,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[API Chats] Create error:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
