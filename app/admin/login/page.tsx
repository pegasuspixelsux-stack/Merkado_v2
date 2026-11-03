'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/src/context/AuthContext';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

const inputClass =
  'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-white/60 mb-2';

export default function AdminLoginPage() {
  const router = useRouter();
  const { agent, loading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && agent) router.replace('/dashboard');
  }, [loading, agent, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown';
      console.error('Sign-in failed:', err);
      setFormError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : code === 'auth/operation-not-allowed'
            ? 'Email/Password sign-in is not enabled in Firebase (Authentication → Sign-in method).'
            : code === 'auth/too-many-requests'
              ? 'Too many attempts. Wait a few minutes and try again.'
              : code === 'auth/network-request-failed'
                ? 'Network error reaching Firebase.'
                : `Sign-in failed (${code}).`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setFormError(null);
    setNotice(null);
    if (!email.trim()) {
      setFormError('Enter your email above, then click “Forgot password?”.');
      return;
    }
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Don't reveal whether the account exists.
    }
    setNotice('If an account exists for that email, a reset link is on its way.');
  };

  const message = formError ?? error;

  return (
    <main
      className="relative min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop)',
      }}
    >
      {/* Brand, top-left corner */}
      <Link
        href="/"
        className="absolute top-8 left-8 z-20 text-lg font-semibold tracking-tight drop-shadow"
      >
        Merkado.
      </Link>

      {/* Two-column overlay: left transparent, right 50% black */}
      <div className="relative min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div aria-hidden="true" className="hidden md:block" />

        <div className="bg-black/50 flex items-center justify-center px-6 py-24">
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">Merkado.</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Admin sign in</h1>
            <p className="text-sm text-white/70 font-light mb-8">Manage items, orders and users.</p>

            {!isFirebaseConfigured && (
              <p className="mb-6 text-xs rounded-xl bg-amber-400/20 text-amber-100 p-3">
                Firebase isn’t configured yet. Copy <code>.env.local.example</code> to <code>.env.local</code>,
                fill in your project keys and restart the dev server.
              </p>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-white/60">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-white/70 hover:text-white underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {message && <p role="alert" className="text-xs text-red-300">{message}</p>}
              {notice && <p role="status" className="text-xs text-green-300">{notice}</p>}
              <button
                type="submit"
                disabled={submitting || !isFirebaseConfigured}
                className="w-full bg-white text-black py-3.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <Link href="/" className="block text-center text-xs text-white/70 hover:text-white mt-6">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
