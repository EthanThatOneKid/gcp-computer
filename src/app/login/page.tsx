import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth';
import { getRuntimeConfig } from '@/config/runtime';
import LoginForm from '@/components/LoginForm';
import { Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const runtime = getRuntimeConfig();
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="gcp-page flex min-h-screen items-center justify-center px-4 py-12">
      <section className="gcp-card-light w-full max-w-md space-y-8 p-8 sm:p-10">
        <div className="space-y-4 text-center">
          {runtime.isLocalEmulation && (
            <div className="flex justify-center">
              <span className="gcp-badge-primary rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
                Local Emulation
              </span>
            </div>
          )}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-lavender)] text-[var(--color-deep-black)] shadow-[var(--shadow-ground)]">
              <Terminal size={30} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-terracotta)]">
              GCP
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--color-pure-black)]">
              GCP Computer
            </h1>
            <p className="text-sm leading-6 text-[var(--color-medium-gray)]">
              Secure agentic execution environments on Google Cloud.
            </p>
          </div>
        </div>

        <LoginForm
          showGoogleLogin={runtime.googleAuthEnabled}
          isLocalEmulation={runtime.isLocalEmulation}
        />
      </section>
    </main>
  );
}
