'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  HardDrive,
  RefreshCw,
  Plus,
  Loader2,
  ShieldAlert,
  Moon,
  Zap,
  Globe,
  Database,
  CornerDownLeft,
} from 'lucide-react';

interface SandboxMount {
  hostPath: string;
  sandboxPath: string;
}

interface SandboxStatusInfo {
  id: string;
  provider: 'mock' | 'docker' | 'gcp' | 'emulated';
  status: 'provisioning' | 'running' | 'stopped' | 'failed';
  mounts: SandboxMount[];
  lastActive: number;
  ipAddress?: string;
}

interface SandboxStatusClientProps {
  sandbox: SandboxStatusInfo;
  setSandbox: React.Dispatch<React.SetStateAction<SandboxStatusInfo>>;
  loading: boolean;
  error: string;
  setError: (err: string) => void;
  handleRefresh: () => Promise<void>;
  handleHibernate: () => Promise<void>;
  handleWakeup: () => Promise<void>;
  handleMount: (hostPath: string, sandboxPath: string) => Promise<boolean>;
  token?: string;
}

export default function SandboxStatusClient({
  sandbox,
  loading,
  error,
  handleRefresh,
  handleHibernate,
  handleWakeup,
  handleMount,
}: SandboxStatusClientProps) {
  // Mount Form State
  const [hostPath, setHostPath] = useState('');
  const [sandboxPath, setSandboxPath] = useState('');
  const [mountLoading, setMountLoading] = useState(false);

  // Terminal State
  const [command, setCommand] = useState('');
  const [execLoading, setExecLoading] = useState(false);
  const [termOutput, setTermOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode?: number;
  } | null>(null);
  const termEndRef = useRef<HTMLDivElement>(null);

  const handleMountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostPath.trim() || !sandboxPath.trim()) return;

    setMountLoading(true);
    const success = await handleMount(hostPath, sandboxPath);
    setMountLoading(false);
    if (success) {
      setHostPath('');
      setSandboxPath('');
    }
  };

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setExecLoading(true);
    setTermOutput(null);
    try {
      const res = await fetch('/api/sandboxes/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId: sandbox.id,
          command: command.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Execution failed');
      }

      const data = await res.json();
      setTermOutput(data);
      setCommand('');

      // Auto scroll terminal log to view
      setTimeout(() => {
        termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: unknown) {
      setTermOutput({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exitCode: -1,
      });
    } finally {
      setExecLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="gcp-badge-primary rounded-full border border-[rgba(210,190,255,0.24)] bg-[rgba(210,190,255,0.14)] px-2.5 py-0.5 text-xs text-[var(--color-pristine-white)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-lavender)]" />
            Active
          </span>
        );
      case 'provisioning':
        return (
          <span className="gcp-badge-secondary rounded-full border border-[rgba(239,119,89,0.24)] bg-[rgba(239,119,89,0.08)] px-2.5 py-0.5 text-xs text-[var(--color-terracotta)]">
            <Loader2 className="h-3 w-3 animate-spin text-[var(--color-terracotta)]" />
            Provisioning
          </span>
        );
      case 'stopped':
        return (
          <span className="gcp-badge-secondary rounded-full border border-[rgba(232,230,228,0.1)] bg-[rgba(255,255,255,0.05)] px-2.5 py-0.5 text-xs text-[rgba(255,255,255,0.7)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.5)]" />
            Sleeping
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="gcp-badge-error rounded-full px-2.5 py-0.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Failed
          </span>
        );
    }
  };

  return (
    <aside className="gcp-sidebar flex h-full w-80 select-none flex-col overflow-hidden border-l">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[rgba(232,230,228,0.08)] px-4">
        <div className="flex items-center gap-2">
          <Database className="text-[var(--color-lavender)]" size={18} />
          <h3 className="text-sm font-medium text-[var(--color-pristine-white)]">Sandbox Status</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="gcp-btn-icon p-1.5 text-[rgba(255,255,255,0.68)] hover:text-[var(--color-pristine-white)] disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {error && (
          <div className="gcp-badge-error items-start rounded-[var(--radius-md)] p-3 text-xs">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Engine status block */}
        <div className="gcp-panel space-y-3 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.42)]">
              Engine Status
            </span>
            {getStatusBadge(sandbox.status)}
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="text-[rgba(255,255,255,0.56)]">Provider</div>
            <div className="text-right font-medium capitalize text-[var(--color-pristine-white)]">
              {sandbox.provider === 'mock' ? 'local host' : sandbox.provider}
            </div>

            <div className="text-[rgba(255,255,255,0.56)]">Instance ID</div>
            <div
              className="overflow-hidden text-right font-mono text-[10px] text-ellipsis whitespace-nowrap text-[rgba(255,255,255,0.56)]"
              title={sandbox.id}
            >
              {sandbox.id.substring(0, 12)}...
            </div>

            {sandbox.ipAddress && (
              <>
                <div className="text-[rgba(255,255,255,0.56)]">IP Address</div>
                <div className="flex items-center justify-end gap-1 text-right font-mono font-medium text-[var(--color-lavender)]">
                  <Globe size={11} />
                  <span>{sandbox.ipAddress}</span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 border-t border-[rgba(232,230,228,0.06)] pt-2">
            {sandbox.status === 'running' && (
              <button
                onClick={handleHibernate}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.08)] bg-[rgba(255,255,255,0.04)] py-1.5 text-xs font-medium text-[rgba(255,255,255,0.8)] transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--color-pristine-white)] disabled:opacity-50"
              >
                <Moon size={13} />
                <span>Hibernate</span>
              </button>
            )}
            {sandbox.status === 'stopped' && (
              <button
                onClick={handleWakeup}
                disabled={loading}
                className="gcp-btn-primary flex flex-1 justify-center py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <Zap size={13} />
                <span>Wake Up</span>
              </button>
            )}
            {sandbox.status === 'provisioning' && (
              <div className="flex-1 animate-pulse py-1.5 text-center text-xs text-[rgba(255,255,255,0.5)]">
                Provisioning environment...
              </div>
            )}
          </div>
        </div>

        {/* Directory Mounts section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.42)]">
              Directory Mounts
            </span>
            <span className="rounded-full bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[10px] font-semibold text-[rgba(255,255,255,0.6)]">
              {sandbox.mounts.length}
            </span>
          </div>

          {/* Mount form */}
          <form
            onSubmit={handleMountSubmit}
            className="gcp-panel space-y-2 p-3"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[rgba(255,255,255,0.42)]">Host Directory Path</label>
              <input
                type="text"
                placeholder="e.g. C:/Users/name/Projects"
                disabled={mountLoading || sandbox.status !== 'running'}
                className="gcp-input-box px-2 py-1.5 text-xs text-[var(--color-pristine-white)] placeholder:text-[rgba(255,255,255,0.38)]"
                value={hostPath}
                onChange={(e) => setHostPath(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[rgba(255,255,255,0.42)]">Sandbox Mount Point</label>
              <input
                type="text"
                placeholder="e.g. /workspace/projects"
                disabled={mountLoading || sandbox.status !== 'running'}
                className="gcp-input-box px-2 py-1.5 text-xs text-[var(--color-pristine-white)] placeholder:text-[rgba(255,255,255,0.38)]"
                value={sandboxPath}
                onChange={(e) => setSandboxPath(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={
                mountLoading ||
                !hostPath.trim() ||
                !sandboxPath.trim() ||
                sandbox.status !== 'running'
              }
              className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[rgba(210,190,255,0.2)] bg-[rgba(210,190,255,0.08)] py-1.5 text-xs font-semibold text-[var(--color-lavender)] transition-all hover:bg-[rgba(210,190,255,0.14)] hover:text-[var(--color-pristine-white)] disabled:opacity-50"
            >
              {mountLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              <span>Mount Volume</span>
            </button>
          </form>

          {/* Mount lists */}
          {sandbox.mounts.length > 0 ? (
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {sandbox.mounts.map((mount, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.06)] bg-[rgba(0,0,0,0.22)] p-2 font-mono text-xs text-[rgba(255,255,255,0.64)]"
                >
                  <HardDrive size={13} className="mt-0.5 shrink-0 text-[rgba(255,255,255,0.42)]" />
                  <div className="space-y-1 overflow-hidden text-[10px] leading-tight">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[rgba(255,255,255,0.38)]">
                        Host:
                      </span>
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-[rgba(255,255,255,0.8)]"
                        title={mount.hostPath}
                      >
                        {mount.hostPath}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[rgba(255,255,255,0.38)]">
                        Sandbox:
                      </span>
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-lavender)]"
                        title={mount.sandboxPath}
                      >
                        {mount.sandboxPath}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(232,230,228,0.08)] py-4 text-center text-xs text-[rgba(255,255,255,0.42)]">
              No active mounts. Direct workspace maps to ./sandboxes/id/workspace.
            </div>
          )}
        </div>

        {/* Direct Terminal Execution */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.42)]">
            Direct Terminal Command
          </span>

          <form
            onSubmit={handleExecuteCommand}
            className="gcp-panel relative flex items-center p-2"
          >
            <Terminal size={14} className="ml-1 shrink-0 text-[rgba(255,255,255,0.42)]" />
            <input
              type="text"
              placeholder="whoami && ls -la"
              disabled={execLoading || sandbox.status !== 'running'}
              className="flex-1 border-0 bg-transparent px-2 py-0.5 text-xs text-[var(--color-pristine-white)] outline-none placeholder:text-[rgba(255,255,255,0.38)]"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={execLoading || !command.trim() || sandbox.status !== 'running'}
              className="flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-lavender)] p-1 text-[var(--color-deep-black)] transition-all hover:opacity-95 disabled:bg-transparent disabled:text-[rgba(255,255,255,0.3)]"
            >
              {execLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CornerDownLeft size={12} />
              )}
            </button>
          </form>

          {/* Terminal log panel */}
          {termOutput && (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(232,230,228,0.06)] bg-[rgba(0,0,0,0.25)] font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-[rgba(232,230,228,0.06)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1.5 text-[9px] text-[rgba(255,255,255,0.46)]">
                <span>Output Log</span>
                <span className={termOutput.exitCode === 0 ? 'text-[var(--color-lavender)]' : 'text-[var(--color-danger)]'}>
                  exit: {termOutput.exitCode}
                </span>
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto p-2.5 whitespace-pre-wrap">
                {termOutput.stdout && (
                  <pre className="leading-normal text-[rgba(255,255,255,0.8)]">
                    <code>{termOutput.stdout}</code>
                  </pre>
                )}
                {termOutput.stderr && (
                  <pre className="leading-normal text-[var(--color-danger)]">
                    <code>{termOutput.stderr}</code>
                  </pre>
                )}
                <div ref={termEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
