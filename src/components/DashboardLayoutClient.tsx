'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, Plus, MessageSquare, Trash2, LogOut, Terminal } from 'lucide-react';
import Link from 'next/link';

interface ChatItem {
  id: string;
  title: string;
  created_at: string;
  last_message?: string;
}

interface DashboardLayoutClientProps {
  initialChats: ChatItem[];
  userEmail: string;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  initialChats,
  userEmail,
  children,
}: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>(initialChats);
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    fetchChats();
  }, [pathname]);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17]">
      {/* Sidebar Container */}
      <aside
        className={`relative z-10 flex h-full flex-col border-r border-white/5 bg-[#0f1422] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-72'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between overflow-hidden border-b border-white/5 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Terminal className="text-blue-500" size={20} />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
                gcp-computer
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex w-full justify-center">
              <Terminal className="text-blue-500" size={20} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreateChat}
          className="mx-3 my-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 p-2 font-medium text-gray-200 transition-all hover:border-blue-500 hover:bg-blue-500/10 hover:text-white"
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
              className={`group flex items-center justify-between rounded-lg p-2.5 text-sm transition-all ${
                activeChatId === chat.id
                  ? 'border border-blue-500/20 bg-blue-500/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                  className="rounded p-0.5 text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </Link>
          ))}
        </div>

        {/* Footer info & Logout */}
        <div className="flex h-16 items-center justify-between overflow-hidden border-t border-white/5 p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
              {getInitials(userEmail)}
            </div>
            {!collapsed && (
              <span className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-gray-300">
                {userEmail}
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
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
