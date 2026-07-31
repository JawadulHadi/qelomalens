/// <reference types="react" />
import { useEffect, useState } from "react";
import { Header } from "./components/Header.js";
import { DropZone } from "./components/DropZone.js";
import { LandingHero } from "./components/LandingHero.js";
import { IngestingStateCard } from "./components/IngestingStateCard.js";
import { DocumentPane } from "./components/DocumentPane.js";
import { MessageBubble } from "./components/MessageBubble.js";
import { ExportButton } from "./components/ExportButton.js";
import { InputBar } from "./components/InputBar.js";
import { Sidebar } from "./components/Sidebar.js";
import { GoogleDriveModal } from "./components/GoogleDriveModal.js";
import { CameraScannerModal } from "./components/CameraScannerModal.js";
import { AuthModal } from "./components/AuthModal.js";
import { api } from "./api/client.js";
import {
  ShellMode,
  AppState,
  DocumentInfo,
  ChatMessage,
  ChatSession,
} from "./types.js";
import { MessageSquare, X, RotateCcw, History } from "lucide-react";

const titleCaseCapability = (id: string): string =>
  id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export default function App() {
  const [shell, setShell] = useState<ShellMode>("full-page");
  const [appState, setAppState] = useState<AppState>("empty");
  const [isDark, setIsDark] = useState(() => {
    return window.document.documentElement.classList.contains("dark");
  });
  const [ingestingFilename, setIngestingFilename] = useState("");
  const [activeDoc, setActiveDoc] = useState<DocumentInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedFact, setHighlightedFact] = useState<string | undefined>(
    undefined,
  );
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [dockedTab, setDockedTab] = useState<"chat" | "doc" | "history">(
    "chat",
  );
  const [widgetTab, setWidgetTab] = useState<"chat" | "doc">("chat");

  // Modal states
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Chat Session History State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync class on html element when isDark changes
  useEffect(() => {
    if (isDark) {
      window.document.documentElement.classList.add("dark");
    } else {
      window.document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Sync current active session when messages or activeDoc update
  useEffect(() => {
    if (activeSessionId && activeDoc) {
      setSessions((prev: ChatSession[]) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                document: activeDoc,
                messages,
                updatedAt: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : s,
        ),
      );
    }
  }, [messages, activeDoc, activeSessionId]);

  // Toggle dark mode class on root html element
  const handleToggleDark = () => {
    setIsDark((prev: boolean) => !prev);
  };

  // Handle session selection
  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(session.id);
      setActiveDoc(session.document);
      setMessages(session.messages);
      setAppState("ready");
      if (dockedTab === "history") {
        setDockedTab("chat");
      }
    }
  };

  // Handle starting a new analysis
  const handleNewAnalysis = () => {
    setActiveSessionId(null);
    setActiveDoc(null);
    setMessages([]);
    setAppState("empty");
    if (dockedTab === "history") {
      setDockedTab("chat");
    }
  };

  // Handle deleting a session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewAnalysis();
    }
  };

  // Handle file or raw text upload
  const handleIngest = async (fileOrText: File | string, title?: string) => {
    const name =
      typeof fileOrText === "string"
        ? title || "pasted_text.txt"
        : fileOrText.name;
    setIngestingFilename(name);
    setAppState("ingesting");

    try {
      const { inputId, envelope, suggestedCapabilities } =
        await api.uploadInput(fileOrText, title);

      // Auto-run SUMMARIZE and EXTRACT_FACTS for the initial response!
      const initialResults = await api.runCapabilities(inputId, [
        "SUMMARIZE",
        "EXTRACT_FACTS",
      ]);

      const summaryRes = initialResults.SUMMARIZE;
      const factsRes = initialResults.EXTRACT_FACTS;

      const extractedFacts = factsRes?.output?.facts || [
        { key: "File Name", value: envelope.source.name },
        { key: "Format", value: envelope.source.kind.toUpperCase() },
        {
          key: "Size",
          value: `${(envelope.source.sizeBytes / 1024).toFixed(1)} KB`,
        },
      ];

      const docInfo: DocumentInfo = {
        inputId,
        name: envelope.source.name,
        kind: envelope.source.kind,
        sizeBytes: envelope.source.sizeBytes,
        detectedContext: envelope.meta.detectedContext,
        wordCount: envelope.meta.wordCount,
        pageCount: envelope.meta.pageCount,
        text: envelope.text,
        facts: extractedFacts,
        suggestedCapabilities,
      };

      setActiveDoc(docInfo);

      // Create opening AI auto-summary message
      const openingMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "ai",
        content:
          summaryRes?.output?.summary ||
          `Got it — I've read through ${envelope.source.name}. Ask me anything about it, or try one of the quick actions below to dig in.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: summaryRes?.source || "gemini-2.5-flash",
        confidence: summaryRes?.confidence || 0.94,
        structuredOutput: summaryRes?.output,
        capabilityId: "SUMMARIZE",
      };

      setMessages([openingMsg]);
      setAppState("ready");

      // Create & store session in history
      const newSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        title: envelope.source.name,
        document: docInfo,
        messages: [openingMsg],
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        updatedAt: "Just now",
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSessionId);
    } catch (err: any) {
      console.error("Ingestion error:", err);
      setAppState("empty");
      alert(`Ingestion failed: ${err.message || "Check server connection."}`);
    }
  };

  const handleImportDriveDocument = (file: {
    name: string;
    content: string;
    kind: "pdf" | "docx" | "png" | "txt";
  }) => {
    handleIngest(file.content, file.name);
  };

  const handleCaptureCameraDocument = (file: File) => {
    handleIngest(file);
  };

  // Run a capability from chip click
  const handleRunCapability = async (capabilityId: string) => {
    if (!activeDoc || isProcessing) return;

    setIsProcessing(true);
    setAppState("conversation");

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: `Run ${titleCaseCapability(capabilityId)} on this document.`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const results = await api.runCapabilities(activeDoc.inputId, [
        capabilityId,
      ]);
      const res = results[capabilityId];

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: "ai",
        content: `Here's what ${titleCaseCapability(capabilityId)} turned up:`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: res?.source || "gemini-2.5-flash",
        confidence: res?.confidence || 0.92,
        structuredOutput: res?.output,
        capabilityId,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: "ai",
        content: `Failed to run ${capabilityId}: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "rule-based",
        confidence: 0.5,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send a chat follow-up query
  const handleSendMessage = async (text: string) => {
    if (!activeDoc || isProcessing) return;

    setIsProcessing(true);
    setAppState("conversation");

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.content,
      }));

      const res = await api.sendChat(activeDoc.inputId, text, chatHistory);

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: "ai",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: res.source,
        confidence: res.confidence,
        citedFacts: res.citedFacts,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: "ai",
        content: `Sorry, I encountered an issue answering your request: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "rule-based",
        confidence: 0.5,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetDocument = () => {
    setActiveDoc(null);
    setMessages([]);
    setAppState("empty");
  };

  const handleClearConversation = () => {
    if (activeDoc) {
      const resetMsg: ChatMessage = {
        id: `msg_reset_${Date.now()}`,
        role: "ai",
        content: `Cleared! ${activeDoc.name} is still loaded — what would you like to look at next?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "gemini-2.5-flash",
        confidence: 0.99,
      };
      setMessages([resetMsg]);
      setAppState("ready");
    } else {
      setMessages([]);
    }
  };

  // Render main chat column with Header & Clear Conversation Button
  const renderChatColumn = () => (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[var(--ol-panel)] overflow-hidden">
      {/* Chat Column Top Header Bar */}
      <div className="px-4 py-2.5 bg-[var(--ol-surface)] border-b border-[var(--ol-border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[var(--ol-accent)] shrink-0" />
          <span className="text-xs font-bold font-head uppercase tracking-wider text-[var(--ol-brand)] truncate">
            {activeDoc ? `Analysis: ${activeDoc.name}` : "Conversation"}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--ol-panel)] border border-[var(--ol-border)] text-[var(--ol-muted)]">
            {messages.length} msg{messages.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Header Actions: Export Chat & Clear Conversation */}
        {messages.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <ExportButton messages={messages} activeDoc={activeDoc} />
            <button
              type="button"
              onClick={handleClearConversation}
              title="Clear message history and start fresh"
              className="px-2.5 py-1 text-xs font-semibold text-[var(--ol-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--ol-border)] hover:border-red-500/30 rounded-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
              <RotateCcw className="w-3.5 h-3.5 text-current" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-5 aria-live-polite">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onCitationClick={(key) => setHighlightedFact(key)}
          />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-[var(--ol-accent)] font-mono p-3 rounded-xl bg-[var(--ol-surface)] border border-[var(--ol-border)] w-fit animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[var(--ol-accent)]" />
            <span>QelomaLens capability engine executing…</span>
          </div>
        )}
      </div>

      {/* Docked Input Bar */}
      <InputBar
        onSendMessage={handleSendMessage}
        onRunCapability={handleRunCapability}
        onUploadClick={handleResetDocument}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenCameraModal={() => setIsCameraModalOpen(true)}
        disabled={!activeDoc || isProcessing}
        suggestedCapabilities={activeDoc?.suggestedCapabilities}
      />
    </div>
  );

  const handleShellChange = (s: ShellMode) => {
    setShell(s);
    if (s === "floating") {
      setWidgetOpen(true);
    }
  };

  // Helper to render active panel content based on state
  const renderPanelContent = () => {
    if (appState === "empty") {
      return (
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto w-full">
          <LandingHero
            onFileSelect={handleIngest}
            onTextPaste={handleIngest}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        </div>
      );
    }

    if (appState === "ingesting") {
      return (
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <IngestingStateCard filename={ingestingFilename} />
        </div>
      );
    }

    if (activeDoc) {
      return renderChatColumn();
    }

    return null;
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[var(--ol-surface)] text-[var(--ol-brand)] font-body transition-colors">
      {/* Header */}
      <Header
        shell={shell}
        onShellChange={handleShellChange}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content View based on Shell Mode */}
      <main className="flex-1 min-h-0 overflow-hidden relative bg-[var(--ol-surface)]">
        {/* SHELL 1: FULL-PAGE WORKSPACE */}
        {shell === "full-page" && (
          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden">
            <Sidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewAnalysis={handleNewAnalysis}
              onDeleteSession={handleDeleteSession}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col lg:flex-row w-full h-full min-h-0 overflow-hidden">
              {activeDoc &&
              (appState === "ready" || appState === "conversation") ? (
                <>
                  <DocumentPane
                    doc={activeDoc}
                    onReset={handleResetDocument}
                    highlightedFact={highlightedFact}
                  />
                  {renderChatColumn()}
                </>
              ) : (
                renderPanelContent()
              )}
            </div>
          </div>
        )}

        {/* SHELL 2: DOCKED SIDE PANEL */}
        {shell === "docked" && (
          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden relative bg-[var(--ol-surface)]">
            {/* Background Simulated Host Canvas */}
            <div className="flex-1 p-8 overflow-y-auto hidden md:flex flex-col gap-6 opacity-30 select-none pointer-events-none">
              <div className="flex items-center justify-between border-b border-[var(--ol-border)] pb-4">
                <div className="h-6 w-48 bg-[var(--ol-panel)] rounded-md animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-[var(--ol-panel)] rounded-md" />
                  <div className="h-8 w-20 bg-[var(--ol-panel)] rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
                <div className="h-32 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
                <div className="h-32 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
              </div>
              <div className="h-64 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
            </div>

            {/* Docked Panel Container */}
            <div className="w-full max-w-md h-full bg-[var(--ol-panel)] border-l border-[var(--ol-border)] shadow-2xl flex flex-col overflow-hidden z-20 shrink-0">
              <div className="px-4 py-3 bg-[var(--ol-sidebar)] border-b border-[var(--ol-border)] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ol-brand)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--ol-accent)]" />
                  QelomaLens Docked Panel
                </span>

                {/* Docked Tab Switcher */}
                <div className="flex items-center bg-[var(--ol-surface)] p-0.5 rounded-lg border border-[var(--ol-border)]">
                  {activeDoc &&
                    (appState === "ready" || appState === "conversation") && (
                      <>
                        <button
                          type="button"
                          onClick={() => setDockedTab("chat")}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                            dockedTab === "chat"
                              ? "bg-[var(--ol-accent)] text-white shadow-xs"
                              : "text-[var(--ol-muted)] hover:text-[var(--ol-brand)]"
                          }`}>
                          Chat ({messages.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDockedTab("doc")}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                            dockedTab === "doc"
                              ? "bg-[var(--ol-accent)] text-white shadow-xs"
                              : "text-[var(--ol-muted)] hover:text-[var(--ol-brand)]"
                          }`}>
                          Doc
                        </button>
                      </>
                    )}
                  <button
                    type="button"
                    onClick={() => setDockedTab("history")}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      dockedTab === "history"
                        ? "bg-[var(--ol-accent)] text-white shadow-xs"
                        : "text-[var(--ol-muted)] hover:text-[var(--ol-brand)]"
                    }`}>
                    <History className="w-3 h-3" />
                    <span>History ({sessions.length})</span>
                  </button>
                </div>
              </div>

              {dockedTab === "history" ? (
                <div className="flex-1 overflow-hidden">
                  <Sidebar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onNewAnalysis={handleNewAnalysis}
                    onDeleteSession={handleDeleteSession}
                    compact={true}
                  />
                </div>
              ) : activeDoc &&
                (appState === "ready" || appState === "conversation") ? (
                dockedTab === "doc" ? (
                  <DocumentPane
                    doc={activeDoc}
                    onReset={handleResetDocument}
                    highlightedFact={highlightedFact}
                  />
                ) : (
                  renderChatColumn()
                )
              ) : (
                renderPanelContent()
              )}
            </div>
          </div>
        )}

        {/* SHELL 3: FLOATING WIDGET */}
        {shell === "floating" && (
          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden relative bg-[var(--ol-surface)]">
            {/* Background Workspace Canvas */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 opacity-25 select-none pointer-events-none">
              <div className="flex items-center justify-between border-b border-[var(--ol-border)] pb-4">
                <div className="h-6 w-64 bg-[var(--ol-panel)] rounded-md" />
                <div className="h-8 w-24 bg-[var(--ol-panel)] rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="h-48 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
                <div className="h-48 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
              </div>
              <div className="h-80 bg-[var(--ol-panel)] rounded-xl border border-[var(--ol-border)]" />
            </div>

            {/* Floating Assistant Launcher & Popup */}
            {widgetOpen ? (
              <div className="fixed bottom-6 right-6 w-96 sm:w-[420px] h-[600px] max-h-[85vh] rounded-2xl border border-[var(--ol-border)] bg-[var(--ol-panel)] shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="p-3 bg-[var(--ol-sidebar)] border-b border-[var(--ol-border)] text-[var(--ol-brand)] flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--ol-accent)] animate-pulse" />
                    QelomaLens Widget
                  </span>

                  {/* Widget Tab Switcher if doc is present */}
                  {activeDoc &&
                    (appState === "ready" || appState === "conversation") && (
                      <div className="flex items-center bg-[var(--ol-surface)] p-0.5 rounded-lg border border-[var(--ol-border)]">
                        <button
                          type="button"
                          onClick={() => setWidgetTab("chat")}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                            widgetTab === "chat"
                              ? "bg-[var(--ol-accent)] text-white shadow-xs"
                              : "text-[var(--ol-muted)] hover:text-[var(--ol-brand)]"
                          }`}>
                          Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => setWidgetTab("doc")}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                            widgetTab === "doc"
                              ? "bg-[var(--ol-accent)] text-white shadow-xs"
                              : "text-[var(--ol-muted)] hover:text-[var(--ol-brand)]"
                          }`}>
                          Doc Facts
                        </button>
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={() => setWidgetOpen(false)}
                    className="p-1 hover:bg-[var(--ol-surface)] rounded text-[var(--ol-muted)] hover:text-[var(--ol-brand)] transition-colors cursor-pointer"
                    title="Minimize Widget">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeDoc &&
                (appState === "ready" || appState === "conversation") ? (
                  widgetTab === "doc" ? (
                    <DocumentPane
                      doc={activeDoc}
                      onReset={handleResetDocument}
                      highlightedFact={highlightedFact}
                    />
                  ) : (
                    renderChatColumn()
                  )
                ) : (
                  renderPanelContent()
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWidgetOpen(true)}
                title="Open QelomaLens Widget"
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--ol-accent)] hover:opacity-90 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-50 cursor-pointer ring-4 ring-[var(--ol-accent)]/30">
                <MessageSquare className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onImportDriveDocument={handleImportDriveDocument}
      />

      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCaptureCameraDocument}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
