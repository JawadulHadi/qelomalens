import { CapabilityPlugin } from '../capability.interface.js';
import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../../common/types.js';

export const NextActionsCapability: CapabilityPlugin = {
  id: 'NEXT_ACTIONS',
  name: 'Recommended Follow-ups',
  description: 'Recommended follow-ups and to-dos derived from content.',
  appliesTo: ['text', 'image', 'pdf', 'docx', 'bytes'],
  confidenceGate: 0.7,

  promptTemplate(envelope: InputEnvelope, options?: CapabilityRunOptions): string {
    return `You are QelomaLens NEXT_ACTIONS engine. Derive clear, actionable follow-up tasks from the content.

Provide output strictly as JSON matching this schema:
{
  "actions": [
    {
      "priority": "High" | "Medium" | "Low",
      "task": "Verify tax deduction with HR department",
      "owner": "Employee",
      "deadline": "Within 5 business days"
    }
  ]
}`;
  },

  outputSchema: {
    type: 'object',
    required: ['actions'],
    properties: {
      actions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['priority', 'task'],
          properties: {
            priority: { type: 'string' },
            task: { type: 'string' },
            owner: { type: 'string' },
            deadline: { type: 'string' },
          },
        },
      },
    },
  },

  fallback(envelope: InputEnvelope, options?: CapabilityRunOptions): CapabilityRunResult {
    return {
      output: {
        actions: [
          { priority: 'High', task: 'Review extracted document key facts', owner: 'User', deadline: 'Immediate' },
          { priority: 'Medium', task: 'Store document copy in secured archive', owner: 'Admin', deadline: '30 days' },
        ],
      },
      confidence: 0.75,
      source: 'rule-based',
    };
  },
};
