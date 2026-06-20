import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';
import ChatWindowClient from '@/components/ChatWindowClient';
import SandboxStatusClient from '@/components/SandboxStatusClient';

export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }

  const userId = (session.user as any).id;
  const { id: chatId } = await params;
  const db = getDb();

  // Load chat and messages SSR
  const chat = db
    .prepare('SELECT id, title FROM chats WHERE id = ? AND user_id = ?')
    .get(chatId, userId) as { id: string; title: string } | undefined;

  if (!chat) {
    redirect('/dashboard');
  }

  const messages = db
    .prepare(
      'SELECT id, sender, content, tool_calls, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
    )
    .all(chatId) as any[];

  const parsedMessages = messages.map(msg => {
    const role = msg.sender === 'user' ? 'user' : msg.sender === 'agent' ? 'assistant' : 'system';
    const parts: any[] = [];
    
    if (msg.content) {
      parts.push({
        type: 'text',
        text: msg.content,
      });
    }

    if (msg.tool_calls) {
      try {
        const toolCalls = JSON.parse(msg.tool_calls);
        if (Array.isArray(toolCalls)) {
          for (const tc of toolCalls) {
            parts.push({
              type: `tool-${tc.toolName}`,
              toolCallId: tc.toolCallId || `tc-${Math.random().toString(36).substring(2, 9)}`,
              state: 'output-available',
              input: tc.arguments,
              output: tc.output,
            });
          }
        }
      } catch (err) {
        console.error('[ChatPage] Failed to parse historical tool calls:', err);
      }
    }

    return {
      id: msg.id,
      role: role as 'user' | 'assistant' | 'system',
      parts,
      created_at: msg.created_at,
    };
  });

  // Resolve sandbox
  const sandbox = await sandboxManager.getOrCreateSandboxForChat(chatId);

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0b0f17]">
      {/* Center Chat window */}
      <div className="flex h-full flex-1 flex-col border-r border-white/5">
        <ChatWindowClient
          chatId={chatId}
          chatTitle={chat.title}
          initialMessages={parsedMessages}
          sandboxId={sandbox.id}
          token={session ? 'authenticated' : ''}
        />
      </div>

      {/* Right Sandbox control sidebar */}
      <SandboxStatusClient initialSandbox={sandbox} token={session ? 'authenticated' : ''} />
    </div>
  );
}
