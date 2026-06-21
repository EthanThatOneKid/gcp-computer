import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';
import ChatWindowClient from '@/components/ChatWindowClient';
import SandboxStatusClient from '@/components/SandboxStatusClient';
import type { UIMessage } from '@ai-sdk/react';

export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

type MessageRow = {
  id: string;
  sender: string;
  content: string;
  tool_calls: string | null;
  created_at: string;
};

type ToolCall = {
  toolName: string;
  toolCallId?: string;
  arguments: unknown;
  output: unknown;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }

  const userId = (session.user as { id: string }).id;
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
    .all(chatId) as MessageRow[];

  const parsedMessages = messages.map((msg: MessageRow) => {
    const role = msg.sender === 'user' ? 'user' : msg.sender === 'agent' ? 'assistant' : 'system';
    const parts: Array<{ type: string; [key: string]: unknown }> = [];
    
    if (msg.content) {
      parts.push({
        type: 'text',
        text: msg.content,
      });
    }

    if (msg.tool_calls) {
      try {
        const toolCalls = JSON.parse(msg.tool_calls) as ToolCall[];
        if (Array.isArray(toolCalls)) {
          for (const tc of toolCalls) {
            const toolCallId = tc.toolCallId ?? crypto.randomUUID();
            parts.push({
              type: `tool-${tc.toolName}`,
              toolCallId,
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
  }) as UIMessage[];

  // Resolve sandbox
  const sandbox = await sandboxManager.getOrCreateSandboxForChat(chatId);

  return (
    <div className="gcp-shell flex flex-1 overflow-hidden">
      {/* Center Chat window */}
      <div className="flex h-full flex-1 flex-col border-r border-[rgba(232,230,228,0.08)]">
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
