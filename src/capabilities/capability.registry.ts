import { CapabilityPlugin } from './capability.interface.js';
import { SummarizeCapability } from './summarize/summarize.capability.js';
import { ExtractFactsCapability } from './extract-facts/extract-facts.capability.js';
import { VerdictCapability } from './verdict/verdict.capability.js';
import { CompareCapability } from './compare/compare.capability.js';
import { BreakdownCapability } from './breakdown/breakdown.capability.js';
import { NextActionsCapability } from './next-actions/next-actions.capability.js';
import { GenerateCapability } from './generate/generate.capability.js';

export class CapabilityRegistry {
  private plugins = new Map<string, CapabilityPlugin>();

  constructor() {
    this.register(SummarizeCapability);
    this.register(ExtractFactsCapability);
    this.register(VerdictCapability);
    this.register(CompareCapability);
    this.register(BreakdownCapability);
    this.register(NextActionsCapability);
    this.register(GenerateCapability);
  }

  register(plugin: CapabilityPlugin) {
    this.plugins.set(plugin.id.toUpperCase(), plugin);
  }

  get(id: string): CapabilityPlugin | undefined {
    return this.plugins.get(id.toUpperCase());
  }

  list(): CapabilityPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const capabilityRegistry = new CapabilityRegistry();
