import { AIProvider } from './ai-provider.interface.js';
import { CapabilityPlugin } from '../capabilities/capability.interface.js';
import { InputEnvelope, CapabilityRunOptions } from '../common/types.js';

export class RuleBasedProvider implements AIProvider {
  public name = 'rule-based';

  async runCapability(
    plugin: CapabilityPlugin,
    envelope: InputEnvelope,
    options?: CapabilityRunOptions
  ): Promise<{ output: Record<string, any>; confidence: number }> {
    const res = plugin.fallback(envelope, options);
    return {
      output: res.output,
      confidence: res.confidence,
    };
  }

  async chat(
    envelope: InputEnvelope,
    userQuery: string,
    history: { role: string; text: string }[] = []
  ): Promise<{ reply: string; citedFacts?: string[]; confidence: number }> {
    const text = envelope.text || '';
    const name = envelope.source.name;

    return {
      reply: `[Fallback Response] Based on ${name} (${envelope.source.kind.toUpperCase()}): The document contains ${text.length} characters and ${envelope.meta.wordCount || 0} words. Question "${userQuery}" was received.`,
      confidence: 0.7,
    };
  }
}

export const ruleBasedProvider = new RuleBasedProvider();
