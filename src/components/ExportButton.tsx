import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, ChevronDown, Check } from 'lucide-react';
import { ChatMessage, DocumentInfo } from '../types.js';
import { exportChatAsJson, exportChatAsMarkdown } from '../utils/export.js';

interface ExportButtonProps {
  messages: ChatMessage[];
  activeDoc?: DocumentInfo | null;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ messages, activeDoc }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<'MD' | 'JSON' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportMarkdown = () => {
    exportChatAsMarkdown(messages, activeDoc);
    setExportedFormat('MD');
    setIsOpen(false);
    setTimeout(() => setExportedFormat(null), 2500);
  };

  const handleExportJson = () => {
    exportChatAsJson(messages, activeDoc);
    setExportedFormat('JSON');
    setIsOpen(false);
    setTimeout(() => setExportedFormat(null), 2500);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Export conversation history as JSON or Markdown"
        className="px-2.5 py-1 text-xs font-semibold text-[var(--ol-accent)] hover:bg-[var(--ol-accent)]/10 border border-[var(--ol-accent)]/30 rounded-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
      >
        {exportedFormat ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Download className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
        )}
        <span className="hidden sm:inline">
          {exportedFormat ? `Downloaded ${exportedFormat}!` : 'Export Chat'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[var(--ol-panel)] border border-[var(--ol-border)] shadow-xl z-50 py-1 font-body text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 font-head text-[10px] uppercase font-bold text-[var(--ol-muted)] tracking-wider border-b border-[var(--ol-border)]">
            Export Format
          </div>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <div className="font-semibold">Markdown (.md)</div>
              <div className="text-[10px] text-[var(--ol-muted)]">Formatted document with citations</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <div className="font-semibold">JSON (.json)</div>
              <div className="text-[10px] text-[var(--ol-muted)]">Raw structured conversation data</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
