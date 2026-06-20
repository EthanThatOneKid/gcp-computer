'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Chrome, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err: any) {
      setError('Google Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        name: name.trim() || 'Developer',
        redirect: true,
        callbackUrl: '/dashboard',
      });
      if (res?.error) {
        throw new Error(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Developer login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google Provider Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
      >
        <Chrome size={18} />
        <span>Sign in with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 text-xs text-gray-500 uppercase">
        <div className="h-[1px] flex-1 bg-white/10" />
        <span>or use developer fallback</span>
        <div className="h-[1px] flex-1 bg-white/10" />
      </div>

      {/* Credentials form */}
      <form onSubmit={handleMockLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="dev-email" className="text-xs font-semibold text-gray-400">
            Email address
          </label>
          <input
            id="dev-email"
            type="email"
            placeholder="developer@gcp-computer.dev"
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 transition-all outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dev-name" className="text-xs font-semibold text-gray-400">
            Name (Optional)
          </label>
          <input
            id="dev-name"
            type="text"
            placeholder="John Doe"
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 transition-all outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 font-semibold text-white transition-all hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <span>{loading ? 'Logging in...' : 'Developer Login'}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
