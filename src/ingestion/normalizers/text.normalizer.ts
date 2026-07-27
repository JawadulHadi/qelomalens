import { InputEnvelope, SourceInfo } from '../../common/types.js';

export async function normalizeText(
  rawText: string,
  filename: string = 'pasted_input.txt',
  tenantId: string,
  inputId: string
): Promise<InputEnvelope> {
  const text = rawText || '';
  const sizeBytes = Buffer.byteLength(text, 'utf-8');

  const source: SourceInfo = {
    kind: 'txt',
    name: filename,
    sizeBytes,
  };

  return {
    inputId,
    tenantId,
    source,
    text: text.trim(),
    media: [],
    meta: {
      pageCount: Math.ceil(text.length / 3000) || 1,
      language: 'en',
      wordCount: text.split(/\s+/).filter(Boolean).length,
    },
    extraction: {
      method: 'rule-based',
      confidence: 1.0,
    },
    createdAt: new Date().toISOString(),
  };
}
