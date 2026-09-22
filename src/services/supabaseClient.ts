/**
 * Client-Side Supabase Client (Ask UniBot Phase 3.1)
 *
 * Uses ONLY public client credentials:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 *
 * The service role key is NEVER referenced or imported here.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

function getEnv(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
  } catch {}
  return undefined;
}

export function getSupabaseUrl(): string | undefined {
  return getEnv('VITE_SUPABASE_URL');
}

export function isSupabaseConfigured(): boolean {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project'));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    const url = getEnv('VITE_SUPABASE_URL') as string;
    const key = getEnv('VITE_SUPABASE_ANON_KEY') as string;
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}
