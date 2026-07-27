import React, { useState } from 'react';
import {
  Copy,
  Check,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  ListTree,
  GitCompare,
  ArrowRightCircle,
} from 'lucide-react';
import { ChatMessage } from '../types.js';
import { KeyFactsCard } from './KeyFactsCard.js';

const titleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const VERDICT_STYLES: Record<string, { badge: string; Icon: typeof ShieldCheck }> = {
  correct: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', Icon: ShieldCheck },
  fair: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', Icon: ShieldCheck },
  concerning: { badge: 'bg-red-500/10 text-red-500 border-red-500/30', Icon: AlertOctagon },
  compliant: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', Icon: ShieldCheck },
  insufficient_data: { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30', Icon: HelpCircle },
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-[var(--ol-surface)] text-[var(--ol-muted)] border-[var(--ol-border)]',
};

const DIFF_STATUS_STYLES: Record<string, string> = {
  different: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  match: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  same: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  informational: 'bg-[var(--ol-surface)] text-[var(--ol-muted)] border-[var(--ol-border)]',
};

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick?: (factKey: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCitationClick }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderConfidenceMeter = (score: number = 0.9) => {
    let colorClass = 'bg-[var(--ol-ok)]';
    let label = 'High Confidence';
    let Icon = ShieldCheck;

    if (score < 0.7) {
      colorClass = 'bg-[var(--ol-danger)]';
      label = 'Low Confidence';
      Icon = AlertOctagon;
    } else if (score < 0.85) {
      colorClass = 'bg-[var(--ol-warn)]';
      label = 'Moderate Confidence';
      Icon = AlertTriangle;
    }

    return (
      <div className="flex items-center gap-2 text-[10px] text-[var(--ol-muted)] font-mono" title={`${label} (${Math.round(score * 100)}%)`}>
        <Icon className={`w-3.5 h-3.5 ${score >= 0.85 ? 'text-[var(--ol-ok)]' : score >= 0.7 ? 'text-[var(--ol-warn)]' : 'text-[var(--ol-danger)]'}`} />
        <div className="flex gap-0.5 w-12 h-1.5 rounded-full overflow-hidden bg-[var(--ol-border)]">
          <div className={`h-full flex-1 ${score >= 0.3 ? colorClass : 'bg-[var(--ol-border)]'}`} />
          <div className={`h-full flex-1 ${score >= 0.7 ? colorClass : 'bg-[var(--ol-border)]'}`} />
          <div className={`h-full flex-1 ${score >= 0.9 ? colorClass : 'bg-[var(--ol-border)]'}`} />
        </div>
        <span>{Math.round(score * 100)}%</span>
      </div>
    );
  };

  const renderStructuredOutput = (output: Record<string, any>) => {
    if (output.summary) {
      return (
        <div className="flex flex-col gap-2 mt-1">
          <p className="leading-relaxed text-sm font-body">{output.summary}</p>
          {output.keyTakeaways && Array.isArray(output.keyTakeaways) && (
            <ul className="list-disc pl-5 text-xs flex flex-col gap-1 mt-1 font-body text-[var(--ol-brand)] dark:text-gray-200">
              {output.keyTakeaways.map((point: string, idx: number) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (output.facts) {
      return (
        <div className="flex flex-col gap-3">
          <KeyFactsCard facts={output.facts} onFactClick={onCitationClick} />
          {output.entities && Array.isArray(output.entities) && output.entities.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {output.entities.map((entity: any, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--ol-surface)] border border-[var(--ol-border)] text-[var(--ol-muted)]"
                >
                  <span className="text-[var(--ol-brand)] font-semibold">{entity.name}</span> · {entity.type}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (output.verdict) {
      const key = String(output.verdict).toLowerCase();
      const style = VERDICT_STYLES[key] || VERDICT_STYLES.insufficient_data;
      const VerdictIcon = style.Icon;
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${style.badge}`}
            >
              <VerdictIcon className="w-3.5 h-3.5" />
              {titleCase(String(output.verdict))}
            </span>
            {typeof output.score === 'number' && (
              <div className="flex items-center gap-2 text-[10px] text-[var(--ol-muted)] font-mono">
                <div className="w-20 h-1.5 rounded-full overflow-hidden bg-[var(--ol-border)]">
                  <div
                    className="h-full bg-[var(--ol-accent)] transition-all duration-500"
                    style={{ width: `${Math.round(output.score * 100)}%` }}
                  />
                </div>
                <span>{Math.round(output.score * 100)}% score</span>
              </div>
            )}
          </div>
          {output.reasons && Array.isArray(output.reasons) && (
            <ul className="list-disc pl-5 text-xs flex flex-col gap-1 font-body text-[var(--ol-brand)] dark:text-gray-200">
              {output.reasons.map((reason: string, idx: number) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          )}
          {output.citations && Array.isArray(output.citations) && output.citations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {output.citations.map((c: any, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--ol-surface)] border border-[var(--ol-border)] text-[var(--ol-muted)]"
                >
                  <span className="text-[var(--ol-brand)] font-semibold">{c.field}</span>: {c.value}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (output.sections && Array.isArray(output.sections)) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--ol-muted)] px-1">
            <span className="flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
              Section Breakdown
            </span>
            {typeof output.totalItemsCount === 'number' && (
              <span className="text-[10px] font-mono text-[var(--ol-muted)]">{output.totalItemsCount} items</span>
            )}
          </div>
          {output.sections.map((section: any, sIdx: number) => (
            <div key={sIdx} className="rounded-lg border border-[var(--ol-border)] bg-[var(--ol-surface)] overflow-hidden">
              <div className="px-3 py-2 bg-[var(--ol-panel)] border-b border-[var(--ol-border)] text-xs font-bold text-[var(--ol-brand)]">
                {section.heading}
              </div>
              <div className="p-2.5 flex flex-col gap-1.5">
                {(section.items || []).map((item: any, iIdx: number) => (
                  <div key={iIdx} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-[var(--ol-muted)] font-medium min-w-0 break-words">{item.label}</span>
                    <span className="text-[var(--ol-brand)] font-semibold text-right min-w-0 break-words font-mono">
                      {item.value}
                      {item.notes && <span className="block text-[10px] text-[var(--ol-muted)] font-normal font-body">{item.notes}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (output.comparisonSummary) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
            <p className="text-sm font-body leading-relaxed">{output.comparisonSummary}</p>
          </div>
          {typeof output.alignmentPercentage === 'number' && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--ol-muted)] font-mono">
              <span className="uppercase font-bold">Alignment</span>
              <div className="w-24 h-1.5 rounded-full overflow-hidden bg-[var(--ol-border)]">
                <div
                  className="h-full bg-[var(--ol-accent)] transition-all duration-500"
                  style={{ width: `${output.alignmentPercentage}%` }}
                />
              </div>
              <span>{output.alignmentPercentage}%</span>
            </div>
          )}
          {output.differences && Array.isArray(output.differences) && (
            <div className="flex flex-col gap-1.5">
              {output.differences.map((diff: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-[var(--ol-surface)] border border-[var(--ol-border)] text-xs"
                >
                  <span className="font-semibold text-[var(--ol-brand)] min-w-0 truncate">{diff.field}</span>
                  <span className="font-mono text-[var(--ol-muted)] shrink-0">
                    {diff.inputVal} vs {diff.benchmarkVal}
                  </span>
                  {diff.status && (
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${
                        DIFF_STATUS_STYLES[String(diff.status).toLowerCase()] || DIFF_STATUS_STYLES.informational
                      }`}
                    >
                      {diff.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (output.actions && Array.isArray(output.actions)) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--ol-muted)] px-1">
            <ArrowRightCircle className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
            Recommended Next Steps
          </div>
          {output.actions.map((action: any, idx: number) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[var(--ol-surface)] border border-[var(--ol-border)] text-xs"
            >
              <span className="text-[var(--ol-brand)] font-medium min-w-0 break-words">{action.task}</span>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {action.priority && (
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                      PRIORITY_STYLES[String(action.priority).toLowerCase()] || PRIORITY_STYLES.low
                    }`}
                  >
                    {action.priority}
                  </span>
                )}
                {(action.owner || action.deadline) && (
                  <span className="text-[10px] text-[var(--ol-muted)] font-mono whitespace-nowrap">
                    {[action.owner, action.deadline].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (output.generatedContent) {
      return (
        <div className="flex flex-col gap-2 text-xs font-body leading-relaxed whitespace-pre-wrap p-3 rounded bg-[var(--ol-surface)] border border-[var(--ol-border)] font-mono">
          {output.subject && <div className="font-bold border-b border-[var(--ol-border)] pb-1 mb-1">Subject: {output.subject}</div>}
          <div>{output.generatedContent}</div>
        </div>
      );
    }

    return (
      <pre className="text-xs font-mono p-2 rounded bg-[var(--ol-surface)] border border-[var(--ol-border)] overflow-x-auto">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  };

  return (
    <div className={`flex items-start gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-head shadow-xs ${
          isUser
            ? 'bg-[var(--ol-brand)] text-white'
            : 'bg-[var(--ol-surface)] text-[var(--ol-accent)] border border-[var(--ol-border)]'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content Box */}
      <div
        className={`group relative max-w-[85%] sm:max-w-[80%] transition-all ${
          isUser
            ? 'bg-[var(--ol-accent)] text-white rounded-2xl p-4 shadow-md'
            : 'bg-[var(--ol-panel)] text-[var(--ol-brand)] p-4 sm:p-5 rounded-2xl border border-[var(--ol-border)] shadow-md'
        }`}
      >
        {/* Copy button on hover */}
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-[var(--ol-surface)] border border-[var(--ol-border)] text-[var(--ol-muted)] hover:text-[var(--ol-brand)] cursor-pointer"
          title="Copy text"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Capability Label Header */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 bg-[var(--ol-accent)] rounded text-[9px] font-black text-white uppercase tracking-tighter shadow-xs">
                Capability: {message.capabilityId || 'INTELLIGENCE'}
              </div>
            </div>
            <span className="text-[10px] text-[var(--ol-muted)] uppercase font-bold tracking-widest">
              {message.timestamp}
            </span>
          </div>
        )}

        {/* Content Body */}
        {message.structuredOutput ? (
          renderStructuredOutput(message.structuredOutput)
        ) : (
          <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {/* AI Footer: Source Badge + Confidence Meter */}
        {!isUser && (message.source || message.confidence !== undefined) && (
          <div className="mt-4 pt-3 border-t border-[var(--ol-border)] flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono">
            {/* Confidence Meter */}
            {message.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--ol-muted)] uppercase font-bold">Confidence</span>
                <div className="w-24 h-1.5 bg-[var(--ol-surface)] rounded-full overflow-hidden border border-[var(--ol-border)]">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.round((message.confidence || 0.95) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">
                  {(message.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {/* Provider Badge */}
            <div className="text-[10px] text-[var(--ol-muted)] uppercase font-bold">
              Provider: <span className="text-[var(--ol-brand)] font-semibold">{message.source === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Rule-Based Engine'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
