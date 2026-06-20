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
    <div className="rounded-lg border border-white/5 bg-black/40 overflow-hidden text-xs font-mono">
      <div 
         className="flex items-center justify-between px-3 py-2 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {tool.result ? (
            isSuccess ? (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={13} className="text-red-400 shrink-0" />
            )
          ) : (
            <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-blue-400 animate-spin shrink-0" />
          )}
          <span className="flex items-center gap-1.5 font-bold text-blue-300">
            {getToolIcon(tool.toolName)}
            {tool.toolName}
          </span>
          <span className="text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
            : {formatArgs(tool.args)}
          </span>
        </div>
        {expanded ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
      </div>
      {expanded && (
        <div className="p-3 border-t border-white/5 space-y-2 bg-[#090d16]">
          <div className="text-yellow-200/90">
            $ {tool.toolName === 'execute_command' ? tool.args?.command : `${tool.toolName}(${JSON.stringify(tool.args)})`}
          </div>
          <pre className="text-gray-300 overflow-auto max-h-60 p-2 rounded bg-black/50 border border-white/[0.03] whitespace-pre-wrap">
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
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-[#0b0f17]">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 shrink-0">
        <h2 className="text-xl font-bold text-gray-100">{chatTitle}</h2>
        <span className="text-xs text-gray-500 font-mono">Sandbox: {sandboxId.substring(0, 8)}...</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8 space-y-4">
            <h1 className="text-2xl font-bold text-gray-200">Sandbox Agent Console</h1>
            <p className="max-w-md text-sm">Ask the agent to execute shell tasks, create files, or mount external volumes directly inside your Compute Engine VM.</p>
            <div className="flex flex-col gap-2 text-xs opacity-75 max-w-sm">
              <div className="rounded-lg bg-white/5 p-2 text-left cursor-pointer hover:bg-white/10" onClick={() => setInput('Create a Python server script and test it.')}>💡 "Create a Python server script and test it."</div>
              <div className="rounded-lg bg-white/5 p-2 text-left cursor-pointer hover:bg-white/10" onClick={() => setInput('Run git clone and install dependencies.')}>💡 "Run git clone and install dependencies."</div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[85%] ${
              msg.role === 'user' ? 'self-end' : 'self-start'
            }`}
          >
            <span className="text-[10px] font-semibold text-gray-500 mb-1 px-1">
              {msg.role === 'user' ? 'You' : 'Agent'}
            </span>
            <div 
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                msg.role === 'user' 
                  ? 'bg-blue-600 border-blue-500 text-white rounded-tr-sm' 
                  : 'bg-white/5 border-white/5 text-gray-200 rounded-tl-sm'
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
                      <div key={pIdx} className="italic text-gray-400 bg-white/[0.02] border border-white/5 rounded-lg p-2.5 my-1 text-xs font-mono">
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
                      <div key={pIdx} className="mt-2 bg-black/10 rounded-lg">
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
        <div className="flex gap-3 bg-[#0f1422] border border-white/5 p-3 rounded-xl focus-within:border-blue-500 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
          <textarea
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-200 placeholder-gray-600 h-6 max-h-24 leading-relaxed"
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
              className="flex items-center justify-center p-2 rounded-lg bg-red-600 hover:opacity-95 text-white transition-all"
            >
              <div className="h-3 w-3 bg-white rounded-sm animate-pulse" />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="flex items-center justify-center p-2 rounded-lg bg-blue-500 hover:opacity-95 text-white disabled:bg-transparent disabled:text-gray-600 disabled:pointer-events-none transition-all"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
