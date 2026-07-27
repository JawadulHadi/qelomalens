import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const CompareCapability: CapabilityPlugin = {
  id: 'COMPARE',
  name: 'Compare Inputs',
  description: 'Difference analysis between two inputs or against a supplied benchmark.',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    const benchmark = options?.benchmark || 'standard benchmark';
    return `You are QelomaLens COMPARE engine. Perform field-level comparison between the input and ${benchmark}.

Provide output strictly as JSON matching this schema:
{
  "comparisonSummary": "Summary of key differences and alignment",
  "differences": [
    { "field": "Base Salary", "inputVal": "$5,000", "benchmarkVal": "$4,800", "status": "different" }
  ],
  "alignmentPercentage": 88
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['comparisonSummary', 'differences'],
    properties: {
      comparisonSummary: { type: 'string' },
      differences: {
        type: 'array',
        items: {
          type: 'object',
          required: ['field', 'inputVal', 'benchmarkVal'],
          properties: {
            field: { type: 'string' },
            inputVal: { type: 'string' },
            benchmarkVal: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
      alignmentPercentage: { type: 'number' },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    return {
      output: {
        comparisonSummary: 'Fallback field-level comparison against reference standard.',
        differences: [
          { field: 'Format', inputVal: envelope.source.kind.toUpperCase(), benchmarkVal: 'PDF', status: 'informational' },
        ],
        alignmentPercentage: 90,
      },
      confidence: 0.7,
      source: 'rule-based',
    };
  },
};
