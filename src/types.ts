export type ShellMode = 'full-page' | 'docked' | 'floating';

export type AppState = 'empty' | 'ingesting' | 'ready' | 'conversation';

export interface DocumentInfo {
  inputId: string;
  name: string;
  kind: 'pdf' | 'docx' | 'png' | 'jpg' | 'txt' | 'bytes' | 'url';
  sizeBytes: number;
  detectedContext?: string;
  wordCount?: number;
  pageCount?: number;
  text?: string;
  facts: { key: string; value: string; category?: string }[];
  suggestedCapabilities: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  source?: 'gemini-2.5-flash' | 'rule-based';
  confidence?: number;
  citedFacts?: string[];
  capabilityId?: string;
  structuredOutput?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  document: DocumentInfo;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CapabilityMeta {
  id: string;
  name: string;
  description: string;
  iconName?: string;
}
