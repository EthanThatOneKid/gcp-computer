import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getDb } from '@/db/index';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }

  const userId = (session.user as any).id;
  const db = getDb();

  // SSR load user's chats from database
  let chats: any[] = [];
  try {
    chats = db
      .prepare(
        `SELECT c.id, c.title, c.created_at,
       (SELECT m.content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
       FROM chats c
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      )
      .all(userId);
  } catch (error) {
    console.error('[Dashboard Layout] Failed to load chats SSR:', error);
  }

  return (
    <DashboardLayoutClient
      initialChats={chats}
      userEmail={session.user.email || 'developer@gcp-computer.dev'}
    >
      {children}
    </DashboardLayoutClient>
  );
}
