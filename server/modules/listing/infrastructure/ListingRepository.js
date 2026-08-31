/**
 * LOUMOO — Listing Repository
 * ---------------------------------------------------------------------------
 * The only module that reads or writes `iam.listings` and its media rows.
 *
 * The route layer used to "resolve" a listing by constructing one in memory
 * with a hardcoded title and a hardcoded seller id, which meant every
 * ownership check compared a real user against a fictional owner and every
 * edit silently succeeded against nothing. Listings are loaded from the
 * database here, or they are 404.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const { InfrastructureError } = require('../../../shared/errors/AppError');

const LISTING_COLUMNS = [
  'id', 'store_id', 'seller_id', 'listing_type', 'category_id', 'title', 'slug',
  'short_description', 'description', 'sku', 'barcode', 'brand', 'model',
  'condition', 'status', 'rejection_reason', 'visibility', 'tags', 'currency',
  'base_price_minor', 'sale_price_minor', 'compare_at_price_minor',
  'has_variants', 'fulfillment_model', 'view_count', 'save_count', 'order_count',
  'rating', 'rating_count', 'metadata', 'creation_fingerprint',
  'published_at', 'created_at', 'updated_at', 'deleted_at'
].join(', ');

const MEDIA_COLUMNS = [
  'id', 'listing_id', 'media_type', 'url', 'thumbnail_url', 'display_order',
  'is_cover', 'width', 'height', 'file_size_bytes', 'mime_type', 'alt_text',
  'storage_bucket', 'storage_path', 'upload_session_id', 'checksum_sha256',
  'uploaded_by'
].join(', ');

class ListingRepository {
  static get db() {
    return SupabaseDatabase.getAdmin();
  }

  static async findById(listingId, { includeDeleted = false } = {}) {
    if (!listingId) return null;

    let query = this.db.from('listings').select(LISTING_COLUMNS).eq('id', listingId);
    if (!includeDeleted) query = query.is('deleted_at', null);

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new InfrastructureError('Supabase', `listing lookup failed: ${error.message}`, error);
    }
    return data || null;
  }

  static async findBySlug(slug) {
    const { data, error } = await this.db
      .from('listings')
      .select(LISTING_COLUMNS)
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new InfrastructureError('Supabase', `listing lookup failed: ${error.message}`, error);
    }
    return data || null;
  }

  static async findByFingerprint(storeId, fingerprint) {
    if (!fingerprint) return null;
    const { data, error } = await this.db
      .from('listings')
      .select(LISTING_COLUMNS)
      .eq('store_id', storeId)
      .eq('creation_fingerprint', fingerprint)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new InfrastructureError('Supabase', `listing fingerprint lookup failed: ${error.message}`, error);
    }
    return data || null;
  }

  static async insert(row) {
    const { data, error } = await this.db
      .from('listings')
      .insert(row)
      .select(LISTING_COLUMNS)
      .single();

    if (error) {
      const e = new InfrastructureError('Supabase', `listing insert failed: ${error.message}`, error);
      e.pgCode = error.code;
      throw e;
    }
    return data;
  }

  static async update(listingId, patch) {
    const { data, error } = await this.db
      .from('listings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', listingId)
      .is('deleted_at', null)
      .select(LISTING_COLUMNS)
      .single();

    if (error) {
      throw new InfrastructureError('Supabase', `listing update failed: ${error.message}`, error);
    }
    return data;
  }

  static async softDelete(listingId) {
    return this.update(listingId, { deleted_at: new Date().toISOString(), status: 'ARCHIVED' });
  }

  static async hardDelete(listingId) {
    const { error } = await this.db.from('listings').delete().eq('id', listingId);
    if (error) {
      throw new InfrastructureError('Supabase', `listing delete failed: ${error.message}`, error);
    }
  }

  static async listForStore(storeId, { status, limit = 20, offset = 0 } = {}) {
    let query = this.db
      .from('listings')
      .select(LISTING_COLUMNS, { count: 'exact' })
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) {
      throw new InfrastructureError('Supabase', `seller listing query failed: ${error.message}`, error);
    }
    return { listings: data || [], total: count || 0, limit, offset };
  }

  /* --------------------------------------------------------------- media */

  static async listMedia(listingId) {
    const { data, error } = await this.db
      .from('listing_media')
      .select(MEDIA_COLUMNS)
      .eq('listing_id', listingId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new InfrastructureError('Supabase', `listing media query failed: ${error.message}`, error);
    }
    return data || [];
  }

  static async insertMedia(rows) {
    if (!rows.length) return [];
    const { data, error } = await this.db
      .from('listing_media')
      .insert(rows)
      .select(MEDIA_COLUMNS);

    if (error) {
      throw new InfrastructureError('Supabase', `listing media insert failed: ${error.message}`, error);
    }
    return data || [];
  }

  static async deleteMedia(listingId, mediaId) {
    const { data, error } = await this.db
      .from('listing_media')
      .delete()
      .eq('id', mediaId)
      .eq('listing_id', listingId)  // scoping by listing prevents cross-listing deletes
      .select(MEDIA_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InfrastructureError('Supabase', `listing media delete failed: ${error.message}`, error);
    }
    return data || null;
  }

  static async setMediaOrder(listingId, orderedMediaIds) {
    for (let i = 0; i < orderedMediaIds.length; i++) {
      const { error } = await this.db
        .from('listing_media')
        .update({ display_order: i, is_cover: i === 0 })
        .eq('id', orderedMediaIds[i])
        .eq('listing_id', listingId);
      if (error) {
        throw new InfrastructureError('Supabase', `media reorder failed: ${error.message}`, error);
      }
    }
    return this.listMedia(listingId);
  }

  /* ----------------------------------------------------------- attributes */

  static async replaceAttributes(listingId, categoryId, attributes) {
    const { error: delError } = await this.db
      .from('listing_attribute_values')
      .delete()
      .eq('listing_id', listingId);

    if (delError) {
      throw new InfrastructureError('Supabase', `attribute reset failed: ${delError.message}`, delError);
    }

    const rows = Object.entries(attributes || {}).map(([slug, value]) => ({
      listing_id: listingId,
      attribute_id: `${categoryId}__${slug}`,
      attribute_slug: slug,
      value_text: typeof value === 'string' ? value : null,
      value_number: typeof value === 'number' ? value : (isFiniteNumeric(value) ? Number(value) : null),
      value_boolean: typeof value === 'boolean' ? value : null,
      value_json: Array.isArray(value) || (value && typeof value === 'object') ? value : null
    }));

    if (rows.length === 0) return [];

    const { data, error } = await this.db
      .from('listing_attribute_values')
      .insert(rows)
      .select('attribute_slug, value_text, value_number, value_boolean, value_json');

    if (error) {
      throw new InfrastructureError('Supabase', `attribute write failed: ${error.message}`, error);
    }
    return data || [];
  }

  static async listAttributes(listingId) {
    const { data, error } = await this.db
      .from('listing_attribute_values')
      .select('attribute_slug, value_text, value_number, value_boolean, value_json')
      .eq('listing_id', listingId);

    if (error) {
      throw new InfrastructureError('Supabase', `attribute read failed: ${error.message}`, error);
    }

    return (data || []).reduce((acc, row) => {
      acc[row.attribute_slug] = row.value_json
        ?? row.value_boolean
        ?? row.value_number
        ?? row.value_text;
      return acc;
    }, {});
  }
}

function isFiniteNumeric(v) {
  return typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v));
}

module.exports = ListingRepository;
module.exports.LISTING_COLUMNS = LISTING_COLUMNS;
module.exports.MEDIA_COLUMNS = MEDIA_COLUMNS;
