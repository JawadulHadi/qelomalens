import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let client: SupabaseClient | null = null;

/**
 * Lazily-created service-role Supabase client for server-side use only.
 * Never import this from browser-bundled code — the service role key
 * bypasses Row Level Security.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!config.supabasePersistenceEnabled) {
    return null;
  }

  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

/**
 * Resolves the authenticated Supabase user id from a bearer access token,
 * or undefined if the token is missing/invalid. Used to scope stored
 * input envelopes to their owner without ever trusting a client-supplied id.
 */
export async function resolveUserIdFromBearerToken(authorizationHeader?: string): Promise<string | undefined> {
  const supabase = getSupabaseServerClient();
  if (!supabase || !authorizationHeader) {
    return undefined;
  }

  const token = authorizationHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return undefined;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return undefined;
  }

  return data.user.id;
}
