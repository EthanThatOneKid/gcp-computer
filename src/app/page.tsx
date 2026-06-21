import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="gcp-page flex min-h-screen items-center justify-center px-4 py-12">
      <section className="gcp-card-light w-full max-w-2xl space-y-8 p-8 text-center sm:p-10">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-lavender)] text-[var(--color-deep-black)] shadow-[var(--shadow-ground)]">
              <Terminal size={30} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--color-terracotta)]">
              GCP
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--color-pure-black)] sm:text-4xl">
              GCP Computer
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-6 text-[var(--color-medium-gray)] sm:text-base">
              Spin up an isolated coding sandbox, run commands safely, and keep the whole session
              visible.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="gcp-btn-primary inline-flex min-w-40 justify-center px-5 py-3"
          >
            <span>Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
