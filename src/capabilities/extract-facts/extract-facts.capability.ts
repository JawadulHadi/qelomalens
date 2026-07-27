import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const ExtractFactsCapability: CapabilityPlugin = {
  id: 'EXTRACT_FACTS',
  name: 'Extract Key Facts',
  description: 'Extracts structured key/value facts and entities detected in the content.',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    return `You are QelomaLens EXTRACT_FACTS engine. Extract all key data points, monetary values, dates, parties/entities, and key figures from the input.

Provide output strictly as JSON matching this schema:
{
  "facts": [
    { "key": "Net Pay", "value": "$4,560", "category": "Financial" },
    { "key": "Issue Date", "value": "2026-07-15", "category": "Date" }
  ],
  "entities": [
    { "name": "ACME Corp", "type": "Organization" }
  ]
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['facts', 'entities'],
    properties: {
      facts: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
            category: { type: 'string' },
          },
        },
      },
      entities: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
      },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    const text = envelope.text || '';
    const facts: { key: string; value: string; category?: string }[] = [];

    // Simple regex extraction for fallback
    const currencyMatches = text.match(/([$€£]\s?\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|SGD|EUR|GBP))/gi);
    if (currencyMatches) {
      currencyMatches.slice(0, 5).forEach((val, idx) => {
        facts.push({ key: `Extracted Amount ${idx + 1}`, value: val, category: 'Financial' });
      });
    }

    const dateMatches = text.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi);
    if (dateMatches) {
      dateMatches.slice(0, 3).forEach((val, idx) => {
        facts.push({ key: `Extracted Date ${idx + 1}`, value: val, category: 'Date' });
      });
    }

    if (facts.length === 0) {
      facts.push(
        { key: 'File Name', value: envelope.source.name, category: 'Metadata' },
        { key: 'File Format', value: envelope.source.kind.toUpperCase(), category: 'Metadata' },
        { key: 'File Size', value: `${(envelope.source.sizeBytes / 1024).toFixed(1)} KB`, category: 'Metadata' }
      );
    }

    return {
      output: {
        facts,
        entities: [{ name: envelope.source.name, type: 'Document' }],
      },
      confidence: 0.7,
      source: 'rule-based',
    };
  },
};
