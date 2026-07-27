import { InputEnvelope, CapabilityRunOptions } from '../common/types.js';
import { CapabilityPlugin } from '../capabilities/capability.interface.js';

export interface AIProvider {
  name: string;
  runCapability(
    plugin: CapabilityPlugin,
    envelope: InputEnvelope,
    options?: CapabilityRunOptions
  ): Promise<{ output: Record<string, any>; confidence: number }>;

  chat(
    envelope: InputEnvelope,
    userQuery: string,
    history?: { role: string; text: string }[]
  ): Promise<{ reply: string; citedFacts?: string[]; confidence: number }>;
}
