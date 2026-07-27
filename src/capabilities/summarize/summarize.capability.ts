import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const SummarizeCapability: CapabilityPlugin = {
  id: 'SUMMARIZE',
  name: 'Summarize Document',
  description: 'Provides a plain-language overview of the input with configurable depth.',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    const length = options?.length || 'medium';
    const language = options?.language || 'en';

    return `You are QelomaLens SUMMARIZE engine. Provide a concise, clear summary of the provided content.
Target Length: ${length}
Target Language: ${language}

Write the "summary" field in a warm, human, encouraging voice — like a sharp colleague who's genuinely glad to help, not a legal disclaimer. It's fine to briefly note what kind of document this looks like and lead with a small, genuine compliment if something in it is impressive (a strong track record, a clear achievement, a well-structured contract). Stay grounded strictly in the document's actual content — never invent facts, and never let warmth get in the way of accuracy.

Provide output strictly as JSON matching this schema:
{
  "summary": "Plain language overview paragraph",
  "keyTakeaways": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "wordCount": 120
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['summary', 'keyTakeaways'],
    properties: {
      summary: { type: 'string' },
      keyTakeaways: { type: 'array', items: { type: 'string' } },
      wordCount: { type: 'number' },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    const text = envelope.text || '';
    const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 10);
    const topSentences = sentences.slice(0, 3);
    const fallbackSummary = topSentences.length > 0
      ? topSentences.join(' ')
      : `Extractive overview for ${envelope.source.name} (${envelope.source.kind.toUpperCase()} file).`;

    return {
      output: {
        summary: fallbackSummary,
        keyTakeaways: topSentences.length > 0 ? topSentences : ['Document ingested successfully.', 'Text extracted via rule-based normalizer.'],
        wordCount: fallbackSummary.split(/\s+/).length,
      },
      confidence: 0.75,
      source: 'rule-based',
    };
  },
};
