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
  Cpu,
  Database,
  Trash2,
  Copy,
  Check,
  Play,
  CornerDownLeft,
} from 'lucide-react';

interface SandboxMount {
  hostPath: string;
  sandboxPath: string;
}

interface SandboxStatusInfo {
  id: string;
  provider: 'mock' | 'docker' | 'gcp';
  status: 'provisioning' | 'running' | 'stopped' | 'failed';
  mounts: SandboxMount[];
  lastActive: number;
  ipAddress?: string;
}

interface SandboxStatusClientProps {
  initialSandbox: SandboxStatusInfo;
  token?: string;
}

export default function SandboxStatusClient({ initialSandbox, token }: SandboxStatusClientProps) {
  const [sandbox, setSandbox] = useState<SandboxStatusInfo>(initialSandbox);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Poll status while provisioning or waking up
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
    } catch (err: any) {
      setError(err.message || 'Refresh failed');
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
      // Set local state to stopped
      setSandbox((prev) => ({ ...prev, status: 'stopped' }));
    } catch (err: any) {
      setError(err.message || 'Hibernation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWakeup = async () => {
    setLoading(true);
    setError('');
    try {
      // Just fetching/getting or initiating connection triggers wakeup
      const res = await fetch(`/api/sandboxes/${sandbox.id}`);
      if (!res.ok) {
        throw new Error('Failed to wake up sandbox');
      }
      const data = await res.json();
      setSandbox(data);
    } catch (err: any) {
      setError(err.message || 'Wakeup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostPath.trim() || !sandboxPath.trim()) return;

    setMountLoading(true);
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
      setHostPath('');
      setSandboxPath('');
    } catch (err: any) {
      setError(err.message || 'Directory mount failed');
    } finally {
      setMountLoading(false);
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
    } catch (err: any) {
      setTermOutput({
        stdout: '',
        stderr: err.message || 'Execution failed',
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
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Active
          </span>
        );
      case 'provisioning':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
            Provisioning
          </span>
        );
      case 'stopped':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-white/5 bg-gray-500/10 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            Sleeping
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Failed
          </span>
        );
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col overflow-hidden border-l border-white/5 bg-[#0f1422] select-none">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-4">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500" size={18} />
          <h3 className="text-sm font-bold text-gray-200">Sandbox Status</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Engine status block */}
        <div className="space-y-3 rounded-xl border border-white/5 bg-[#121929] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Engine Status
            </span>
            {getStatusBadge(sandbox.status)}
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="text-gray-400">Provider</div>
            <div className="text-right font-semibold text-gray-200 capitalize">
              {sandbox.provider}
            </div>

            <div className="text-gray-400">Instance ID</div>
            <div
              className="overflow-hidden text-right font-mono text-[10px] text-ellipsis whitespace-nowrap text-gray-400"
              title={sandbox.id}
            >
              {sandbox.id.substring(0, 12)}...
            </div>

            {sandbox.ipAddress && (
              <>
                <div className="text-gray-400">IP Address</div>
                <div className="flex items-center justify-end gap-1 text-right font-mono font-semibold text-blue-400">
                  <Globe size={11} />
                  <span>{sandbox.ipAddress}</span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 border-t border-white/[0.03] pt-2">
            {sandbox.status === 'running' && (
              <button
                onClick={handleHibernate}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/5 py-1.5 text-xs font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <Moon size={13} />
                <span>Hibernate</span>
              </button>
            )}
            {sandbox.status === 'stopped' && (
              <button
                onClick={handleWakeup}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
              >
                <Zap size={13} />
                <span>Wake Up</span>
              </button>
            )}
            {sandbox.status === 'provisioning' && (
              <div className="flex-1 animate-pulse py-1.5 text-center text-xs text-gray-500">
                Provisioning environment...
              </div>
            )}
          </div>
        </div>

        {/* Directory Mounts section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Directory Mounts
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
              {sandbox.mounts.length}
            </span>
          </div>

          {/* Mount form */}
          <form
            onSubmit={handleMount}
            className="space-y-2 rounded-xl border border-white/5 bg-[#121929] p-3"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500">Host Directory Path</label>
              <input
                type="text"
                placeholder="e.g. C:/Users/name/Projects"
                disabled={mountLoading || sandbox.status !== 'running'}
                className="w-full rounded-lg border border-white/5 bg-slate-950/40 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500/50"
                value={hostPath}
                onChange={(e) => setHostPath(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500">Sandbox Mount Point</label>
              <input
                type="text"
                placeholder="e.g. /workspace/projects"
                disabled={mountLoading || sandbox.status !== 'running'}
                className="w-full rounded-lg border border-white/5 bg-slate-950/40 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500/50"
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
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-50"
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
                  className="flex items-start gap-2.5 rounded-lg border border-white/[0.03] bg-black/25 p-2 font-mono text-xs text-gray-400"
                >
                  <HardDrive size={13} className="mt-0.5 shrink-0 text-gray-500" />
                  <div className="space-y-1 overflow-hidden text-[10px] leading-tight">
                    <div>
                      <span className="text-[9px] font-bold tracking-wide text-gray-600 uppercase">
                        Host:
                      </span>
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-gray-300"
                        title={mount.hostPath}
                      >
                        {mount.hostPath}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold tracking-wide text-gray-600 uppercase">
                        Sandbox:
                      </span>
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-blue-400"
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
            <div className="rounded-xl border border-dashed border-white/5 py-4 text-center text-xs text-gray-600">
              No active mounts. Direct workspace maps to ./sandboxes/id/workspace.
            </div>
          )}
        </div>

        {/* Direct Terminal Execution */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            Direct Terminal Command
          </span>

          <form
            onSubmit={handleExecuteCommand}
            className="relative flex items-center rounded-xl border border-white/5 bg-[#121929] p-2 focus-within:border-blue-500/50"
          >
            <Terminal size={14} className="ml-1 shrink-0 text-gray-500" />
            <input
              type="text"
              placeholder="whoami && ls -la"
              disabled={execLoading || sandbox.status !== 'running'}
              className="flex-1 border-0 bg-transparent px-2 py-0.5 text-xs text-gray-200 placeholder-gray-600 outline-none"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={execLoading || !command.trim() || sandbox.status !== 'running'}
              className="flex items-center justify-center rounded bg-blue-500 p-1 text-white transition-all hover:opacity-95 disabled:bg-transparent disabled:text-gray-600"
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
            <div className="overflow-hidden rounded-lg border border-white/5 bg-black/40 font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[9px] text-gray-500">
                <span>Output Log</span>
                <span className={termOutput.exitCode === 0 ? 'text-emerald-400' : 'text-red-400'}>
                  exit: {termOutput.exitCode}
                </span>
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto p-2.5 whitespace-pre-wrap">
                {termOutput.stdout && (
                  <pre className="leading-normal text-gray-300">
                    <code>{termOutput.stdout}</code>
                  </pre>
                )}
                {termOutput.stderr && (
                  <pre className="leading-normal text-red-400">
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
