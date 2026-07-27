import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../common/types.js';

export interface CapabilityPlugin {
  id: string;
  name: string;
  description: string;
  appliesTo: ('text' | 'image' | 'pdf' | 'docx' | 'bytes')[];
  confidenceGate: number;

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string;
  outputSchema: Record<string, any>;
  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult;
}
