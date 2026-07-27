import '../../lib/pdf-node-polyfills.js';
import { PDFParse } from 'pdf-parse';
import { InputEnvelope, SourceInfo } from '../../common/types.js';

export async function normalizePdf(
  buffer: Buffer,
  filename: string,
  tenantId: string,
  inputId: string
): Promise<InputEnvelope> {
  let extractedText = '';
  let pageCount = 1;

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    extractedText = result.text || '';
    pageCount = result.total || 1;
  } catch (err: any) {
    console.warn('[normalizePdf] pdf-parse failed, falling back to raw ASCII scraping:', err?.message || err);
    // If pdf-parse fails on binary/corrupt PDF, extract printable ASCII text strings
    const str = buffer.toString('binary');
    const matches = str.match(/[\x20-\x7E\s]{4,}/g);
    extractedText = matches ? matches.join(' ') : 'PDF binary content uploaded';
  } finally {
    await parser.destroy();
  }

  const base64 = buffer.toString('base64');
  const sizeBytes = buffer.length;

  const source: SourceInfo = {
    kind: 'pdf',
    name: filename,
    sizeBytes,
  };

  return {
    inputId,
    tenantId,
    source,
    text: extractedText.trim(),
    media: [
      {
        mimeType: 'application/pdf',
        ref: `storage://${tenantId}/${inputId}/original.pdf`,
        base64Data: base64,
      },
    ],
    meta: {
      pageCount,
      language: 'en',
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
    },
    extraction: {
      method: 'rule-based',
      confidence: 0.95,
    },
    createdAt: new Date().toISOString(),
  };
}
