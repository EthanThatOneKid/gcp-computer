'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Terminal, FileText, HardDrive, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatWindowClientProps {
  chatId: string;
  chatTitle: string;
  initialMessages: UIMessage[];
  sandboxId: string;
  token: string;
}

interface ToolLogItemProps {
  tool: {
    toolName: string;
    args?: {
      command?: string;
      workDir?: string;
      filePath?: string;
      content?: string;
      hostPath?: string;
      sandboxPath?: string;
    };
    result?: {
      stdout?: string;
      stderr?: string;
      exitCode?: number;
      error?: string;
      content?: string;
      message?: string;
    };
    error?: string;
  };
}

interface ToolPart {
  type: string;
  toolName?: string;
  input?: {
    command?: string;
    workDir?: string;
    filePath?: string;
    content?: string;
    hostPath?: string;
    sandboxPath?: string;
  };
  state?: 'input-streaming' | 'input-available' | 'approval-requested' | 'output-available' | 'output-error';
  output?: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    error?: string;
    content?: string;
    message?: string;
  };
  errorText?: string;
}

function ToolLogItem({ tool }: ToolLogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = tool.result && !tool.result.error && (tool.result.exitCode === undefined || tool.result.exitCode === 0);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'execute_command': return <Terminal size={14} />;
      case 'write_file':
      case 'read_file': return <FileText size={14} />;
      case 'mount_directory': return <HardDrive size={14} />;
      default: return <Terminal size={14} />;
    }
  };

  const formatArgs = (args?: ToolLogItemProps['tool']['args']) => {
    if (!args) return '';
    if (args.command) return args.command;
    if (args.filePath) return `${args.filePath} (${args.content ? 'write' : 'read'})`;
    if (args.hostPath) return `${args.hostPath} -> ${args.sandboxPath}`;
    return JSON.stringify(args);
  };

  const getOutputText = (result?: ToolLogItemProps['tool']['result']) => {
    if (!result) return '(executing...)';
    if (result.error) return result.error;
    if (result.content) return result.content;
    if (result.stdout || result.stderr) {
      let txt = '';
      if (result.stdout) txt += result.stdout;
      if (result.stderr) txt += `\nErrors:\n${result.stderr}`;
      return txt;
    }
    return result.message || JSON.stringify(result);
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.06)] bg-[rgba(0,0,0,0.25)] font-mono text-xs">
      <div 
          className="flex cursor-pointer items-center justify-between bg-[rgba(255,255,255,0.03)] px-3 py-2 transition-all hover:bg-[rgba(255,255,255,0.06)]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {tool.result ? (
            isSuccess ? (
              <CheckCircle2 size={13} className="shrink-0 text-[var(--color-lavender)]" />
            ) : (
              <XCircle size={13} className="shrink-0 text-[var(--color-danger)]" />
            )
          ) : (
            <div className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[var(--color-lavender)] border-t-transparent" />
          )}
          <span className="flex items-center gap-1.5 font-semibold text-[var(--color-lavender)]">
            {getToolIcon(tool.toolName)}
            {tool.toolName}
          </span>
          <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-[rgba(255,255,255,0.56)]">
            : {formatArgs(tool.args)}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={13} className="text-[rgba(255,255,255,0.46)]" />
        ) : (
          <ChevronDown size={13} className="text-[rgba(255,255,255,0.46)]" />
        )}
      </div>
      {expanded && (
        <div className="space-y-2 border-t border-[rgba(232,230,228,0.06)] bg-[rgba(0,0,0,0.16)] p-3">
          <div className="text-[rgba(210,190,255,0.9)]">
            $ {tool.toolName === 'execute_command' ? tool.args?.command : `${tool.toolName}(${JSON.stringify(tool.args)})`}
          </div>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] border border-[rgba(232,230,228,0.06)] bg-[rgba(0,0,0,0.24)] p-2 text-[rgba(255,255,255,0.82)]">
            <code>{getOutputText(tool.result)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ChatWindowClient({
  chatId,
  chatTitle,
  initialMessages,
  sandboxId,
}: ChatWindowClientProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = new DefaultChatTransport({
    api: '/api/agent',
    body: {
      chatId,
      sandboxId,
    },
  });

  const { messages, sendMessage, stop, status } = useChat({
    transport,
    messages: initialMessages,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input.trim() });
      setInput('');
    }
  };

  return (
    <div className="gcp-shell flex h-full flex-1 flex-col gap-6 overflow-hidden p-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[rgba(232,230,228,0.08)] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-terracotta)]">
            Session
          </p>
          <h2 className="text-xl font-medium tracking-tight text-[var(--color-pristine-white)]">
            {chatTitle}
          </h2>
        </div>
        <span className="rounded-full border border-[rgba(232,230,228,0.08)] px-3 py-1 text-xs text-[rgba(255,255,255,0.64)]">
          Sandbox: {sandboxId.substring(0, 8)}...
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center text-[rgba(255,255,255,0.68)]">
            <h1 className="text-2xl font-medium tracking-tight text-[var(--color-pristine-white)]">
              Sandbox Agent Console
            </h1>
            <p className="max-w-md text-sm leading-6">
              Ask the agent to execute shell tasks, create files, or mount external volumes inside
              your Compute Engine VM.
            </p>
            <div className="flex max-w-sm flex-col gap-2 text-xs">
              <div
                className="cursor-pointer rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.08)] bg-[rgba(255,255,255,0.04)] p-2 text-left hover:bg-[rgba(210,190,255,0.08)]"
                onClick={() => setInput('Create a Python server script and test it.')}
              >
                💡 &ldquo;Create a Python server script and test it.&rdquo;
              </div>
              <div
                className="cursor-pointer rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.08)] bg-[rgba(255,255,255,0.04)] p-2 text-left hover:bg-[rgba(210,190,255,0.08)]"
                onClick={() => setInput('Run git clone and install dependencies.')}
              >
                💡 &ldquo;Run git clone and install dependencies.&rdquo;
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex max-w-[85%] flex-col ${
              msg.role === 'user' ? 'self-end' : 'self-start'
            }`}
          >
            <span className="mb-1 px-1 text-[10px] font-semibold text-[rgba(255,255,255,0.48)]">
              {msg.role === 'user' ? 'You' : 'Agent'}
            </span>
            <div 
              className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'gcp-chat-bubble-user rounded-tr-sm' 
                  : 'gcp-chat-bubble-assistant rounded-tl-sm'
              }`}
            >
              <div className="space-y-3">
                {msg.parts.map((part, pIdx) => {
                  if (part.type === 'text') {
                    return (
                      <div key={pIdx} className="whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === 'reasoning') {
                    return (
                      <div key={pIdx} className="my-1 rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.08)] bg-[rgba(255,255,255,0.03)] p-2.5 font-mono text-xs italic text-[rgba(255,255,255,0.64)]">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                    const toolPart = part as unknown as ToolPart;
                    const toolName = part.type.startsWith('tool-') 
                      ? part.type.substring(5) 
                      : toolPart.toolName || 'unknown';
                    
                    const toolLog = {
                      toolName,
                      args: toolPart.input,
                      result: toolPart.state === 'output-available' 
                        ? toolPart.output 
                        : (toolPart.state === 'output-error' ? { error: toolPart.errorText } : undefined)
                    };
                    
                    return (
                      <div key={pIdx} className="mt-2 rounded-[var(--radius-md)] bg-[rgba(0,0,0,0.18)]">
                        <ToolLogItem tool={toolLog} />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="gcp-panel flex gap-3 p-3 transition-all focus-within:border-[rgba(210,190,255,0.35)] focus-within:shadow-[0_0_15px_rgba(210,190,255,0.08)]">
          <textarea
            className="max-h-24 h-6 flex-1 resize-none bg-transparent text-sm leading-relaxed text-[var(--color-pristine-white)] outline-none placeholder:text-[rgba(255,255,255,0.4)]"
            placeholder="Type your message or run prompt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {isLoading ? (
            <button 
              type="button" 
              onClick={() => stop()}
              className="flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger)] p-2 text-[var(--color-pristine-white)] transition-all hover:opacity-95"
            >
              <div className="h-3 w-3 animate-pulse rounded-sm bg-white" />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-lavender)] p-2 text-[var(--color-deep-black)] transition-all hover:opacity-95 disabled:pointer-events-none disabled:bg-transparent disabled:text-[rgba(255,255,255,0.3)]"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
