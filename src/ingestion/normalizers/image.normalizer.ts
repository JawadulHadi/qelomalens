import { InputEnvelope, SourceInfo } from '../../common/types.js';

export async function normalizeImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  tenantId: string,
  inputId: string
): Promise<InputEnvelope> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const kind = ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpg';
  const base64 = buffer.toString('base64');
  const sizeBytes = buffer.length;

  const source: SourceInfo = {
    kind: kind as any,
    name: filename,
    sizeBytes,
  };

  return {
    inputId,
    tenantId,
    source,
    text: `[Visual Document Image: ${filename} (${kind.toUpperCase()} image format). Ingested for visual understanding, text OCR, and capability extraction.]`,
    media: [
      {
        mimeType: mimeType || (kind === 'png' ? 'image/png' : 'image/jpeg'),
        ref: `storage://${tenantId}/${inputId}/original.${kind}`,
        base64Data: base64,
      },
    ],
    meta: {
      pageCount: 1,
      language: 'en',
    },
    extraction: {
      method: 'gemini-native',
      confidence: 0.98,
    },
    createdAt: new Date().toISOString(),
  };
}

