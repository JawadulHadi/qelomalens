import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[QelomaLens] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — sign in/sign up is disabled until they are configured. See .env.example.'
  );
}

// A placeholder project keeps createClient() from throwing when Supabase
// isn't configured yet (e.g. first local run before .env is filled in).
// isSupabaseConfigured must be checked before calling any auth method.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
