import React, { useEffect, useRef, useState } from 'react';
import { X, Shield, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Logo } from './Logo.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'sign-in' | 'sign-up' | 'magic-link';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, displayName, isConfigured, signIn, signUp, signInWithMagicLink, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setNotice(null);
      requestAnimationFrame(() => emailInputRef.current?.focus());
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const result =
      mode === 'sign-up'
        ? await signUp(email.trim(), password)
        : mode === 'magic-link'
        ? await signInWithMagicLink(email.trim())
        : await signIn(email.trim(), password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setNotice(
        mode === 'magic-link'
          ? `Magic link sent to ${email.trim()}. Check your inbox to finish signing in.`
          : `Almost there — confirm your email at ${email.trim()} to activate your account.`
      );
      return;
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={user ? 'Account' : 'Sign in or create account'}
        className="relative w-full max-w-md rounded-2xl bg-[var(--ol-panel)] border border-[var(--ol-border)] shadow-2xl overflow-hidden flex flex-col font-body"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--ol-border)] flex items-center justify-between bg-[var(--ol-sidebar)]">
          <div className="flex items-center gap-2">
            <Logo size={32} className="rounded-lg shrink-0" />
            <div>
              <h3 className="font-head font-bold text-sm text-[var(--ol-brand)]">QelomaLens Account</h3>
              <p className="text-[10px] text-[var(--ol-muted)]">Secured by Supabase Auth</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isConfigured ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <h4 className="font-head font-bold text-base text-[var(--ol-brand)]">Authentication not configured</h4>
            <p className="text-xs text-[var(--ol-muted)] leading-relaxed">
              Set <code className="font-mono text-[var(--ol-accent)]">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-[var(--ol-accent)]">VITE_SUPABASE_ANON_KEY</code> in your environment
              to enable sign in. See <span className="font-mono">.env.example</span> and{' '}
              <span className="font-mono">DEPLOYMENT.md</span>.
            </p>
          </div>
        ) : user ? (
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--ol-accent)]/20 border-2 border-[var(--ol-accent)] text-[var(--ol-accent)] flex items-center justify-center font-head font-bold text-xl shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-head font-bold text-base text-[var(--ol-brand)]">{displayName}</h4>
              <p className="text-xs text-[var(--ol-muted)] font-mono">{user.email}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">
                Signed in
              </span>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex-1 py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-[var(--ol-accent)] text-white rounded-xl font-bold text-xs transition-opacity hover:opacity-90 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5">
            <div className="text-center">
              <h4 className="font-head font-bold text-lg text-[var(--ol-brand)]">
                {mode === 'sign-up' ? 'Create your account' : 'Sign in to QelomaLens'}
              </h4>
              <p className="text-xs text-[var(--ol-muted)] mt-1">
                {mode === 'magic-link'
                  ? "We'll email you a one-time link — no password needed."
                  : 'Analyze documents, save history, and pick up where you left off.'}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex items-center bg-[var(--ol-surface)] p-1 rounded-lg border border-[var(--ol-border)]">
              {(['sign-in', 'sign-up', 'magic-link'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`flex-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all cursor-pointer ${
                    mode === m
                      ? 'bg-[var(--ol-accent)] text-white shadow-xs'
                      : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)]'
                  }`}
                >
                  {m === 'sign-in' ? 'Sign In' : m === 'sign-up' ? 'Sign Up' : 'Magic Link'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div>
                <label htmlFor="auth-email" className="block text-[10px] uppercase font-bold text-[var(--ol-muted)] mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ol-muted)]" />
                  <input
                    id="auth-email"
                    ref={emailInputRef}
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[var(--ol-surface)] border border-[var(--ol-border)] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[var(--ol-brand)] focus:outline-hidden focus:border-[var(--ol-accent)]"
                  />
                </div>
              </div>

              {mode !== 'magic-link' && (
                <div>
                  <label htmlFor="auth-password" className="block text-[10px] uppercase font-bold text-[var(--ol-muted)] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ol-muted)]" />
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'sign-up' ? 'At least 6 characters' : 'Your password'}
                      className="w-full bg-[var(--ol-surface)] border border-[var(--ol-border)] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[var(--ol-brand)] focus:outline-hidden focus:border-[var(--ol-accent)]"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {notice && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{notice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email.trim() || (mode !== 'magic-link' && password.length < 6)}
                className="w-full py-2.5 bg-[var(--ol-accent)] hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md mt-1 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {mode === 'sign-up' ? 'Create Account' : mode === 'magic-link' ? 'Send Magic Link' : 'Sign In'}
                </span>
              </button>
            </form>

            <div className="text-[10px] text-center text-[var(--ol-muted)] flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Passwords are hashed and managed entirely by Supabase Auth.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
