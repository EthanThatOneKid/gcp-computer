'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const navLinks = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/getting-started', label: 'Getting Started' },
  { href: '/docs/installation', label: 'Installation' },
  { href: '/docs/development', label: 'Development' },
  { href: '/docs/deployment', label: 'Deployment' },
];

function GCPLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12L4.2 7.5L12 3L19.8 7.5Z" fill="#4285F4" />
      <path d="M12 12L19.8 7.5L19.8 16.5Z" fill="#EA4335" />
      <path d="M12 12L19.8 16.5L12 21L4.2 16.5Z" fill="#FBBC05" />
      <path d="M12 12L4.2 16.5L4.2 7.5Z" fill="#34A853" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/docs') return pathname === '/docs';
    return pathname.startsWith(href);
  };

  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[rgba(232,230,228,0.08)] bg-[rgba(13,13,13,0.8)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <GCPLogo className="h-9 w-9" />
          <span className="text-lg font-medium tracking-tight text-[var(--color-pristine-white)]">
            GCP <span className="text-[var(--color-lavender)]">Computer</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-semibold tracking-wider uppercase transition-opacity ${
                isActive(link.href)
                  ? 'text-[var(--color-lavender)] opacity-100'
                  : 'text-[var(--color-pristine-white)] opacity-60 hover:opacity-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-4 text-xs font-semibold text-[var(--color-pristine-white)] transition-colors hover:bg-[rgba(255,255,255,0.1)]"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--color-lavender)] px-4 text-xs font-semibold text-[var(--color-deep-black)] transition-all hover:bg-[var(--color-lavender-hover)] active:scale-[0.98]"
          >
            <span>Get Started</span>
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    </header>
  );
}
