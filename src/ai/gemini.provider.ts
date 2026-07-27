import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './ai-provider.interface.js';
import { CapabilityPlugin } from '../capabilities/capability.interface.js';
import { InputEnvelope, CapabilityRunOptions } from '../common/types.js';
import { config } from '../config/index.js';

export class GeminiProvider implements AIProvider {
  public name = 'gemini-2.5-flash';
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({
        apiKey: config.geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.ai;
  }

  async runCapability(
    plugin: CapabilityPlugin,
    envelope: InputEnvelope,
    options?: CapabilityRunOptions
  ): Promise<{ output: Record<string, any>; confidence: number }> {
    const aiClient = this.getClient();
    const systemPrompt = plugin.promptTemplate(envelope, options);

    const parts: any[] = [];

    // Add inline text if available
    if (envelope.text) {
      parts.push({
        text: `--- DOCUMENT TEXT CONTENT ---\n${envelope.text}\n---------------------------`,
      });
    }

    // Add image/media if available and supported by Gemini inlineData
    if (envelope.media && envelope.media.length > 0) {
      for (const m of envelope.media) {
        if (m.base64Data) {
          const isSupportedMime =
            m.mimeType.startsWith('image/') ||
            m.mimeType === 'application/pdf' ||
            m.mimeType.startsWith('text/') ||
            m.mimeType.startsWith('audio/') ||
            m.mimeType.startsWith('video/');

          if (isSupportedMime) {
            parts.push({
              inlineData: {
                mimeType: m.mimeType,
                data: m.base64Data,
              },
            });
          }
        }
      }
    }

    parts.push({ text: `Execute capability request.` });

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: parts,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '{}';
    let parsed: Record<string, any> = {};

    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // Try extracting JSON block if wrapped in markdown code fence
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error(`Failed to parse valid JSON from model response: ${rawText.substring(0, 100)}`);
      }
    }

    return {
      output: parsed,
      confidence: 0.93,
    };
  }

  async chat(
    envelope: InputEnvelope,
    userQuery: string,
    history: { role: string; text: string }[] = []
  ): Promise<{ reply: string; citedFacts?: string[]; confidence: number }> {
    const aiClient = this.getClient();

    const systemInstruction = `You are QelomaLens AI Assistant. You are grounded ONLY in the provided document content — never invent facts that aren't in it.
Document Name: ${envelope.source.name}
Document Type: ${envelope.source.kind}
Context: ${envelope.meta.detectedContext || 'General'}
Document Text:
${envelope.text || 'No explicit text extracted; media file attached.'}

Write like a sharp, warm colleague who's genuinely glad to help — not a legal disclaimer. Be direct and human, skip corporate hedging and stiff phrasing, and it's fine to show a little enthusiasm when something in the document is genuinely impressive. Always cite specific figures or facts when available. If the document doesn't contain the answer, say so plainly and suggest what to check instead — don't guess.`;

    const contents: any[] = [];
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }

    const userParts: any[] = [{ text: userQuery }];

    if (envelope.media && envelope.media.length > 0) {
      for (const m of envelope.media) {
        if (m.base64Data) {
          const isSupportedMime =
            m.mimeType.startsWith('image/') ||
            m.mimeType === 'application/pdf' ||
            m.mimeType.startsWith('text/');
          if (isSupportedMime) {
            userParts.push({
              inlineData: {
                mimeType: m.mimeType,
                data: m.base64Data,
              },
            });
          }
        }
      }
    }

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const replyText = response.text || 'I analyzed the document, but could not produce a response.';

    return {
      reply: replyText,
      confidence: 0.94,
    };
  }
}

export const geminiProvider = new GeminiProvider();
