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

  /* ------------------------------------------------------------ inventory */

  /**
   * Upserts the listing-level (variant_id IS NULL) stock record.
   *
   * Supabase's `upsert` needs a real unique constraint to resolve the conflict
   * target, and `UNIQUE(listing_id, variant_id)` does not match rows where
   * variant_id IS NULL in PostgreSQL. So the listing-level row is read first
   * and updated by primary key.
   */
  static async upsertInventory(listingId, patch = {}) {
    const row = {
      on_hand: Math.max(0, Number(patch.onHand ?? 0)),
      low_stock_threshold: Math.max(0, Number(patch.lowStockThreshold ?? 3)),
      allow_backorder: Boolean(patch.allowBackorder),
      track_inventory: patch.trackInventory !== false,
      updated_at: new Date().toISOString()
    };
    // `reserved` is order-held stock, not a seller-editable field, so it is
    // only written when a caller explicitly moves it.
    if (patch.reserved !== undefined) row.reserved = Math.max(0, Number(patch.reserved));

    const existing = await this.getInventory(listingId);

    if (existing) {
      const { data, error } = await this.db
        .from('listing_inventory')
        .update(row)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw new InfrastructureError('Supabase', `inventory update failed: ${error.message}`, error);
      return data;
    }

    const { data, error } = await this.db
      .from('listing_inventory')
      .insert({ ...row, listing_id: listingId, variant_id: null })
      .select('*')
      .single();
    if (error) throw new InfrastructureError('Supabase', `inventory write failed: ${error.message}`, error);
    return data;
  }

  static async getInventory(listingId) {
    const { data, error } = await this.db
      .from('listing_inventory')
      .select('*')
      .eq('listing_id', listingId)
      .is('variant_id', null)
      .maybeSingle();
    if (error) throw new InfrastructureError('Supabase', `inventory read failed: ${error.message}`, error);
    return data || null;
  }

  /* --------------------------------------------------------- availability */

  static async upsertAvailability(listingId, patch = {}) {
    const row = {
      availability_strategy: patch.strategy || 'STOCK',
      timezone: patch.timezone || 'Africa/Douala',
      lead_time_hours: Math.max(0, Number(patch.leadTimeHours ?? 2)),
      cutoff_time_hours: Math.max(0, Number(patch.cutoffTimeHours ?? 1)),
      min_duration_units: Math.max(1, Number(patch.minDurationUnits ?? 1)),
      max_duration_units: Math.max(1, Number(patch.maxDurationUnits ?? 30)),
      capacity_per_slot: Math.max(1, Number(patch.capacityPerSlot ?? 1)),
      weekly_schedule: patch.weeklySchedule || {},
      blackout_dates: Array.isArray(patch.blackoutDates) ? patch.blackoutDates : [],
      updated_at: new Date().toISOString()
    };

    const existing = await this.getAvailability(listingId);

    if (existing) {
      const { data, error } = await this.db
        .from('listing_availability')
        .update(row)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw new InfrastructureError('Supabase', `availability update failed: ${error.message}`, error);
      return data;
    }

    const { data, error } = await this.db
      .from('listing_availability')
      .insert({ ...row, listing_id: listingId })
      .select('*')
      .single();
    if (error) throw new InfrastructureError('Supabase', `availability write failed: ${error.message}`, error);
    return data;
  }

  static async getAvailability(listingId) {
    const { data, error } = await this.db
      .from('listing_availability')
      .select('*')
      .eq('listing_id', listingId)
      .maybeSingle();
    if (error) throw new InfrastructureError('Supabase', `availability read failed: ${error.message}`, error);
    return data || null;
  }

  /* -------------------------------------------------------------- variants */

  /**
   * Replaces the whole variant matrix in one shot.
   *
   * Regenerating is the only sane semantic for an option matrix: change
   * "storage" from two values to three and the old rows describe a matrix that
   * no longer exists. Stock already recorded against a surviving combination is
   * carried over so a reorder of the options does not silently zero the shelf.
   */
  static async replaceVariants(listingId, variants = []) {
    const previous = await this.listVariants(listingId);
    const carriedStock = new Map(
      previous.map(v => [JSON.stringify(v.options_summary || {}), v.stock_quantity])
    );

    const { error: delError } = await this.db
      .from('listing_variants')
      .delete()
      .eq('listing_id', listingId);
    if (delError) {
      throw new InfrastructureError('Supabase', `variant reset failed: ${delError.message}`, delError);
    }

    if (!variants.length) return [];

    const rows = variants.map(v => {
      const key = JSON.stringify(v.optionsSummary || {});
      return {
        listing_id: listingId,
        sku: v.sku || null,
        title: v.title,
        options_summary: v.optionsSummary || {},
        price_minor: Math.max(0, Number(v.priceMinor ?? 0)),
        currency: v.currency || 'XAF',
        compare_at_price_minor: v.compareAtPriceMinor ?? null,
        stock_quantity: Number(v.stockQuantity ?? carriedStock.get(key) ?? 0),
        image_url: v.imageUrl || null,
        is_active: v.isActive !== false
      };
    });

    const { data, error } = await this.db
      .from('listing_variants')
      .insert(rows)
      .select('*');
    if (error) {
      throw new InfrastructureError('Supabase', `variant write failed: ${error.message}`, error);
    }
    return data || [];
  }

  static async listVariants(listingId) {
    const { data, error } = await this.db
      .from('listing_variants')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });
    if (error) throw new InfrastructureError('Supabase', `variant read failed: ${error.message}`, error);
    return data || [];
  }

  static async updateVariant(listingId, variantId, patch = {}) {
    const columns = {};
    if (patch.priceMinor !== undefined) columns.price_minor = Math.max(0, Number(patch.priceMinor));
    if (patch.compareAtPriceMinor !== undefined) columns.compare_at_price_minor = patch.compareAtPriceMinor;
    if (patch.stockQuantity !== undefined) columns.stock_quantity = Math.max(0, Number(patch.stockQuantity));
    if (patch.sku !== undefined) columns.sku = patch.sku;
    if (patch.imageUrl !== undefined) columns.image_url = patch.imageUrl;
    if (patch.isActive !== undefined) columns.is_active = Boolean(patch.isActive);
    columns.updated_at = new Date().toISOString();

    const { data, error } = await this.db
      .from('listing_variants')
      .update(columns)
      .eq('id', variantId)
      .eq('listing_id', listingId)
      .select('*')
      .maybeSingle();
    if (error) throw new InfrastructureError('Supabase', `variant update failed: ${error.message}`, error);
    return data || null;
  }
}

function isFiniteNumeric(v) {
  return typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v));
}

module.exports = ListingRepository;
module.exports.LISTING_COLUMNS = LISTING_COLUMNS;
module.exports.MEDIA_COLUMNS = MEDIA_COLUMNS;
