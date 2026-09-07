import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sayxiucjqrerffpwxqkd.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

let supabaseAdmin: any = null;

export function getSupabaseAdmin(): any {
  if (!supabaseAdmin) {
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      throw new Error('Supabase admin configurations (SUPABASE_URL, SUPABASE_SECRET_KEY) are missing.');
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdmin;
}
