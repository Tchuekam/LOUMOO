/**
 * Supabase Infrastructure Client
 * Exposes Service Role (Admin) and Anon (Public) database query interfaces
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');
const { InfrastructureError } = require('../../shared/errors/AppError');

let adminClient = null;
let publicClient = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  try {
    adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    logger.info('[Supabase] Initialized Supabase Admin Service Role client.');
  } catch (err) {
    logger.error('[Supabase] Failed initializing Admin client', err);
  }
}

if (config.supabase.url && config.supabase.anonKey) {
  try {
    publicClient = createClient(config.supabase.url, config.supabase.anonKey);
    logger.info('[Supabase] Initialized Supabase Public client.');
  } catch (err) {
    logger.error('[Supabase] Failed initializing Public client', err);
  }
}

class SupabaseDatabase {
  static getAdmin() {
    if (!adminClient) {
      throw new InfrastructureError('Supabase', 'Admin client is not initialized or missing service role key');
    }
    return adminClient;
  }

  static getPublic() {
    if (!publicClient) {
      throw new InfrastructureError('Supabase', 'Public client is not initialized');
    }
    return publicClient;
  }

  /**
   * Healthcheck helper
   */
  static async checkHealth() {
    try {
      const startTime = Date.now();
      const res = await fetch(`${config.supabase.url}/auth/v1/health`, {
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`
        },
        signal: AbortSignal.timeout(5000)
      });
      return {
        healthy: res.ok,
        status: res.status,
        latencyMs: Date.now() - startTime
      };
    } catch (e) {
      return {
        healthy: false,
        error: e.message
      };
    }
  }
}

module.exports = {
  adminClient,
  publicClient,
  SupabaseDatabase,
  getAdminClient: () => adminClient,
  getPublicClient: () => publicClient,
  SupabaseClient: {
    getAdminClient: () => adminClient,
    getPublicClient: () => publicClient,
    checkHealth: SupabaseDatabase.checkHealth
  }
};
