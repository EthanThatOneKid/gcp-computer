import React from 'react';
import { getRuntimeConfig } from '@/config/runtime';
import DashboardStartBtn from '@/components/DashboardStartBtn';

export default function DashboardPage() {
  const runtime = getRuntimeConfig();

  return (
    <div className="gcp-page flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="gcp-card-dark w-full max-w-2xl space-y-8 px-8 py-10 sm:px-10">
        <div className="space-y-3">
          {runtime.isLocalEmulation && (
            <div className="flex justify-center">
              <span className="gcp-badge-primary rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
                Local Emulation
              </span>
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-terracotta)]">
            GCP
          </p>
          <h1 className="text-4xl font-medium tracking-tight text-[var(--color-pristine-white)] sm:text-5xl">
            GCP Computer
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-[rgba(255,255,255,0.72)]">
            Create an isolated code sandbox session on Compute Engine. Run commands, edit files,
            and attach persistent cloud storage with a quieter, more contemplative interface.
          </p>
        </div>
        <div className="flex justify-center">
          <DashboardStartBtn />
        </div>
      </div>
    </div>
  );
}
