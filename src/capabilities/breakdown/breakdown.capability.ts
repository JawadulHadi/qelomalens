import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const BreakdownCapability: CapabilityPlugin = {
  id: 'BREAKDOWN',
  name: 'Section & Line Breakdown',
  description: 'Line-item and section-by-section explanation of the content.',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    return `You are QelomaLens BREAKDOWN engine. Provide a structured section-by-section breakdown of the document.

Provide output strictly as JSON matching this schema:
{
  "sections": [
    {
      "heading": "Earnings & Allowances",
      "items": [
        { "label": "Basic Salary", "value": "$4,200", "notes": "Monthly base" }
      ]
    }
  ],
  "totalItemsCount": 8
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          required: ['heading', 'items'],
          properties: {
            heading: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['label'],
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
      },
      totalItemsCount: { type: 'number' },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    const text = envelope.text || '';
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    return {
      output: {
        sections: [
          {
            heading: 'Extracted Text Lines',
            items: lines.slice(0, 5).map((line) => ({ label: 'Line Item', value: line })),
          },
        ],
        totalItemsCount: lines.length,
      },
      confidence: 0.7,
      source: 'rule-based',
    };
  },
};
