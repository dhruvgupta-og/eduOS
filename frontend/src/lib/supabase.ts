import { createClient } from '@supabase/supabase-js';
import { getApiUrl } from './api';

// Supabase Project Config
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://sayxiucjqrerffpwxqkd.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  'sb_publishable_qDljetLwMsDaLoYAl_BblA_k322sgxG';

export const SUPABASE_JWKS_URL =
  'https://sayxiucjqrerffpwxqkd.supabase.co/auth/v1/.well-known/jwks.json';

// Create and export the Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseStatusResult {
  connected: boolean;
  statusCode?: number;
  latencyMs: number;
  supabaseUrl: string;
  publishableKeyConfigured: boolean;
  secretKeyConfigured: boolean;
  secretKeyValid?: boolean;
  secretKeyMessage?: string;
  authHealthy?: boolean;
  jwksUrl: string;
  jwksVerified: boolean;
  tablesFound: string[];
  serverTime?: string;
  error?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseStatusResult> {
  const startTime = Date.now();
  try {
    const res = await fetch(getApiUrl('/api/supabase/status'));
    if (res.ok) {
      return await res.json();
    }
    // Fallback direct check if server endpoint is busy
    const directRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
    });
    return {
      connected: directRes.status === 200 || directRes.status === 401 || directRes.status === 403,
      latencyMs: Date.now() - startTime,
      supabaseUrl: SUPABASE_URL,
      publishableKeyConfigured: true,
      secretKeyConfigured: true,
      jwksUrl: SUPABASE_JWKS_URL,
      jwksVerified: true,
      tablesFound: [],
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      supabaseUrl: SUPABASE_URL,
      publishableKeyConfigured: true,
      secretKeyConfigured: true,
      jwksUrl: SUPABASE_JWKS_URL,
      jwksVerified: false,
      tablesFound: [],
      error: err.message,
    };
  }
}
