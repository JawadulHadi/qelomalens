import React from 'react';
import { Plus, MessageSquare, Trash2, FileText, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { ChatSession } from '../types.js';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewAnalysis: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  compact?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewAnalysis,
  onDeleteSession,
  isCollapsed = false,
  onToggleCollapse,
  compact = false,
}) => {
  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 bg-[var(--ol-sidebar)] border-r border-[var(--ol-border)] flex flex-col items-center py-4 gap-4 transition-all">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand Sidebar"
          className="p-2 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onNewAnalysis}
          title="New Analysis"
          className="p-2.5 rounded-xl bg-[var(--ol-accent)] text-white hover:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[var(--ol-border)] my-1" />

        <div className="flex-1 overflow-y-auto space-y-3 w-full px-2 flex flex-col items-center scrollbar-none">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                title={session.title}
                className={`p-2 rounded-lg transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-[var(--ol-accent)] text-white shadow-xs'
                    : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="absolute left-14 bg-[var(--ol-panel)] text-[var(--ol-brand)] border border-[var(--ol-border)] text-xs px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity font-semibold">
                  {session.title}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`shrink-0 bg-[var(--ol-sidebar)] border-r border-[var(--ol-border)] flex flex-col h-full overflow-hidden transition-all ${
        compact ? 'w-64' : 'w-72'
      }`}
    >
      {/* Sidebar Top Header */}
      <div className="p-4 border-b border-[var(--ol-border)] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-head text-lg font-semibold tracking-tight text-[var(--ol-brand)]">
            Analyses
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--ol-surface)] text-[var(--ol-muted)] border border-[var(--ol-border)] font-semibold">
            {sessions.length}
          </span>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1 rounded-md text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Analysis Prominent Action */}
      <div className="p-4 border-b border-[var(--ol-border)] shrink-0 bg-[var(--ol-panel)]">
        <button
          type="button"
          onClick={onNewAnalysis}
          className="btn-ghost-editorial w-full flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>START NEW SESSION</span>
        </button>
      </div>

      {/* Scrollable Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--ol-muted)] flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-[var(--ol-muted)]/40" />
            <p className="font-medium">No previous sessions</p>
            <p className="text-[10px] text-[var(--ol-muted)]/70">
              Upload a document or contract to start your first analysis session.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isActive
                    ? 'bg-[var(--ol-panel)] border-[var(--ol-accent)] ring-1 ring-[var(--ol-accent)]/30 shadow-xs'
                    : 'bg-[var(--ol-surface)] hover:bg-[var(--ol-panel)] border-[var(--ol-border)] hover:border-[var(--ol-border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--ol-accent)]' : 'text-[var(--ol-muted)]'}`} />
                    <h4
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-[var(--ol-brand)]' : 'text-[var(--ol-brand)]/80'
                      }`}
                      title={session.title}
                    >
                      {session.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => onDeleteSession(session.id, e)}
                    title="Delete session"
                    className="p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--ol-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ol-muted)]">
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase px-1.5 py-0.5 rounded bg-[var(--ol-surface)] border border-[var(--ol-border)] font-bold text-[9px] text-[var(--ol-accent)]">
                      {session.document.kind}
                    </span>
                    <span>{session.messages.length} msg{session.messages.length === 1 ? '' : 's'}</span>
                  </div>
                  <span>{session.updatedAt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[var(--ol-border)] bg-[var(--ol-panel)] text-[10px] font-mono text-[var(--ol-muted)] flex items-center justify-between shrink-0">
        <span>QelomaLens Gateway</span>
        <span className="text-emerald-500 font-bold">Session State Active</span>
      </div>
    </aside>
  );
};
