import { createRequire } from 'module';
import { InputEnvelope, SourceInfo } from '../../common/types.js';

const customRequire = typeof require !== 'undefined'
  ? require
  : createRequire(`file://${process.cwd()}/index.js`);

const pdfParse = customRequire('pdf-parse');

export async function normalizePdf(
  buffer: Buffer,
  filename: string,
  tenantId: string,
  inputId: string
): Promise<InputEnvelope> {
  let extractedText = '';
  let pageCount = 1;

  try {
    const data = await pdfParse(buffer);
    extractedText = data.text || '';
    pageCount = data.numpages || 1;
  } catch (err) {
    // If pdf-parse fails on binary/corrupt PDF, extract printable ASCII text strings
    const str = buffer.toString('binary');
    const matches = str.match(/[\x20-\x7E\s]{4,}/g);
    extractedText = matches ? matches.join(' ') : 'PDF binary content uploaded';
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
