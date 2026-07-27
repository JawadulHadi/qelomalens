import React from 'react';
import { Layers, PanelRight, MessageSquare, Moon, Sun, HelpCircle, User } from 'lucide-react';
import { ShellMode } from '../types.js';
import { useAuth } from '../hooks/useAuth.js';

interface HeaderProps {
  shell: ShellMode;
  onShellChange: (shell: ShellMode) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shell,
  onShellChange,
  isDark,
  onToggleDark,
  onOpenAuth,
}) => {
  const { user, displayName } = useAuth();

  return (
    <header className="h-16 border-b px-4 sm:px-6 flex items-center justify-between bg-[var(--ol-panel)] border-[var(--ol-border)] transition-colors shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--ol-accent)] rounded-md flex items-center justify-center font-bold text-white italic font-head text-lg shadow-sm">
          Q
        </div>
        <div className="flex items-center gap-2">
          <span className="font-head italic font-semibold text-2xl tracking-tight text-[var(--ol-brand)]">
            QelomaLens
          </span>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest text-[var(--ol-muted)] font-medium ml-1">
            v1.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Shell Switcher */}
        <div className="flex items-center bg-[var(--ol-surface)] p-1 rounded-lg border border-[var(--ol-border)]">
          <button
            type="button"
            onClick={() => onShellChange('full-page')}
            title="Full Page Shell"
            aria-label="Switch to full page shell"
            aria-pressed={shell === 'full-page'}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              shell === 'full-page'
                ? 'bg-[var(--ol-accent)] text-white shadow-sm'
                : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-panel)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Page</span>
          </button>
          <button
            type="button"
            onClick={() => onShellChange('docked')}
            title="Docked Side Panel"
            aria-label="Switch to docked side panel shell"
            aria-pressed={shell === 'docked'}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              shell === 'docked'
                ? 'bg-[var(--ol-accent)] text-white shadow-sm'
                : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-panel)]'
            }`}
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docked</span>
          </button>
          <button
            type="button"
            onClick={() => onShellChange('floating')}
            title="Floating Widget"
            aria-label="Switch to floating widget shell"
            aria-pressed={shell === 'floating'}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              shell === 'floating'
                ? 'bg-[var(--ol-accent)] text-white shadow-sm'
                : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-panel)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Widget</span>
          </button>
        </div>

        {/* Account SSO / Profile Trigger */}
        <button
          type="button"
          onClick={onOpenAuth}
          aria-label={user ? `Account menu for ${displayName}` : 'Sign in or create account'}
          className="px-3 py-1.5 rounded-lg border border-[var(--ol-border)] bg-[var(--ol-surface)] hover:bg-[var(--ol-panel)] hover:border-[var(--ol-accent)] transition-all flex items-center gap-2 cursor-pointer"
        >
          {user ? (
            <div className="w-5 h-5 rounded-full bg-[var(--ol-accent)] text-white font-bold flex items-center justify-center text-[10px]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <User className="w-4 h-4 text-[var(--ol-accent)]" />
          )}
          <span className="text-xs font-semibold text-[var(--ol-brand)] hidden md:inline">
            {user ? displayName : 'Sign In'}
          </span>
        </button>

        {/* Live Status Light Indicator */}
        <div className="w-8 h-8 rounded-full bg-[var(--ol-surface)] border border-[var(--ol-border)] flex items-center justify-center shrink-0" title="Service Gateway Active">
          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDark}
          className="p-2 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Help */}
        <a
          href="/v1/capabilities"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors"
          title="OpenAPI Capabilities Spec"
          aria-label="View OpenAPI capabilities spec (opens in new tab)"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
