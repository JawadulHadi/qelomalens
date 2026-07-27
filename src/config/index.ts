import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  singleTenantMode: process.env.SINGLE_TENANT_MODE !== 'false',
  aiEnabled: process.env.AI_ENABLED !== 'false',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default-tenant-001',
  defaultTenantKey: process.env.DEFAULT_TENANT_KEY || 'sk_live_qelomalens_default',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  // Server-side Supabase persistence. Optional: when unset, the ingestion
  // service degrades gracefully to an in-memory store (same fallback
  // philosophy as the AI provider layer — never hard-fail on missing config).
  supabaseUrl,
  supabaseServiceRoleKey,
  supabasePersistenceEnabled: Boolean(supabaseUrl && supabaseServiceRoleKey),
};
