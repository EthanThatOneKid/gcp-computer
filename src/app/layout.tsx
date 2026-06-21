import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/SessionProvider';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  title: 'GCP Computer | Sandbox Agent Platform',
  description: 'Manage secure sandboxes and run agentic commands on GCP Compute Engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
