import React, { useState, useRef } from 'react';
import { Upload, FileText, FileCode, Image, ChevronDown, Link as LinkIcon, Send } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onTextPaste: (text: string, title?: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, onTextPaste }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExpander, setShowExpander] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText.trim()) {
      onTextPaste(pastedText.trim(), pastedTitle.trim() || 'pasted_text.txt');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col gap-4">
      {/* Primary Drop Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl p-8 sm:p-12 border-2 border-dashed text-center transition-all duration-200 flex flex-col items-center justify-center gap-4 shadow-xl ${
          isDragOver
            ? 'border-[var(--ol-accent)] bg-[var(--ol-accent)]/10 scale-[1.01]'
            : 'border-[var(--ol-border)] hover:border-[var(--ol-accent)] bg-[var(--ol-panel)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt"
          onChange={handleFileChange}
        />

        <div className="w-16 h-16 rounded-full bg-[var(--ol-surface)] text-[var(--ol-accent)] flex items-center justify-center border border-[var(--ol-border)] shadow-md">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h2 className="font-head text-2xl sm:text-3xl font-semibold text-[var(--ol-brand)] tracking-tight">
            Drop anything. Understand it.
          </h2>
          <p className="font-mono text-xs text-[var(--ol-muted)] uppercase tracking-widest mt-2">
            DRAG A FILE OR <span className="text-[var(--ol-brand)] font-bold underline cursor-pointer">BROWSE LOCAL FILES</span>
          </p>
        </div>

        {/* Supported file types chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {['PDF', 'DOCX', 'PNG', 'JPG', 'TXT'].map((type) => (
            <span
              key={type}
              className="text-[10px] text-[var(--ol-muted)] font-mono border-b border-[var(--ol-border)] pb-0.5 tracking-wider uppercase font-medium"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Secondary Affordance: Paste Text or Link */}
      <div className="bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)] overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => setShowExpander(!showExpander)}
          className="w-full px-4 py-3 text-xs font-medium text-[var(--ol-muted)] hover:text-[var(--ol-brand)] flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--ol-accent)]" />
            or paste raw text / contract clause
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExpander ? 'rotate-180' : ''}`} />
        </button>

        {showExpander && (
          <form onSubmit={handleTextSubmit} className="p-4 pt-0 border-t border-[var(--ol-border)] flex flex-col gap-3 mt-2">
            <input
              type="text"
              placeholder="Title (optional, e.g., 'Employment Agreement Clause')"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-lg border border-[var(--ol-border)] bg-[var(--ol-surface)] text-[var(--ol-brand)] focus:outline-hidden focus:border-[var(--ol-accent)]"
            />
            <textarea
              rows={4}
              placeholder="Paste text content here…"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="text-xs p-3 rounded-lg border border-[var(--ol-border)] bg-[var(--ol-surface)] text-[var(--ol-brand)] focus:outline-hidden focus:border-[var(--ol-accent)] font-mono resize-none"
            />
            <button
              type="submit"
              disabled={!pastedText.trim()}
              className="self-end px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[var(--ol-accent)] hover:opacity-90 text-white disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ingest Text</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
