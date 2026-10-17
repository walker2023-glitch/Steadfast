// Steadfast — Supabase client setup (FOUNDATION ONLY).
//
// This module is intentionally NOT imported by the running app yet. localStorage
// (via the Store layer in app.js) remains the only active provider. A later
// milestone adds a CloudStore that uses getSupabaseClient() behind auth.
//
// It reads configuration from environment-style variables:
//   - Browser (no build step): window.STEADFAST_ENV (see config.example.js)
//   - Node / build / tests:    process.env
//
// Only the public anon key is used here; it is protected by Row Level Security.
// The service_role key must never be used in client code.

import { createClient } from '@supabase/supabase-js';

// Resolve config from whichever environment we are running in.
export function readSupabaseEnv() {
  const fromWindow =
    (typeof window !== 'undefined' && window.STEADFAST_ENV) || {};
  const fromProcess =
    (typeof process !== 'undefined' && process && process.env) || {};

  return {
    url: fromWindow.SUPABASE_URL || fromProcess.SUPABASE_URL || '',
    anonKey: fromWindow.SUPABASE_ANON_KEY || fromProcess.SUPABASE_ANON_KEY || '',
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = readSupabaseEnv();
  return Boolean(url && anonKey);
}

let cachedClient = null;

// Lazily create (and memoize) the Supabase client. Returns null when config is
// absent, so callers can cleanly fall back to local-only mode.
export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = readSupabaseEnv();
  if (!url || !anonKey) {
    console.warn(
      'Steadfast: Supabase is not configured; staying in local-only mode. ' +
        'See config.example.js / .env.example.'
    );
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cachedClient;
}
