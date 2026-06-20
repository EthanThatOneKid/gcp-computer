'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function DashboardStartBtn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Session' }),
      });
      if (res.ok) {
        const newChat = await res.json();
        router.push(`/dashboard/chat/${newChat.id}`);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-2.5 font-semibold text-white transition-all hover:opacity-95 disabled:opacity-50"
    >
      <Plus size={16} />
      <span>{loading ? 'Starting Sandbox...' : 'Start New Session'}</span>
    </button>
  );
}
