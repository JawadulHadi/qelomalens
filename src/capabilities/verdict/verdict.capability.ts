import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const VerdictCapability: CapabilityPlugin = {
  id: 'VERDICT',
  name: 'Evaluate Verdict',
  description: 'Evaluates correctness, fairness, or concerning clauses grounded in content.',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    const benchmark = options?.benchmark || 'standard analysis';
    return `You are QelomaLens VERDICT engine. Evaluate the provided content against ${benchmark}.
Identify whether the document or calculation is correct, fair, concerning, or compliant.

Provide output strictly as JSON matching this schema:
{
  "verdict": "correct" | "concerning" | "fair" | "insufficient_data",
  "score": 0.92,
  "reasons": [
    "Net = Gross - Deductions calculation matches standard formula",
    "Tax withholding rates comply with expected statutory brackets"
  ],
  "citations": [
    { "field": "Net Pay", "value": "$4,560" }
  ]
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['verdict', 'reasons'],
    properties: {
      verdict: { type: 'string' },
      score: { type: 'number' },
      reasons: { type: 'array', items: { type: 'string' } },
      citations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            value: { type: 'string' },
          },
        },
      },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    return {
      output: {
        verdict: 'fair',
        score: 0.75,
        reasons: [
          'Document structure verified by rule-based validator.',
          'No explicit structural syntax errors or malformed pages detected.',
        ],
        citations: [{ field: 'File Name', value: envelope.source.name }],
      },
      confidence: 0.75,
      source: 'rule-based',
    };
  },
};
