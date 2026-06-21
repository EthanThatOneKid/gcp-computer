import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';
import { streamText, tool, toUIMessageStream, createUIMessageStreamResponse, isStepCount } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id: string;
}

interface MessageInput {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
}

export async function POST(req: NextRequest) {
  // 1. Authenticate user session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as SessionUser).id;
  const { chatId, messages, sandboxId } = await req.json();

  if (!chatId || !messages || !sandboxId) {
    return NextResponse.json(
      { error: 'chatId, messages, and sandboxId are required' },
      { status: 400 },
    );
  }

    const db = getDb();

    try {
      // 2. Verify chat ownership
      const chat = await db
        .prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?')
        .get(chatId, userId);
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 403 });
      }

      // 3. Save latest user message to DB
      const latestUserMessage = messages[messages.length - 1];
      if (latestUserMessage && latestUserMessage.role === 'user') {
        const userMsgId = uuidv4();
        await db.prepare(
          'INSERT INTO messages (id, chat_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)',
        ).run(userMsgId, chatId, 'user', latestUserMessage.content, new Date().toISOString());
      }

    // 4. Stream AI response with tools calling loop
    const systemPrompt = `You are an agent with access to a secure sandboxed development environment. 
You can run shell commands, create or write files, read files, and mount host directories.
You are currently connected to Sandbox ID: "${sandboxId}".
Use the provided tools to run commands, edit files, and check execution outputs before finishing.
Format command outputs or file listings nicely in markdown. Always explain what you did and summarize command results.`;

    const result = await streamText({
      model: google('models/gemini-1.5-flash'),
      system: systemPrompt,
      messages: messages.map((m: MessageInput) => ({
        role: m.role,
        content: m.content,
      })),
      stopWhen: isStepCount(10), // Multi-turn tool calling
      tools: {
        execute_command: tool({
          description:
            'Run any shell command inside the secure Linux sandbox. Returns stdout, stderr, and exit code.',
          inputSchema: z.object({
            command: z.string().describe('The bash/shell command to execute.'),
            workDir: z
              .string()
              .optional()
              .describe('Optional working directory path (relative to /workspace).'),
          }),
          execute: async ({ command, workDir }: { command: string; workDir?: string }) => {
            console.log(`[EVE Tool] execute_command: "${command}"`);
            return await sandboxManager.executeCommand(sandboxId, command, workDir);
          },
        }),
        write_file: tool({
          description:
            'Creates a new file or overwrites an existing file inside the sandbox workspace.',
          inputSchema: z.object({
            filePath: z.string().describe('The target filename or path inside the workspace.'),
            content: z.string().describe('The text content to write to the file.'),
          }),
          execute: async ({ filePath, content }: { filePath: string; content: string }) => {
            console.log(`[EVE Tool] write_file: ${filePath}`);
            await sandboxManager.writeFile(sandboxId, filePath, content);
            return { success: true, message: `Successfully wrote file to ${filePath}` };
          },
        }),
        read_file: tool({
          description: 'Reads the text content of a file from the sandbox workspace.',
          inputSchema: z.object({
            filePath: z.string().describe('The filename or path to read.'),
          }),
          execute: async ({ filePath }: { filePath: string }) => {
            console.log(`[EVE Tool] read_file: ${filePath}`);
            const content = await sandboxManager.readFile(sandboxId, filePath);
            return { success: true, content };
          },
        }),
        mount_directory: tool({
          description:
            'Simulates or performs mounting a host directory path to a sandbox mount point path.',
          inputSchema: z.object({
            hostPath: z.string().describe('The physical host machine directory path.'),
            sandboxPath: z
              .string()
              .describe('The mount target path inside the sandbox container (e.g. /mnt/data).'),
          }),
          execute: async ({ hostPath, sandboxPath }: { hostPath: string; sandboxPath: string }) => {
            console.log(`[EVE Tool] mount_directory: ${hostPath} -> ${sandboxPath}`);
            await sandboxManager.mountDirectory(sandboxId, hostPath, sandboxPath);
            return { success: true, message: `Successfully mounted ${hostPath} to ${sandboxPath}` };
          },
        }),
      },
      onFinish: async ({ text, toolResults }) => {
        try {
          const agentMsgId = uuidv4();

          // Format tool calls for DB
          const parsedTools = toolResults?.map((t) => ({
            toolName: t.toolName,
            arguments: t.input,
            output: t.output || { success: true },
          }));

          await db.prepare(
            'INSERT INTO messages (id, chat_id, sender, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          ).run(
            agentMsgId,
            chatId,
            'agent',
            text || 'Running sandbox tools...',
            parsedTools && parsedTools.length > 0 ? JSON.stringify(parsedTools) : null,
            new Date().toISOString(),
          );
          console.log(`[API Agent] Persisted agent turn in database for chat ${chatId}`);
        } catch (dbErr) {
          console.error('[API Agent] Failed to save agent response to database:', dbErr);
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
      }),
    });
  } catch (error: unknown) {
    console.error('[API Agent] Thread execution error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Agent failed to respond';
    // Offline/Fallback Smart Mock Agent
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
