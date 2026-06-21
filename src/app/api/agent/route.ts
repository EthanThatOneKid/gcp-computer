import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getRuntimeConfig } from '@/config/runtime';
import { getDb } from '@/db/index';
import { sandboxManager } from '@/services/sandbox/manager';
import {
  streamText,
  tool,
  toUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
} from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import * as executeCommandTool from '../../../../agent/tools/execute_command';
import * as writeFileTool from '../../../../agent/tools/write_file';
import * as readFileTool from '../../../../agent/tools/read_file';
import * as mountDirectoryTool from '../../../../agent/tools/mount_directory';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id: string;
}

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system' | 'data';
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

type DemoToolCall = {
  toolCallId: string;
  toolName: 'execute_command' | 'write_file' | 'read_file' | 'mount_directory';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

function serializeCommandResult(result: { stdout: string; stderr: string; exitCode: number }) {
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

function buildFallbackStream(agentMsgId: string, toolCalls: DemoToolCall[], text: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue({ type: 'start', messageId: agentMsgId });

      for (const tool of toolCalls) {
        controller.enqueue({
          type: 'tool-input-start',
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
        });
        controller.enqueue({
          type: 'tool-input-available',
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
          input: tool.input,
        });
        controller.enqueue({
          type: 'tool-output-available',
          toolCallId: tool.toolCallId,
          output: tool.output,
        });
      }

      const textId = uuidv4();
      controller.enqueue({ type: 'text-start', id: textId });
      controller.enqueue({ type: 'text-delta', id: textId, delta: text });
      controller.enqueue({ type: 'text-end', id: textId });
      controller.enqueue({ type: 'finish', finishReason: 'stop' });
      controller.close();
    },
  });
}

