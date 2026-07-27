import { InputEnvelope, CapabilityRunOptions, CapabilityRunResult } from '../common/types.js';
import { capabilityRegistry } from '../capabilities/capability.registry.js';
import { geminiProvider } from '../ai/gemini.provider.js';
import { ruleBasedProvider } from '../ai/rule-based.provider.js';
import { config } from '../config/index.js';

export class OrchestratorService {
  async runCapability(
    capabilityId: string,
    envelope: InputEnvelope,
    options?: CapabilityRunOptions
  ): Promise<CapabilityRunResult> {
    const startTime = Date.now();
    const plugin = capabilityRegistry.get(capabilityId);

    if (!plugin) {
      throw new Error(`Capability '${capabilityId}' not found in registry.`);
    }

    // Step 1: Check if AI is enabled and Gemini API Key is configured
    const aiAvailable = config.aiEnabled && Boolean(process.env.GEMINI_API_KEY || config.geminiApiKey);

    if (!aiAvailable) {
      const fallbackRes = plugin.fallback(envelope, options);
      return {
        ...fallbackRes,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Step 2 & 3: Attempt Gemini execution with single retry on schema/model error
    try {
      const res = await geminiProvider.runCapability(plugin, envelope, options);

      // Step 4: Confidence gate check
      if (res.confidence < plugin.confidenceGate) {
        const fallbackRes = plugin.fallback(envelope, options);
        return {
          ...fallbackRes,
          executionTimeMs: Date.now() - startTime,
        };
      }

      return {
        output: res.output,
        confidence: res.confidence,
        source: 'gemini-2.5-flash',
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.warn(`[Orchestrator] AI execution failed for ${capabilityId}, falling back to rule-based engine:`, err.message);
      
      // Step 5: Fallback path - service degrades gracefully, never 500s!
      const fallbackRes = plugin.fallback(envelope, options);
      return {
        ...fallbackRes,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async runMultiple(
    capabilityIds: string[],
    envelope: InputEnvelope,
    optionsMap: Record<string, CapabilityRunOptions> = {}
  ): Promise<Record<string, CapabilityRunResult>> {
    const results: Record<string, CapabilityRunResult> = {};

    for (const id of capabilityIds) {
      try {
        const opts = optionsMap[id] || optionsMap;
        results[id] = await this.runCapability(id, envelope, opts);
      } catch (err: any) {
        // Degrade per capability if unknown or broken
        results[id] = {
          output: { error: err.message },
          confidence: 0,
          source: 'rule-based',
        };
      }
    }

    return results;
  }
}

export const orchestratorService = new OrchestratorService();
