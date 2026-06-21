'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatWindowClient from './ChatWindowClient';
import SandboxStatusClient from './SandboxStatusClient';
import type { SandboxStatusInfo } from '@/services/sandbox/provider';
import type { UIMessage } from '@ai-sdk/react';

interface ChatSessionViewProps {
  chatId: string;
  initialChatTitle: string;
  initialMessages: UIMessage[];
  initialSandbox: SandboxStatusInfo;
  token: string;
}

export default function ChatSessionView({
  chatId,
  initialChatTitle,
  initialMessages,
  initialSandbox,
  token,
}: ChatSessionViewProps) {
  const [sandbox, setSandbox] = useState<SandboxStatusInfo>(initialSandbox);
  const [chatTitle, setChatTitle] = useState<string>(initialChatTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasAutoWokenUpRef = useRef<string | null>(null);

  // Auto-wakeup on load if offline
  useEffect(() => {
    if (hasAutoWokenUpRef.current !== chatId) {
      hasAutoWokenUpRef.current = chatId;
      if (sandbox.status === 'stopped' || sandbox.status === 'failed') {
        console.log(`[ChatSessionView] Initial auto-wakeup triggered for sandbox ${sandbox.id}`);
        const runWakeup = async () => {
          setLoading(true);
          setError('');
          try {
            const res = await fetch('/api/sandboxes/wakeup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId: sandbox.id }),
            });
            if (res.ok) {
              const data = await res.json();
              setSandbox((prev) => ({ ...prev, status: data.status || 'provisioning' }));
            } else {
              const data = await res.json();
              throw new Error(data.error || 'Failed to trigger wakeup');
            }
          } catch (err) {
            console.error('[ChatSessionView] Auto-wakeup failed:', err);
            setError(err instanceof Error ? err.message : 'Auto-wakeup failed');
          } finally {
            setLoading(false);
          }
        };
        void runWakeup();
      }
    }
  }, [chatId, sandbox.id, sandbox.status]);

  // Poll status while provisioning
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/sandboxes/${sandbox.id}`);
        if (res.ok) {
          const data = await res.json();
          setSandbox(data);
          if (data.status !== 'provisioning') {
            clearInterval(timer);
          }
        }
      } catch (err) {
        console.error('Failed status check polling:', err);
      }
    };

    if (sandbox.status === 'provisioning') {
      timer = setInterval(checkStatus, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sandbox.status, sandbox.id]);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/sandboxes/${sandbox.id}`);
      if (!res.ok) {
        throw new Error('Failed to refresh status');
      }
      const data = await res.json();
      setSandbox(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  const handleHibernate = async () => {
    if (
      !confirm(
        'Are you sure you want to hibernate this sandbox instance? Running jobs will be stopped.',
      )
    ) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sandboxes/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: sandbox.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to hibernate sandbox');
      }
      setSandbox((prev) => ({ ...prev, status: 'stopped' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hibernation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWakeup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sandboxes/wakeup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: sandbox.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to wake up sandbox');
      }
      const data = await res.json();
      setSandbox((prev) => ({ ...prev, status: data.status || 'provisioning' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wakeup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMount = async (hostPath: string, sandboxPath: string): Promise<boolean> => {
    setError('');
    try {
      const res = await fetch('/api/sandboxes/mount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId: sandbox.id,
          hostPath: hostPath.trim(),
          sandboxPath: sandboxPath.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Mount failed');
      }

      const data = await res.json();
      if (data.details) {
        setSandbox(data.details);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Directory mount failed');
      return false;
    }
  };

  const handleRenameChat = async (newTitle: string): Promise<boolean> => {
    setError('');
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to rename session');
      }
      setChatTitle(newTitle);
      window.dispatchEvent(
        new CustomEvent('chat-renamed', {
          detail: { id: chatId, title: newTitle },
        }),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename chat');
      return false;
    }
  };

  return (
    <div className="gcp-shell flex flex-1 overflow-hidden">
      {/* Center Chat window */}
      <div className="flex h-full flex-1 flex-col border-r border-[rgba(232,230,228,0.08)]">
        <ChatWindowClient
          chatId={chatId}
          chatTitle={chatTitle}
          initialMessages={initialMessages}
          sandboxId={sandbox.id}
          token={token}
          sandboxStatus={sandbox.status}
          onRenameChat={handleRenameChat}
        />
      </div>

      {/* Right Sandbox control sidebar */}
      <SandboxStatusClient
        sandbox={sandbox}
        setSandbox={setSandbox}
        loading={loading}
        error={error}
        setError={setError}
        handleRefresh={handleRefresh}
        handleHibernate={handleHibernate}
        handleWakeup={handleWakeup}
        handleMount={handleMount}
      />
    </div>
  );
}
