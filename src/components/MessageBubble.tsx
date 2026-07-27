import React, { useState } from 'react';
import { Copy, Check, Bot, User, Cpu, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { ChatMessage } from '../types.js';

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
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[var(--ol-brand)] dark:text-white">Extracted Key Facts:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {output.facts.map((fact: any, idx: number) => (
              <div
                key={idx}
                onClick={() => onCitationClick && onCitationClick(fact.key)}
                className="p-2 rounded bg-[var(--ol-surface)] border border-[var(--ol-border)] cursor-pointer hover:border-[var(--ol-accent)] transition-colors flex flex-col"
              >
                <span className="text-[10px] text-[var(--ol-muted)] uppercase">{fact.key}</span>
                <span className="font-bold text-[var(--ol-brand)] dark:text-white mt-0.5">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (output.verdict) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-[var(--ol-surface)] border border-[var(--ol-border)] font-mono">
              Verdict: {output.verdict}
            </span>
          </div>
          {output.reasons && (
            <ul className="list-disc pl-5 text-xs flex flex-col gap-1 font-body text-[var(--ol-brand)] dark:text-gray-200">
              {output.reasons.map((reason: string, idx: number) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          )}
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