async function runLocalDemoTurn(params: { chatId: string; sandboxId: string; prompt: string }) {
  const { chatId, sandboxId, prompt } = params;
  const normalizedPrompt = prompt.toLowerCase();
  const toolCalls: DemoToolCall[] = [];
  let assistantText = '';

  if (normalizedPrompt.includes('mount')) {
    const hostPath = process.cwd();
    const sandboxPath = '/mnt/local-demo';
    await sandboxManager.mountDirectory(sandboxId, hostPath, sandboxPath);
    const mountToolCallId = uuidv4();
    toolCalls.push({
      toolCallId: mountToolCallId,
      toolName: 'mount_directory',
      input: { hostPath, sandboxPath },
      output: { success: true, message: `Mounted ${hostPath} to ${sandboxPath}` },
    });

    const listCommand = `cd ${sandboxPath} && ls -la`;
    const execToolCallId = uuidv4();
    const execResult = await sandboxManager.executeCommand(sandboxId, listCommand, '/workspace');
    toolCalls.push({
      toolCallId: execToolCallId,
      toolName: 'execute_command',
      input: { command: listCommand, workDir: '/workspace' },
      output: serializeCommandResult(execResult),
    });

    assistantText = `Local emulation mounted the repository at ${sandboxPath} and listed its contents.\n\n\`\`\`\n${execResult.stdout || execResult.stderr || 'No output'}\n\`\`\``;
  } else if (
    normalizedPrompt.includes('write') ||
    normalizedPrompt.includes('create') ||
    normalizedPrompt.includes('file')
  ) {
    const filePath = 'demo-note.txt';
    const content = `Local emulation note for chat ${chatId}.`;
    const writeToolCallId = uuidv4();
    await sandboxManager.writeFile(sandboxId, filePath, content);
    toolCalls.push({
      toolCallId: writeToolCallId,
      toolName: 'write_file',
      input: { filePath, content },
      output: { success: true, message: `Wrote ${filePath}` },
    });

    const readToolCallId = uuidv4();
    const readback = await sandboxManager.readFile(sandboxId, filePath);
    toolCalls.push({
      toolCallId: readToolCallId,
      toolName: 'read_file',
      input: { filePath },
      output: { success: true, content: readback },
    });

    const execToolCallId = uuidv4();
    const execResult = await sandboxManager.executeCommand(
      sandboxId,
      'pwd && ls -la',
      '/workspace',
    );
    toolCalls.push({
      toolCallId: execToolCallId,
      toolName: 'execute_command',
      input: { command: 'pwd && ls -la', workDir: '/workspace' },
      output: serializeCommandResult(execResult),
    });

    assistantText = `Local emulation created ${filePath}, verified the contents, and inspected the workspace.\n\n\`\`\`\n${execResult.stdout || execResult.stderr || 'No output'}\n\`\`\``;
  } else {
    const command = 'pwd && ls -la';
    const execToolCallId = uuidv4();
    const execResult = await sandboxManager.executeCommand(sandboxId, command, '/workspace');
    toolCalls.push({
      toolCallId: execToolCallId,
      toolName: 'execute_command',
      input: { command, workDir: '/workspace' },
      output: serializeCommandResult(execResult),
    });

    assistantText = `Local emulation is active. I inspected the sandbox workspace and got:\n\n\`\`\`\n${execResult.stdout || execResult.stderr || 'No output'}\n\`\`\``;
  }

  const agentMsgId = uuidv4();
  const db = getDb();
  await db
    .prepare(
      'INSERT INTO messages (id, chat_id, sender, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(
      agentMsgId,
      chatId,
      'agent',
      assistantText,
      JSON.stringify(
        toolCalls.map((tool) => ({
          toolName: tool.toolName,
          toolCallId: tool.toolCallId,
          arguments: tool.input,
          output: tool.output,
        })),
      ),
      new Date().toISOString(),
    );

  return createUIMessageStreamResponse({
    stream: buildFallbackStream(agentMsgId, toolCalls, assistantText),
  });
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

  const runtime = getRuntimeConfig();

  const db = getDb();

  try {
    // 2. Verify chat ownership
    const chat = await db
      .prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?')
      .get(chatId, userId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 403 });
    }

    // Helper to get text content from message (handles both plain string content and structured parts)
    const getMessageText = (msg: IncomingMessage | undefined): string => {
      if (!msg) return '';
      if (typeof msg.content === 'string' && msg.content !== '') {
        return msg.content;
      }
      if (Array.isArray(msg.parts)) {
        const textPart = msg.parts.find((p) => p.type === 'text');
        if (textPart && typeof textPart.text === 'string') {
          return textPart.text;
        }
      }
      return '';
    };

    // 3. Save latest user message to DB
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage && latestUserMessage.role === 'user') {
      const userMsgId = uuidv4();
      const userContent = getMessageText(latestUserMessage);
      await db
        .prepare(
          'INSERT INTO messages (id, chat_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run(userMsgId, chatId, 'user', userContent, new Date().toISOString());
    }

    if (runtime.isLocalEmulation || !runtime.geminiEnabled) {
      return await runLocalDemoTurn({
        chatId,
        sandboxId,
        prompt: getMessageText(latestUserMessage),
      });
    }

    // 4. Stream AI response with tools calling loop
    const instructionsPath = path.join(process.cwd(), 'agent/instructions.md');
    const baseInstructions = fs.readFileSync(instructionsPath, 'utf-8');
    const systemPrompt = `${baseInstructions}\n\nYou are currently connected to Sandbox ID: "${sandboxId}".`;

    const result = await streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: messages.map((m: IncomingMessage) => ({
        role: m.role,
        content: getMessageText(m),
      })),
      stopWhen: isStepCount(10), // Multi-turn tool calling
      tools: {
        execute_command: tool({
          description: executeCommandTool.description,
          inputSchema: executeCommandTool.schema,
          execute: async (input) => {
            console.log(`[EVE Tool] execute_command: "${input.command}"`);
            return await executeCommandTool.run(sandboxId, input);
          },
        }),
        write_file: tool({
          description: writeFileTool.description,
          inputSchema: writeFileTool.schema,
          execute: async (input) => {
            console.log(`[EVE Tool] write_file: ${input.filePath}`);
            return await writeFileTool.run(sandboxId, input);
          },
        }),
        read_file: tool({
          description: readFileTool.description,
          inputSchema: readFileTool.schema,
          execute: async (input) => {
            console.log(`[EVE Tool] read_file: ${input.filePath}`);
            return await readFileTool.run(sandboxId, input);
          },
        }),
        mount_directory: tool({
          description: mountDirectoryTool.description,
          inputSchema: mountDirectoryTool.schema,
          execute: async (input) => {
            console.log(`[EVE Tool] mount_directory: ${input.hostPath} -> ${input.sandboxPath}`);
            return await mountDirectoryTool.run(sandboxId, input);
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

          await db
            .prepare(
              'INSERT INTO messages (id, chat_id, sender, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            )
            .run(
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
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
