export interface SourceInfo {
  kind: 'pdf' | 'docx' | 'png' | 'jpg' | 'txt' | 'bytes' | 'url';
  name: string;
  sizeBytes: number;
}

export interface MediaRef {
  mimeType: string;
  ref: string;
  base64Data?: string;
}

export interface InputMeta {
  pageCount?: number;
  language?: string;
  detectedContext?: string;
  wordCount?: number;
}

export interface ExtractionMeta {
  method: 'gemini-native' | 'rule-based';
  confidence: number;
}

export interface InputEnvelope {
  inputId: string;
  tenantId: string;
  source: SourceInfo;
  text?: string;
  media: MediaRef[];
  meta: InputMeta;
  extraction: ExtractionMeta;
  createdAt: string;
}

export interface CapabilityRunOptions {
  length?: 'short' | 'medium' | 'detailed';
  language?: string;
  benchmark?: string;
  instruction?: string;
  format?: string;
  tone?: string;
  [key: string]: any;
}

export interface CapabilityRunResult {
  output: Record<string, any>;
  confidence: number;
  source: 'gemini-2.5-flash' | 'rule-based';
  executionTimeMs?: number;
}

export interface InputRunResponse {
  inputId: string;
  results: Record<string, CapabilityRunResult>;
}

export interface SuggestedCapabilitiesResponse {
  inputId: string;
  envelope: InputEnvelope;
  suggestedCapabilities: string[];
}

export interface TenantInfo {
  tenantId: string;
  name: string;
  apiKey: string;
  status: 'active' | 'suspended';
  enabledCapabilities?: string[];
}
