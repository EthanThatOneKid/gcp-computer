'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, Plus, MessageSquare, Trash2, LogOut, Terminal } from 'lucide-react';
import Link from 'next/link';

interface ChatItem {
  id: string;
  title: string;
  created_at: string;
  last_message?: string | null;
}

interface DashboardLayoutClientProps {
  initialChats: ChatItem[];
  userEmail: string;
  isLocalEmulation: boolean;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  initialChats,
  userEmail,
  isLocalEmulation,
  children,
}: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>(initialChats);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const handleChatRenamed = (e: Event) => {
      const { id, title } = (e as CustomEvent).detail;
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    };
    window.addEventListener('chat-renamed', handleChatRenamed);
    return () => {
      window.removeEventListener('chat-renamed', handleChatRenamed);
    };
  }, []);

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const activeChatId = pathname?.split('/dashboard/chat/')?.[1] || null;

  // Poll chats list occasionally or reload list on path changes
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error('Failed to reload chats:', err);
    }
  };

  const handleCreateChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Session ${chats.length + 1}`,
        }),
      });
      if (res.ok) {
        const newChat = await res.json();
        await fetchChats();
        router.push(`/dashboard/chat/${newChat.id}`);
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchChats();
        if (activeChatId === id) {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  return (
    <div className="gcp-shell flex h-screen w-screen overflow-hidden">
      {/* Sidebar Container */}
      <aside
        className={`gcp-sidebar relative z-10 flex h-full flex-col border-r transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-72'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between overflow-hidden border-b border-[rgba(232,230,228,0.08)] px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Terminal className="text-[var(--color-lavender)]" size={20} />
              <span className="text-lg font-medium tracking-tight text-[var(--color-pristine-white)]">
                GCP Computer
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex w-full justify-center">
              <Terminal className="text-[var(--color-lavender)]" size={20} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="gcp-btn-icon p-1.5 text-[rgba(255,255,255,0.68)] hover:text-[var(--color-pristine-white)]"
          >
            <Menu size={16} />
          </button>
        </div>

        {isLocalEmulation && !collapsed && (
          <div className="mx-3 mt-3 rounded-[var(--radius-md)] border border-[rgba(210,190,255,0.18)] bg-[rgba(210,190,255,0.08)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-lavender)]">
            Local Emulation
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleCreateChat}
          className="mx-3 my-4 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[rgba(210,190,255,0.25)] bg-[rgba(210,190,255,0.06)] p-2 font-medium text-[rgba(255,255,255,0.9)] transition-all hover:border-[rgba(210,190,255,0.5)] hover:bg-[rgba(210,190,255,0.12)] hover:text-[var(--color-pristine-white)]"
        >
          <Plus size={16} />
          {!collapsed && <span>New Session</span>}
        </button>

        {/* Scrollable Chat List */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/dashboard/chat/${chat.id}`}
              className={`group flex items-center justify-between rounded-[var(--radius-md)] p-2.5 text-sm transition-all ${
                activeChatId === chat.id
                  ? 'border border-[rgba(210,190,255,0.22)] bg-[rgba(210,190,255,0.09)] text-[var(--color-pristine-white)]'
                  : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-pristine-white)]'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
                <MessageSquare size={16} className="shrink-0" />
                {!collapsed && (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {chat.title}
                  </span>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="rounded p-0.5 text-[rgba(255,255,255,0.46)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </Link>
          ))}
        </div>

        {/* Footer info & Logout */}
        <div className="flex h-16 items-center justify-between overflow-hidden border-t border-[rgba(232,230,228,0.08)] p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-lavender)] text-xs font-bold text-[var(--color-deep-black)]">
              {getInitials(userEmail)}
            </div>
            {!collapsed && (
              <span className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-[rgba(255,255,255,0.72)]">
                {userEmail}
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="gcp-btn-icon p-1.5 text-[rgba(255,255,255,0.68)] hover:text-[var(--color-pristine-white)]"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
