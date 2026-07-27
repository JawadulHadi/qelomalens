import React from 'react';
import { DropZone } from './DropZone.js';
import { Sparkles, FileText, Cpu, Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

interface LandingHeroProps {
  onFileSelect: (file: File) => void;
  onTextPaste: (text: string, title?: string) => void;
  onOpenAuth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onFileSelect, onTextPaste, onOpenAuth }) => {
  const { user, displayName, isConfigured } = useAuth();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center gap-10 animate-in fade-in duration-300">
      {/* Brand Hero Badge & Header */}
      <div className="text-center max-w-3xl flex flex-col items-center gap-4">
        <div className="pill-badge-editorial inline-flex items-center gap-1.5 shadow-xs">
          <Sparkles className="w-3 h-3" />
          <span>NEXT-GEN ENGINE</span>
        </div>

        <h1 className="font-head italic text-4xl sm:text-6xl font-semibold tracking-tight text-[var(--ol-brand)] leading-[1.1]">
          The lens that sees beyond the page.
        </h1>

        <p className="text-sm sm:text-base text-[var(--ol-muted)] max-w-xl mx-auto font-body leading-relaxed">
          QelomaLens transforms complex PDFs, DOCX contracts, PNG/JPG images, and text clauses into structured insights, executive summaries, and risk verdicts.
        </p>

        {isConfigured && (
          <div className="flex items-center gap-3 mt-1">
            {user ? (
              <span className="text-xs font-semibold text-[var(--ol-brand)]">
                Welcome back, <span className="text-[var(--ol-accent)]">{displayName}</span> — your analyses are saved to your account.
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-lg bg-[var(--ol-accent)] text-white text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>Create free account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-[var(--ol-muted)]">or just try it below — no account needed</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Interactive Ingestion DropZone */}
      <div className="w-full max-w-2xl">
        <DropZone onFileSelect={onFileSelect} onTextPaste={onTextPaste} />
      </div>

      {/* Cards Row - Editorial Style */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-6 pt-6 max-w-4xl">
        <div className="border-t border-[var(--ol-brand)] pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--ol-accent)]">
            <FileText className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Format Agnostic</span>
          </div>
          <h3 className="font-head font-semibold text-xl text-[var(--ol-brand)]">Multi-Format Ingestion</h3>
          <p className="text-xs text-[var(--ol-muted)] leading-relaxed font-body">
            Native support for PDFs, DOCX agreements, visual documents, and raw text clips.
          </p>
        </div>

        <div className="border-t border-[var(--ol-brand)] pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--ol-accent)]">
            <Cpu className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Plugin Architecture</span>
          </div>
          <h3 className="font-head font-semibold text-xl text-[var(--ol-brand)]">Capability Pipeline</h3>
          <p className="text-xs text-[var(--ol-muted)] leading-relaxed font-body">
            Run focused capability plugins: Summarize, Extract Facts, Verdict, and Risk Breakdown.
          </p>
        </div>

        <div className="border-t border-[var(--ol-brand)] pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--ol-accent)]">
            <Layers className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Multi-Shell UI</span>
          </div>
          <h3 className="font-head font-semibold text-xl text-[var(--ol-brand)]">Adaptive Shell Modes</h3>
          <p className="text-xs text-[var(--ol-muted)] leading-relaxed font-body">
            Seamlessly switch between Full-Page Workspace, Docked Side Panel, and Floating layouts.
          </p>
        </div>
      </div>

      {/* Editorial Footer Meta */}
      <div className="w-full max-w-4xl pt-8 flex items-center justify-between font-mono text-[10px] text-[var(--ol-muted)] uppercase tracking-widest border-t border-[var(--ol-border)]">
        <span>GATEWAY ACTIVE / SESSION STABLE</span>
        <span>OPENAPI CAPABILITIES SPEC AVAILABLE</span>
      </div>
    </div>
  );
};

