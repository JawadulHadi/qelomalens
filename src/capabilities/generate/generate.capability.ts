import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const GenerateCapability: CapabilityPlugin = {
  id: 'GENERATE',
  name: 'Generate Content',
  description: 'Produces new content grounded in the input (emails, reports, replies, etc.).',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    const instruction = options?.instruction || options?.GENERATE?.instruction || 'Draft a professional follow-up query based on this document.';
    const format = options?.format || options?.GENERATE?.format || 'email';
    const tone = options?.tone || options?.GENERATE?.tone || 'professional';

    return `You are QelomaLens GENERATE engine. Produce grounded content based on the input text and instruction.
User Instruction: "${instruction}"
Format: ${format}
Tone: ${tone}

Provide output strictly as JSON matching this schema:
{
  "generatedContent": "Drafted text response here...",
  "subject": "Email Subject Line if applicable",
  "format": "${format}",
  "tone": "${tone}"
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['generatedContent'],
    properties: {
      generatedContent: { type: 'string' },
      subject: { type: 'string' },
      format: { type: 'string' },
      tone: { type: 'string' },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    const instruction = options?.instruction || options?.GENERATE?.instruction || 'Follow-up request';
    return {
      output: {
        subject: `Regarding ${envelope.source.name}`,
        generatedContent: `Dear Team,\n\nI am writing regarding ${envelope.source.name}. ${instruction}\n\nThank you,\nBest regards.`,
        format: 'email',
        tone: 'professional',
      },
      confidence: 0.75,
      source: 'rule-based',
    };
  },
};
