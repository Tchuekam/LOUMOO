/**
 * Supabase Client Initialization
 * Provides Admin (Service Role) and Public (Anon) Supabase clients
 */

const config = require('../config');

let supabaseAdmin = null;
let supabaseClient = null;

try {
  const { createClient } = require('@supabase/supabase-js');

  if (config.supabase.url && config.supabase.serviceRoleKey) {
    supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  if (config.supabase.url && config.supabase.anonKey) {
    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
  }
} catch (err) {
  // If @supabase/supabase-js is not yet installed in local node_modules
  console.warn('[Supabase] @supabase/supabase-js library not loaded yet. Fallback to direct HTTP fetch if needed.');
}

/**
 * Direct REST helper for Supabase PostgREST queries
 */
async function supabaseFetch(endpoint, options = {}, useServiceRole = true) {
  if (!config.supabase.url) {
    throw new Error('SUPABASE_URL is not configured');
  }

  const key = useServiceRole ? config.supabase.serviceRoleKey : config.supabase.anonKey;
  const url = `${config.supabase.url}/rest/v1/${endpoint.replace(/^\//, '')}`;

  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

module.exports = {
  supabaseAdmin,
  supabaseClient,
  supabaseFetch
};
