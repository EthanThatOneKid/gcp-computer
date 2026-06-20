import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';
import LoginForm from '@/components/LoginForm';
import { Terminal } from 'lucide-react';

export default async function LoginPage() {
  // SSR check: redirect if already authenticated
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1b2640] via-[#0b0f17] to-[#0b0f17] px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
              <Terminal size={36} />
            </div>
          </div>
          <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            gcp-computer
          </h1>
          <p className="text-sm text-gray-400">
            Secure agentic execution environments on Google Cloud
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
