/**
 * LOUMOO — Store Repository
 * ---------------------------------------------------------------------------
 * The only module that reads store ownership and membership.
 *
 * The previous store guard fabricated a store owned by the caller whenever the
 * requested id merely started with `store_`. That made every user the owner of
 * every store they cared to name. There is no fabrication here: a store either
 * exists in `iam.stores` or the request is a 404.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const { InfrastructureError } = require('../../../shared/errors/AppError');

const STORE_COLUMNS = [
  'id', 'owner_id', 'name', 'slug', 'description', 'category_id', 'logo_url',
  'cover_url', 'phone_number', 'email', 'website_url', 'status', 'visibility',
  'is_verified', 'verification_tier', 'rating', 'rating_count', 'follower_count',
  'product_count', 'onboarding_step', 'onboarding_completed', 'metadata',
  'created_at', 'updated_at', 'deleted_at'
].join(', ');

class StoreRepository {
  static get db() {
    return SupabaseDatabase.getAdmin();
  }

  /** Resolves by primary key or slug — never by anything client-controlled beyond those. */
  static async findByIdOrSlug(identifier) {
    if (!identifier) return null;

    const byId = await this.db
      .from('stores')
      .select(STORE_COLUMNS)
      .eq('id', identifier)
      .is('deleted_at', null)
      .maybeSingle();

    if (byId.error) {
      throw new InfrastructureError('Supabase', `store lookup failed: ${byId.error.message}`, byId.error);
    }
    if (byId.data) return byId.data;

    const bySlug = await this.db
      .from('stores')
      .select(STORE_COLUMNS)
      .eq('slug', identifier)
      .is('deleted_at', null)
      .maybeSingle();

    if (bySlug.error) {
      throw new InfrastructureError('Supabase', `store lookup failed: ${bySlug.error.message}`, bySlug.error);
    }
    return bySlug.data || null;
  }

  static async findOwnedBy(userId) {
    const { data, error } = await this.db
      .from('stores')
      .select(STORE_COLUMNS)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InfrastructureError('Supabase', `owned store lookup failed: ${error.message}`, error);
    }
    return data || [];
  }

  /**
   * Returns the caller's membership record for a store, or null.
   * Ownership is checked against `stores.owner_id` first so an owner is never
   * locked out by a missing `store_members` row.
   */
  static async resolveMembership(store, userId) {
    if (!store || !userId) return null;

    if (store.owner_id === userId) {
      return { role: 'owner', permissions: ['*'], source: 'owner' };
    }

    const { data, error } = await this.db
      .from('store_members')
      .select('role, permissions')
      .eq('store_id', store.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new InfrastructureError('Supabase', `store membership lookup failed: ${error.message}`, error);
    }
    if (!data) return null;

    return {
      role: data.role,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      source: 'member'
    };
  }

  static async update(storeId, patch) {
    const { data, error } = await this.db
      .from('stores')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select(STORE_COLUMNS)
      .single();

    if (error) {
      throw new InfrastructureError('Supabase', `store update failed: ${error.message}`, error);
    }
    return data;
  }
}

module.exports = StoreRepository;
module.exports.STORE_COLUMNS = STORE_COLUMNS;
