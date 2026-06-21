'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Chrome, ShieldAlert, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  showGoogleLogin: boolean;
  isLocalEmulation: boolean;
}

export default function LoginForm({ showGoogleLogin, isLocalEmulation }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Developer login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isLocalEmulation && (
        <div className="gcp-badge-primary items-center justify-center rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold tracking-[0.18em]">
          Local Emulation
        </div>
      )}

      {error && (
        <div className="gcp-badge-error items-start rounded-[var(--radius-md)] p-3 text-sm">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showGoogleLogin && (
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="gcp-btn-secondary w-full px-4 disabled:pointer-events-none disabled:opacity-50"
        >
          <Chrome size={18} />
          <span>Sign in with Google</span>
        </button>
      )}

      {/* Divider */}
      {showGoogleLogin && (
        <div className="flex items-center justify-center gap-3 text-xs tracking-[0.18em] text-[var(--color-medium-gray)]">
          <div className="h-px flex-1 bg-[var(--color-lighter-gray)]" />
          <span>or use developer fallback</span>
          <div className="h-px flex-1 bg-[var(--color-lighter-gray)]" />
        </div>
      )}

      {/* Credentials form */}
      <form onSubmit={handleMockLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="dev-email"
            className="text-xs font-medium text-[var(--color-medium-gray)]"
          >
            Email address
          </label>
          <input
            id="dev-email"
            type="email"
            placeholder="developer@gcp.dev"
            disabled={loading}
            className="gcp-input-line px-0 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dev-name" className="text-xs font-medium text-[var(--color-medium-gray)]">
            Name (Optional)
          </label>
          <input
            id="dev-name"
            type="text"
            placeholder="John Doe"
            disabled={loading}
            className="gcp-input-line px-0 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="gcp-btn-primary w-full justify-center disabled:pointer-events-none disabled:opacity-50"
        >
          <span>{loading ? 'Logging in...' : 'Developer Login'}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
