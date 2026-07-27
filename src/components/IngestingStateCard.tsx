import React, { useEffect, useState } from 'react';
import { FileCheck, Sparkles, Eye, UploadCloud } from 'lucide-react';

interface IngestingStateCardProps {
  filename: string;
}

export const IngestingStateCard: React.FC<IngestingStateCardProps> = ({ filename }) => {
  const [stage, setStage] = useState<'uploading' | 'reading' | 'understanding'>('uploading');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('reading'), 600);
    const t2 = setTimeout(() => setStage('understanding'), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-[var(--ol-panel)] border border-[var(--ol-border)] shadow-xl text-center flex flex-col items-center gap-5">
      {/* Thumbnail Box with Scanning Animation */}
      <div className="relative w-24 h-32 rounded-xl bg-[var(--ol-surface)] border border-[var(--ol-border)] flex flex-col items-center justify-center overflow-hidden shadow-inner">
        <div className="animate-scanline" />
        <div className="text-[var(--ol-muted)] flex flex-col items-center gap-1">
          <FileCheck className="w-8 h-8 text-[var(--ol-accent)]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ol-accent)] font-bold">{filename.split('.').pop() || 'FILE'}</span>
        </div>
      </div>

      <div>
        <h3 className="font-head font-bold text-lg text-[var(--ol-brand)] truncate max-w-xs mx-auto">
          {filename}
        </h3>
        
        {/* Staged Status Indicator */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs font-semibold text-[var(--ol-accent)]">
          {stage === 'uploading' && (
            <>
              <UploadCloud className="w-4 h-4 animate-bounce" />
              <span>Stage 1/3: Uploading & Storing Raw Input…</span>
            </>
          )}
          {stage === 'reading' && (
            <>
              <Eye className="w-4 h-4 animate-pulse" />
              <span>Stage 2/3: Reading & Normalizing Format…</span>
            </>
          )}
          {stage === 'understanding' && (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Stage 3/3: AI Understanding & Extracting Facts…</span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[var(--ol-surface)] h-2 rounded-full overflow-hidden border border-[var(--ol-border)]">
        <div
          className="bg-[var(--ol-accent)] h-full transition-all duration-500 rounded-full"
          style={{
            width: stage === 'uploading' ? '30%' : stage === 'reading' ? '65%' : '90%',
          }}
        />
      </div>
    </div>
  );
};
