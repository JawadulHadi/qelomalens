import React from 'react';
import { FileText, CheckCircle2, ShieldCheck, GitCompare, ListTree, ArrowRightCircle, Sparkles } from 'lucide-react';

interface CapabilityChipProps {
  id: string;
  name?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: (id: string) => void;
}

export const CapabilityChip: React.FC<CapabilityChipProps> = ({
  id,
  name,
  active = false,
  disabled = false,
  onClick,
}) => {
  const getLabelAndIcon = () => {
    switch (id.toUpperCase()) {
      case 'SUMMARIZE':
        return { label: name || 'Summarize', icon: FileText };
      case 'EXTRACT_FACTS':
        return { label: name || 'Extract Facts', icon: CheckCircle2 };
      case 'VERDICT':
        return { label: name || 'Verdict', icon: ShieldCheck };
      case 'COMPARE':
        return { label: name || 'Compare', icon: GitCompare };
      case 'BREAKDOWN':
        return { label: name || 'Breakdown', icon: ListTree };
      case 'NEXT_ACTIONS':
        return { label: name || 'Next Actions', icon: ArrowRightCircle };
      case 'GENERATE':
        return { label: name || 'Generate', icon: Sparkles };
      default:
        return { label: name || id, icon: Sparkles };
    }
  };

  const { label, icon: Icon } = getLabelAndIcon();

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wide shrink-0 ${
        active
          ? 'bg-[var(--ol-accent)] text-white shadow-xs font-bold'
          : 'bg-[var(--ol-panel)] hover:bg-[var(--ol-surface)] border border-[var(--ol-border)] text-[var(--ol-brand)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-3.5 h-3.5 text-current" />
      <span>{label}</span>
    </button>
  );
};
