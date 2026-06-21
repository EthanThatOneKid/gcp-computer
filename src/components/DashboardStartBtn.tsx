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
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="gcp-btn-primary px-6 disabled:opacity-50"
    >
      <Plus size={16} />
      <span>{loading ? 'Starting Sandbox...' : 'Start New Session'}</span>
    </button>
  );
}
