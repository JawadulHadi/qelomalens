import { DocumentInfo, ChatMessage } from '../types.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

export class QelomaLensClient {
  private baseUrl = '/v1';
  private apiKey = 'sk_live_qelomalens_default';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
    };

    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async uploadInput(fileOrText: File | string, filename?: string): Promise<{ inputId: string; envelope: any; suggestedCapabilities: string[] }> {
    const headers = await this.getHeaders();

    if (typeof fileOrText === 'string') {
      const res = await fetch(`${this.baseUrl}/inputs`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fileOrText,
          name: filename || 'pasted_input.txt',
        }),
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      return res.json();
    } else {
      const formData = new FormData();
      formData.append('file', fileOrText);

      const res = await fetch(`${this.baseUrl}/inputs`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      return res.json();
    }
  }

  async runCapabilities(inputId: string, capabilities: string[], options?: Record<string, any>): Promise<Record<string, any>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/inputs/${inputId}/run`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        capabilities,
        options,
      }),
    });

    if (!res.ok) {
      throw new Error(`Execution failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.results;
  }

  async sendChat(inputId: string, message: string, history: { role: string; text: string }[] = []): Promise<{ reply: string; confidence: number; source: 'gemini-2.5-flash' | 'rule-based'; citedFacts?: string[] }> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/inputs/${inputId}/chat`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (!res.ok) {
      throw new Error(`Chat failed: ${res.statusText}`);
    }

    return res.json();
  }

  async fetchCapabilities(): Promise<any[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/capabilities`, {
      headers,
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.capabilities || [];
  }
}

export const api = new QelomaLensClient();
