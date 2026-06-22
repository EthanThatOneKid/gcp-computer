import Link from 'next/link';

const navLinks = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/getting-started', label: 'Getting Started' },
  { href: '/docs/installation', label: 'Installation' },
  { href: '/docs/development', label: 'Development' },
  { href: '/docs/deployment', label: 'Deployment' },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gcp-page min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:flex lg:gap-12">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-28 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="prose prose-invert max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-white/80 prose-a:text-[var(--color-lavender)] prose-a:no-underline hover:prose-a:text-[var(--color-lavender-hover)] prose-strong:text-white prose-code:rounded-md prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-pre:border prose-pre:border-white/10 prose-pre:bg-[var(--color-almost-black)] prose-li:text-white/80">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
