import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/db/index';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    }),
    CredentialsProvider({
      name: 'Developer Login (Mock)',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'developer@gcp-computer.dev' },
        name: { label: 'Name', type: 'text', placeholder: 'Developer' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const db = getDb();
        const email = credentials.email.trim().toLowerCase();
        const name = credentials.name || 'Developer';
        const image = `https://avatar.vercel.sh/${encodeURIComponent(email)}`;

        try {
          // Check if user exists
          const selectStmt = db.prepare('SELECT id, email, name, image FROM users WHERE email = ?');
          let user = selectStmt.get(email) as
            | { id: string; email: string; name: string; image: string }
            | undefined;

          if (!user) {
            // Create user automatically
            const id = `user-${Math.random().toString(36).substring(2, 11)}`;
            const insertStmt = db.prepare(
              'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)',
            );
            insertStmt.run(id, email, name, image);
            user = { id, email, name, image };
            console.log(`[Auth] Registered new mock developer user: ${email}`);
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('[Auth] Mock authorization failed:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const db = getDb();
        const email = user.email!;

        try {
          const selectStmt = db.prepare('SELECT id FROM users WHERE email = ?');
          const existing = selectStmt.get(email);

          if (!existing) {
            const id = user.id || `user-${Math.random().toString(36).substring(2, 11)}`;
            const insertStmt = db.prepare(
              'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)',
            );
            insertStmt.run(id, email, user.name || 'Google User', user.image || '');
            console.log(`[Auth] Registered new Google OAuth user: ${email}`);
          }
        } catch (error) {
          console.error('[Auth] Failed to sync Google user with database:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const db = getDb();
        try {
          const selectStmt = db.prepare('SELECT id, image FROM users WHERE email = ?');
          const dbUser = selectStmt.get(session.user.email) as
            | { id: string; image: string }
            | undefined;

          if (dbUser && session.user) {
            (session.user as any).id = dbUser.id;
            session.user.image = dbUser.image;
          }
        } catch (error) {
          console.error('[Auth] Failed to fetch session user ID:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Point to landing/login page
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'secret-jwt-key-gcp-computer',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
