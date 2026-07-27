import React, { useState } from 'react';
import { FileText, FileCode, Image as ImageIcon, ChevronDown, ChevronUp, Layers, RefreshCw, BarChart2 } from 'lucide-react';
import { DocumentInfo } from '../types.js';
import { KeyFactsCard } from './KeyFactsCard.js';
import { DataVisualizer } from './DataVisualizer.js';

interface DocumentPaneProps {
  doc: DocumentInfo;
  onReset: () => void;
  highlightedFact?: string;
}

export const DocumentPane: React.FC<DocumentPaneProps> = ({ doc, onReset, highlightedFact }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);

  const renderIcon = () => {
    switch (doc.kind) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'png':
      case 'jpg':
        return <ImageIcon className="w-8 h-8 text-emerald-500" />;
      default:
        return <FileCode className="w-8 h-8 text-amber-500" />;
    }
  };

  return (
    <aside className="w-full lg:w-88 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--ol-border)] bg-[var(--ol-sidebar)] p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 overflow-y-auto max-h-[45vh] lg:max-h-none">
      {/* Document Header & Swap Button */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--ol-border)] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-14 rounded-lg bg-[var(--ol-surface)] border border-[var(--ol-border)] flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="font-head font-bold text-sm text-[var(--ol-brand)] truncate" title={doc.name}>
              {doc.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--ol-accent)]/10 text-[var(--ol-accent)] border border-[var(--ol-accent)]/30 font-bold">
                {doc.kind}
              </span>
              <span className="text-[10px] text-[var(--ol-muted)] font-mono">
                {(doc.sizeBytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          title="Swap Document"
          className="p-1.5 rounded-md text-[var(--ol-muted)] hover:text-[var(--ol-accent)] hover:bg-[var(--ol-surface)] transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-[var(--ol-panel)] border border-[var(--ol-border)]">
          <span className="text-[10px] text-[var(--ol-muted)] block uppercase font-mono font-bold">Context</span>
          <span className="font-semibold text-[var(--ol-brand)] truncate block mt-0.5">
            {doc.detectedContext || 'General'}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--ol-panel)] border border-[var(--ol-border)]">
          <span className="text-[10px] text-[var(--ol-muted)] block uppercase font-mono font-bold">Pages / Words</span>
          <span className="font-semibold text-[var(--ol-brand)] truncate block mt-0.5">
            {doc.pageCount ? `${doc.pageCount} pgs` : ''} {doc.wordCount ? `(${doc.wordCount} w)` : ''}
          </span>
        </div>
      </div>

      {/* Data Visualization Section */}
      <div className="border border-[var(--ol-border)] rounded-2xl bg-[var(--ol-panel)] overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowVisualizer(!showVisualizer)}
          className="w-full p-3 bg-[var(--ol-surface)] border-b border-[var(--ol-border)] text-xs font-bold text-[var(--ol-brand)] flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--ol-accent)]" />
            <span>Document Data Analytics</span>
          </span>
          {showVisualizer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showVisualizer && (
          <div className="p-3">
            <DataVisualizer facts={doc.facts} doc={doc} />
          </div>
        )}
      </div>

      {/* Structured Key Facts */}
      <KeyFactsCard facts={doc.facts} highlightedKey={highlightedFact} />

      {/* Extracted Raw Text Preview Expander */}
      {doc.text && (
        <div className="mt-auto border-t border-[var(--ol-border)] pt-3">
          <button
            type="button"
            onClick={() => setShowFullText(!showFullText)}
            className="w-full text-xs font-semibold text-[var(--ol-muted)] hover:text-[var(--ol-brand)] flex items-center justify-between py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
              Raw Extracted Text
            </span>
            {showFullText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFullText && (
            <div className="mt-2 p-3 rounded-lg bg-[var(--ol-surface)] border border-[var(--ol-border)] text-[11px] font-mono text-[var(--ol-brand)] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {doc.text}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
