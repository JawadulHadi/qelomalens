import { createRequire } from 'module';
import { InputEnvelope, SourceInfo } from '../../common/types.js';

const customRequire = typeof require !== 'undefined'
  ? require
  : createRequire(`file://${process.cwd()}/index.js`);

const mammoth = customRequire('mammoth');

export async function normalizeDocx(
  buffer: Buffer,
  filename: string,
  tenantId: string,
  inputId: string
): Promise<InputEnvelope> {
  let extractedText = '';

  try {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value || '';
  } catch (err) {
    extractedText = 'Failed to extract text from DOCX file';
  }

  const base64 = buffer.toString('base64');
  const sizeBytes = buffer.length;

  const source: SourceInfo = {
    kind: 'docx',
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
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ref: `storage://${tenantId}/${inputId}/original.docx`,
        base64Data: base64,
      },
    ],
    meta: {
      pageCount: Math.ceil(extractedText.length / 2000) || 1,
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
