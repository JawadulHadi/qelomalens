import { InputEnvelope } from '../common/types.js';
import { normalizePdf } from './normalizers/pdf.normalizer.js';
import { normalizeDocx } from './normalizers/docx.normalizer.js';
import { normalizeImage } from './normalizers/image.normalizer.js';
import { normalizeText } from './normalizers/text.normalizer.js';
import { getSupabaseServerClient } from '../lib/supabase.server.js';

// In-memory fallback store, used when Supabase persistence isn't configured
// (local dev with no Supabase project, or SUPABASE_* env vars unset).
// NOTE: this does not survive across serverless function invocations —
// configure Supabase for any deployment with more than one function instance.
const envelopeStore = new Map<string, InputEnvelope>();

export class IngestionService {
  async processFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    tenantId: string,
    userId?: string
  ): Promise<InputEnvelope> {
    const inputId = `inp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let envelope: InputEnvelope;

    const lowerName = filename.toLowerCase();
    const lowerMime = mimeType.toLowerCase();

    if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
      envelope = await normalizePdf(fileBuffer, filename, tenantId, inputId);
    } else if (
      lowerMime.includes('wordprocessingml') ||
      lowerMime.includes('msword') ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.doc')
    ) {
      envelope = await normalizeDocx(fileBuffer, filename, tenantId, inputId);
    } else if (
      lowerMime.includes('image') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp')
    ) {
      envelope = await normalizeImage(fileBuffer, filename, mimeType, tenantId, inputId);
    } else {
      // Default to plain text
      const text = fileBuffer.toString('utf-8');
      envelope = await normalizeText(text, filename, tenantId, inputId);
    }

    envelope.meta.detectedContext = this.detectContext(envelope.text || '', filename);
    await this.saveEnvelope(envelope, userId);
    return envelope;
  }

  async processRawText(
    text: string,
    name: string = 'text_input.txt',
    tenantId: string,
    userId?: string
  ): Promise<InputEnvelope> {
    const inputId = `inp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const envelope = await normalizeText(text, name, tenantId, inputId);
    envelope.meta.detectedContext = this.detectContext(text, name);
    await this.saveEnvelope(envelope, userId);
    return envelope;
  }

  private async saveEnvelope(envelope: InputEnvelope, userId?: string): Promise<void> {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      envelopeStore.set(envelope.inputId, envelope);
      return;
    }

    const { error } = await supabase.from('input_envelopes').insert({
      id: envelope.inputId,
      tenant_id: envelope.tenantId,
      user_id: userId || null,
      payload: envelope,
    });

    if (error) {
      console.warn('[Ingestion] Supabase persistence failed, falling back to in-memory store:', error.message);
      envelopeStore.set(envelope.inputId, envelope);
    }
  }

  /**
   * Retrieves a previously ingested envelope. When Supabase persistence is
   * configured and the row has an owning user, only that user may read it
   * back — anonymous/single-tenant rows (user_id null) remain open, matching
   * this service's existing demo/no-auth-required default.
   */
  async getEnvelope(inputId: string, userId?: string): Promise<InputEnvelope | undefined> {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return envelopeStore.get(inputId);
    }

    const { data, error } = await supabase
      .from('input_envelopes')
      .select('payload, user_id')
      .eq('id', inputId)
      .maybeSingle();

    if (error) {
      console.warn('[Ingestion] Supabase lookup failed, checking in-memory fallback store:', error.message);
      return envelopeStore.get(inputId);
    }

    if (!data) {
      // Not in Supabase — it may have been written to the in-memory
      // fallback store instead (see saveEnvelope), e.g. because the
      // input_envelopes table doesn't exist yet.
      return envelopeStore.get(inputId);
    }

    const row = data as { payload: InputEnvelope; user_id: string | null };
    if (row.user_id && row.user_id !== userId) {
      return undefined;
    }

    return row.payload;
  }

  detectContext(text: string, filename: string): string {
    const lower = (text + ' ' + filename).toLowerCase();
    if (lower.includes('salary') || lower.includes('payslip') || lower.includes('payroll') || lower.includes('tax') || lower.includes('deduction')) {
      return 'financial-statement';
    }
    if (lower.includes('agreement') || lower.includes('contract') || lower.includes('clause') || lower.includes('terms')) {
      return 'legal-contract';
    }
    if (lower.includes('patient') || lower.includes('medical') || lower.includes('prescription') || lower.includes('doctor')) {
      return 'medical-record';
    }
    if (lower.includes('invoice') || lower.includes('receipt') || lower.includes('total') || lower.includes('amount')) {
      return 'invoice-receipt';
    }
    return 'general-document';
  }

  suggestCapabilities(envelope: InputEnvelope): string[] {
    const ctx = envelope.meta.detectedContext || 'general-document';
    if (ctx === 'financial-statement' || ctx === 'invoice-receipt') {
      return ['SUMMARIZE', 'EXTRACT_FACTS', 'VERDICT', 'BREAKDOWN', 'NEXT_ACTIONS'];
    }
    if (ctx === 'legal-contract') {
      return ['SUMMARIZE', 'EXTRACT_FACTS', 'VERDICT', 'COMPARE', 'NEXT_ACTIONS'];
    }
    return ['SUMMARIZE', 'EXTRACT_FACTS', 'BREAKDOWN', 'NEXT_ACTIONS', 'GENERATE'];
  }
}

export const ingestionService = new IngestionService();
