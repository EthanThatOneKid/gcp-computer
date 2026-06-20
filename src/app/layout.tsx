import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/SessionProvider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'gcp-computer | Sandbox Agent Platform',
  description: 'Manage secure sandboxes and run agentic commands on GCP Compute Engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body className="bg-[#0b0f17] font-sans text-gray-100 selection:bg-blue-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
