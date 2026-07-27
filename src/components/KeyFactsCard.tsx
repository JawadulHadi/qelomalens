import React, { useState } from 'react';
import { Copy, Check, Hash } from 'lucide-react';

interface KeyFactsCardProps {
  facts: { key: string; value: string; category?: string }[];
  highlightedKey?: string;
  onFactClick?: (factKey: string) => void;
}

export const KeyFactsCard: React.FC<KeyFactsCardProps> = ({ facts, highlightedKey, onFactClick }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (value: string, idx: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  if (!facts || facts.length === 0) {
    return (
      <div className="text-xs text-[var(--ol-muted)] italic p-3 text-center border border-dashed border-[var(--ol-border)] rounded-[var(--ol-radius-sm)]">
        No structured key facts extracted yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--ol-muted)] px-1">
        <span className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
          Extracted Key Facts
        </span>
        <span className="text-[10px] font-mono text-[var(--ol-muted)]">{facts.length} items</span>
      </div>

      <div className="space-y-2.5">
        {facts.map((fact, idx) => {
          const isHighlighted = highlightedKey && fact.key.toLowerCase().includes(highlightedKey.toLowerCase());
          return (
            <div
              key={idx}
              onClick={() => onFactClick && onFactClick(fact.key)}
              className={`p-3 bg-[var(--ol-panel)] rounded-lg border-l-2 border-[var(--ol-border)] transition-all flex items-center justify-between gap-3 ${
                onFactClick ? 'cursor-pointer' : ''
              } ${
                isHighlighted
                  ? 'border-l-[var(--ol-accent)] bg-[var(--ol-accent)]/10 ring-1 ring-[var(--ol-accent)]/30'
                  : 'border-l-[var(--ol-accent)] hover:bg-[var(--ol-surface)]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-[var(--ol-muted)] uppercase font-black tracking-wider block">
                  {fact.key}
                </span>
                <p className="text-xs text-[var(--ol-brand)] font-medium truncate mt-0.5 font-mono">
                  {fact.value}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(fact.value, idx);
                }}
                title="Copy value"
                className="p-1.5 rounded-md text-[var(--ol-muted)] hover:text-[var(--ol-accent)] hover:bg-[var(--ol-surface)] transition-colors shrink-0 cursor-pointer"
              >
                {copiedIdx === idx ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
