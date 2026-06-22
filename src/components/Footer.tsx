import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

function GCPLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12L4.2 7.5L12 3L19.8 7.5Z" fill="#4285F4" />
      <path d="M12 12L19.8 7.5L19.8 16.5Z" fill="#EA4335" />
      <path d="M12 12L19.8 16.5L12 21L4.2 16.5Z" fill="#FBBC05" />
      <path d="M12 12L4.2 16.5L4.2 7.5Z" fill="#34A853" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(232,230,228,0.06)] bg-[rgba(10,10,10,0.9)] py-12 text-xs text-[rgba(255,255,255,0.45)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <GCPLogo className="h-5 w-5 opacity-60" />
          <span>GCP Computer &copy; 2026. Built for Google I/O Extended GDG Newport Beach.</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://about.google/brand-resource-center/guidance/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            GCP Brand Guidance
          </a>
          <span className="opacity-30">&middot;</span>
          <a
            href="https://github.com/EthanThatOneKid/gcp-computer"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-white"
          >
            GitHub Repo
            <ExternalLink size={12} />
          </a>
          <span className="opacity-30">&middot;</span>
          <Link href="/docs" className="transition-colors hover:text-white">
            Documentation
          </Link>
        </div>
      </div>
    </footer>
  );
}
