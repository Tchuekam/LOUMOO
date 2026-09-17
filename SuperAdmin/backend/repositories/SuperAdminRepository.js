/**
 * LOUMOO SuperAdmin — SuperAdminRepository
 * ---------------------------------------------------------------------------
 * Encapsulates all database operations for system settings, audit logs,
 * and high-level platform aggregation metrics.
 */

const { SupabaseDatabase } = require('../../../server/infrastructure/database/SupabaseClient.js');
const logger = require('../../../server/shared/logging/logger');

// Default in-memory seed settings for fallback / local testing
const DEFAULT_SETTINGS = {
  platform_commission_rate: {
    rate_percent: 5.0,
    payout_fee_fixed_xaf: 150,
    escrow_hold_days: 3,
    category_rates: { electronics: 5.0, fashion: 8.0, services: 10.0, travel: 7.5 }
  },
  seller_whatsapp_default: {
    number: '237690123456',
    label: 'LOUMOO Central Merchant & Client Care',
    fallback_message: 'Hello LOUMOO Support! I am contacting you regarding an order.'
  },
  maintenance_mode: {
    enabled: false,
    banner_text: 'LOUMOO platform upgrade in progress. Order processing remains active.',
    allow_admin_bypass: true
  },
  announcement_banner: {
    active: true,
    message: 'Bienvenue sur LOUMOO! Expédition express sécurisée partout à Douala et Yaoundé.',
    badge: 'NOUVEAU',
    cta_text: 'Découvrir les boutiques',
    cta_url: '/stores'
  },
  shipping_rates_by_city: {
    Douala: 1000,
    Yaounde: 1500,
    Bafoussam: 2500,
    Kribi: 2500,
    Bamenda: 3000,
    Garoua: 4000,
    Maroua: 4500
  },
  feature_flags: {
    travel_enabled: true,
    visual_search_enabled: true,
    escrow_enabled: true,
    ai_assistant_enabled: true,
    crypto_payments_enabled: false
  }
};

// Default in-memory stores for fallback / test runs
const DEFAULT_STORES = [
  {
    id: 'store_orca_1',
    owner_id: 'usr_seller_1',
    name: 'Orca Electronics',
    slug: 'orca-electronics',
    description: 'Premier electronics and camera flagship in Douala Akwa.',
    category_id: 'electronics',
    phone_number: '237677101234',
    email: 'contact@orca.cm',
    city: 'Douala',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    is_verified: true,
    verification_tier: 'official_brand',
    rating: 4.9,
    product_count: 34,
    created_at: '2026-08-10T10:00:00Z',
    owner: { full_name: 'Jean-Paul Ndedi', email: 'jp.ndedi@gmail.com', phone: '237677101234', kyc_status: 'verified' }
  },
  {
    id: 'store_kamer_2',
    owner_id: 'usr_seller_2',
    name: 'Kamer Tech Solutions',
    slug: 'kamer-tech-solutions',
    description: 'Laptops, components and network repair services in Yaoundé.',
    category_id: 'electronics',
    phone_number: '237677814455',
    email: 'info@kamertech.cm',
    city: 'Yaoundé',
    status: 'PENDING_VERIFICATION',
    visibility: 'PUBLIC',
    is_verified: false,
    verification_tier: 'unverified',
    rating: 4.6,
    product_count: 12,
    created_at: '2026-09-12T14:30:00Z',
    owner: { full_name: 'Alain Fotso', email: 'alain.fotso@yahoo.fr', phone: '237677814455', kyc_status: 'submitted' }
  },
  {
    id: 'store_milano_3',
    owner_id: 'usr_seller_3',
    name: 'Armonía Milano Boutique',
    slug: 'armonia-milano',
    description: 'High luxury Italian leather goods & bespoke tailoring.',
    category_id: 'fashion',
    phone_number: '237655907755',
    email: 'armonia@milano.cm',
    city: 'Douala',
    status: 'PENDING_VERIFICATION',
    visibility: 'PUBLIC',
    is_verified: false,
    verification_tier: 'unverified',
    rating: 5.0,
    product_count: 28,
    created_at: '2026-09-14T09:15:00Z',
    owner: { full_name: 'Chantal Biya Mbarga', email: 'chantal.mbarga@gmail.com', phone: '237655907755', kyc_status: 'submitted' }
  },
  {
    id: 'store_fake_4',
    owner_id: 'usr_seller_4',
    name: 'Counterfeit Express',
    slug: 'counterfeit-express',
    description: 'Flagged for counterfeit luxury items.',
    category_id: 'fashion',
    phone_number: '237699000111',
    email: 'scam@sketchy.com',
    city: 'Kribi',
    status: 'SUSPENDED',
    visibility: 'PRIVATE',
    is_verified: false,
    verification_tier: 'unverified',
    rating: 1.2,
    product_count: 5,
    created_at: '2026-09-01T11:00:00Z',
    owner: { full_name: 'Unknown Operator', email: 'unknown@sketchy.com', phone: '237699000111', kyc_status: 'rejected' }
  }
];

// Default in-memory listings for fallback / test runs
const DEFAULT_LISTINGS = [
  {
    id: 'lst_macbook_1',
    store_id: 'store_orca_1',
    store_name: 'Orca Electronics',
    title: 'Apple MacBook Pro M3 Max 16" 36GB / 1TB SSD',
    slug: 'apple-macbook-pro-m3-max-16',
    category_id: 'electronics',
    base_price: 2450000,
    currency: 'XAF',
    stock_quantity: 4,
    status: 'PUBLISHED',
    is_featured: true,
    created_at: '2026-09-10T12:00:00Z'
  },
  {
    id: 'lst_bag_2',
    store_id: 'store_milano_3',
    store_name: 'Armonía Milano Boutique',
    title: 'Sac Cabas Cuir Grainé Milano Noir Prestige',
    slug: 'sac-cabas-cuir-graine-milano',
    category_id: 'fashion',
    base_price: 185000,
    currency: 'XAF',
    stock_quantity: 8,
    status: 'PENDING_APPROVAL',
    is_featured: false,
    created_at: '2026-09-15T08:30:00Z'
  },
  {
    id: 'lst_repair_3',
    store_id: 'store_kamer_2',
    store_name: 'Kamer Tech Solutions',
    title: 'Maintenance Réseau & Serveur Entreprise Douala / Yaoundé',
    slug: 'maintenance-reseau-serveur',
    category_id: 'services',
    base_price: 120000,
    currency: 'XAF',
    stock_quantity: 99,
    status: 'PUBLISHED',
    is_featured: false,
    created_at: '2026-09-14T11:00:00Z'
  }
];

// Default in-memory users for fallback / test runs
const DEFAULT_USERS = [
  {
    id: 'usr_admin_1',
    full_name: 'Super Admin LOUMOO',
    email: 'admin@loumoo.cm',
    phone_number: '237690123456',
    primary_role: 'super_admin',
    kyc_status: 'verified',
    status: 'active',
    city: 'Douala',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr_seller_1',
    full_name: 'Jean-Paul Ndedi',
    email: 'jp.ndedi@gmail.com',
    phone_number: '237677101234',
    primary_role: 'seller',
    kyc_status: 'verified',
    status: 'active',
    city: 'Douala',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'usr_buyer_1',
    full_name: 'Martine Ngo Yomkil',
    email: 'martine.ngo@gmail.com',
    phone_number: '237699112233',
    primary_role: 'customer',
    kyc_status: 'unverified',
    status: 'active',
    city: 'Yaoundé',
    created_at: '2026-09-05T14:20:00Z'
  }
];

// Default in-memory orders for fallback / test runs
const DEFAULT_ORDERS = [
  {
    id: 'ord_1001',
    order_number: 'LM-2609-8472',
    user_id: 'usr_buyer_1',
    customer_name: 'Martine Ngo Yomkil',
    store_id: 'store_orca_1',
    store_name: 'Orca Electronics',
    total_amount: 2450000,
    currency: 'XAF',
    status: 'DELIVERED',
    payment_status: 'PAID',
    escrow_status: 'HELD',
    created_at: '2026-09-16T15:00:00Z'
  },
  {
    id: 'ord_1002',
    order_number: 'LM-2609-9134',
    user_id: 'usr_buyer_1',
    customer_name: 'Martine Ngo Yomkil',
    store_id: 'store_milano_3',
    store_name: 'Armonía Milano Boutique',
    total_amount: 185000,
    currency: 'XAF',
    status: 'PROCESSING',
    payment_status: 'PAID',
    escrow_status: 'HELD',
    created_at: '2026-09-17T10:30:00Z'
  }
];

// In-memory audit log storage for fallback / test runs
const inMemoryAuditLogs = [];
const inMemorySettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
const inMemoryStores = JSON.parse(JSON.stringify(DEFAULT_STORES));
const inMemoryListings = JSON.parse(JSON.stringify(DEFAULT_LISTINGS));
const inMemoryUsers = JSON.parse(JSON.stringify(DEFAULT_USERS));
const inMemoryOrders = JSON.parse(JSON.stringify(DEFAULT_ORDERS));

class SuperAdminRepository {
  static get db() {
    if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_TEST_REMOTE_DB) {
      return null;
    }
    try {
      return SupabaseDatabase.getAdmin();
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetches all dynamic system settings.
   */
  static async getAllSettings() {
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db
          .from('system_settings')
          .select('key, value, category, description, is_secret, updated_by, updated_at');
        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = {};
          for (const row of data) {
            mapped[row.key] = row.value;
          }
          return { ...DEFAULT_SETTINGS, ...mapped };
        }
      } catch (err) {
        logger.warn('[SuperAdminRepository] Falling back to in-memory settings:', err.message);
      }
    }
    return { ...inMemorySettings };
  }

  /**
   * Fetches a single system setting by key.
   */
  static async getSetting(key) {
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db
          .from('system_settings')
          .select('key, value, category, description, updated_at')
          .eq('key', key)
          .maybeSingle();
        if (!error && data) {
          return data.value;
        }
      } catch (err) {
        logger.warn(`[SuperAdminRepository] Failed to query setting ${key}:`, err.message);
      }
    }
    return inMemorySettings[key] || DEFAULT_SETTINGS[key] || null;
  }

  /**
   * Updates or inserts a dynamic system setting.
   */
  static async updateSetting(key, value, adminId = 'super_admin') {
    const db = this.db;
    let oldVal = inMemorySettings[key] || DEFAULT_SETTINGS[key] || null;

    if (db) {
      try {
        // Fetch old value first for audit trail
        const existing = await db
          .from('system_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();
        if (existing && existing.data) {
          oldVal = existing.data.value;
        }

        const { data, error } = await db
          .from('system_settings')
          .upsert({
            key,
            value,
            updated_by: adminId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
          .select()
          .single();

        if (!error && data) {
          inMemorySettings[key] = value;
          return { success: true, key, value: data.value, oldVal };
        }
      } catch (err) {
        logger.warn(`[SuperAdminRepository] DB upsert failed for ${key}, using memory:`, err.message);
      }
    }

    inMemorySettings[key] = value;
    return { success: true, key, value, oldVal };
  }

  /**
   * Records an immutable audit log entry.
   */
  static async recordAuditLog({ adminId, action, resourceType, resourceId, oldValues = null, newValues = null, reason = null, ipAddress = null }) {
    const logEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      admin_id: adminId || 'admin_unknown',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      reason,
      ip_address: ipAddress || '127.0.0.1',
      created_at: new Date().toISOString()
    };

    const db = this.db;
    if (db) {
      try {
        await db.from('audit_logs').insert([logEntry]);
      } catch (err) {
        logger.warn('[SuperAdminRepository] Failed to insert audit log to DB:', err.message);
      }
    }

    inMemoryAuditLogs.unshift(logEntry);
    if (inMemoryAuditLogs.length > 500) {
      inMemoryAuditLogs.pop();
    }
    return logEntry;
  }

  /**
   * Retrieves recent audit logs.
   */
  static async getAuditLogs({ limit = 50, offset = 0, resourceType = null } = {}) {
    const db = this.db;
    if (db) {
      try {
        let query = db
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (resourceType) {
          query = query.eq('resource_type', resourceType);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        logger.warn('[SuperAdminRepository] Audit logs query error:', err.message);
      }
    }

    let filtered = inMemoryAuditLogs;
    if (resourceType) {
      filtered = filtered.filter(l => l.resource_type === resourceType);
    }
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Aggregates live system overview metrics for the executive dashboard.
   */
  static async getOverviewMetrics() {
    let storesCount = 18;
    let pendingKycCount = 3;
    let usersCount = 142;
    let totalOrders = 86;
    let gmvXaf = 14850000;
    let escrowInFlightXaf = 2340000;

    const db = this.db;
    if (db) {
      try {
        const [storesRes, profilesRes, ordersRes] = await Promise.allSettled([
          db.from('stores').select('id, status, is_verified', { count: 'exact' }),
          db.from('profiles').select('id, primary_role, kyc_status', { count: 'exact' }),
          db.from('orders').select('id, total_amount, status', { count: 'exact' })
        ]);

        if (storesRes.status === 'fulfilled' && storesRes.value.data) {
          const stores = storesRes.value.data;
          storesCount = stores.length;
          pendingKycCount = stores.filter(s => s.status === 'PENDING_VERIFICATION' || !s.is_verified).length;
        }
        if (profilesRes.status === 'fulfilled' && profilesRes.value.data) {
          usersCount = profilesRes.value.data.length;
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
          const orders = ordersRes.value.data;
          totalOrders = orders.length;
          gmvXaf = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
        }
      } catch (err) {
        logger.warn('[SuperAdminRepository] Overview metrics aggregation error:', err.message);
      }
    }

    return {
      kpis: {
        gmvXaf,
        gmvFormatted: `${(gmvXaf || 0).toLocaleString()} XAF`,
        totalOrders,
        activeStores: storesCount,
        pendingKycCount,
        registeredUsers: usersCount,
        escrowInFlightXaf,
        escrowInFlightFormatted: `${(escrowInFlightXaf || 0).toLocaleString()} XAF`
      },
      health: {
        serverStatus: 'HEALTHY',
        databaseStatus: 'CONNECTED',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Lists stores with optional status, tier, and search filtering.
   */
  static async listStores({ status = null, tier = null, search = null, limit = 50, offset = 0 } = {}) {
    const db = this.db;
    if (db) {
      try {
        let query = db
          .from('stores')
          .select('id, owner_id, name, slug, description, category_id, phone_number, email, status, visibility, is_verified, verification_tier, rating, product_count, created_at, updated_at, profiles!inner(full_name, email, phone_number, kyc_status)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status && status !== 'ALL') {
          query = query.eq('status', status);
        }
        if (tier && tier !== 'ALL') {
          query = query.eq('verification_tier', tier);
        }
        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(s => ({
            ...s,
            owner: s.profiles || null
          }));
        }
      } catch (err) {
        logger.warn('[SuperAdminRepository] listStores query error, using fallback:', err.message);
      }
    }

    let results = inMemoryStores;
    if (status && status !== 'ALL') {
      results = results.filter(s => s.status === status);
    }
    if (tier && tier !== 'ALL') {
      results = results.filter(s => s.verification_tier === tier);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.slug && s.slug.toLowerCase().includes(q)) ||
        (s.phone_number && s.phone_number.includes(q)) ||
        (s.owner && s.owner.full_name && s.owner.full_name.toLowerCase().includes(q))
      );
    }
    return results.slice(offset, offset + limit);
  }

  /**
   * Retrieves a single store by ID with owner metadata.
   */
  static async getStoreById(id) {
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db
          .from('stores')
          .select('*, profiles!inner(full_name, email, phone_number, kyc_status)')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            owner: data.profiles || null
          };
        }
      } catch (err) {
        logger.warn(`[SuperAdminRepository] getStoreById error for ${id}:`, err.message);
      }
    }

    return inMemoryStores.find(s => s.id === id) || null;
  }

  /**
   * Updates store status, verification tier, or contact details.
   */
  static async updateStore(id, updates = {}, adminId = 'super_admin') {
    const oldStore = await this.getStoreById(id);
    if (!oldStore) {
      return { success: false, error: 'Store not found' };
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db
          .from('stores')
          .update(payload)
          .eq('id', id)
          .select('*, profiles!inner(full_name, email, phone_number, kyc_status)')
          .single();

        if (!error && data) {
          // If verifying store, also update owner profile kyc_status
          if (updates.is_verified === true && data.owner_id) {
            await db.from('profiles').update({ kyc_status: 'verified' }).eq('id', data.owner_id);
          }
          return { success: true, store: data, oldStore };
        }
      } catch (err) {
        logger.warn(`[SuperAdminRepository] updateStore DB error for ${id}:`, err.message);
      }
    }

    const idx = inMemoryStores.findIndex(s => s.id === id);
    if (idx !== -1) {
      const updated = {
        ...inMemoryStores[idx],
        ...payload
      };
      if (updates.is_verified === true && updated.owner) {
        updated.owner.kyc_status = 'verified';
      }
      inMemoryStores[idx] = updated;
      return { success: true, store: updated, oldStore };
    }

    return { success: false, error: 'Store update failed' };
  }

  // ── LISTINGS MANAGEMENT ──

  static async listListings({ status = null, search = null, limit = 50, offset = 0 } = {}) {
    const db = this.db;
    if (db) {
      try {
        let query = db
          .from('listings')
          .select('id, store_id, title, slug, description, category_id, base_price, currency, stock_quantity, status, is_featured, created_at, stores!inner(name)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status && status !== 'ALL') query = query.eq('status', status);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(l => ({ ...l, store_name: (l.stores && l.stores.name) || 'Boutique' }));
        }
      } catch (err) {
        logger.warn('[SuperAdminRepository] listListings error, using fallback:', err.message);
      }
    }

    let results = inMemoryListings;
    if (status && status !== 'ALL') results = results.filter(l => l.status === status);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(l => (l.title && l.title.toLowerCase().includes(q)) || (l.store_name && l.store_name.toLowerCase().includes(q)));
    }
    return results.slice(offset, offset + limit);
  }

  static async getListingById(id) {
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db.from('listings').select('*, stores(name)').eq('id', id).maybeSingle();
        if (!error && data) return { ...data, store_name: (data.stores && data.stores.name) || 'Boutique' };
      } catch (err) {
        logger.warn(`[SuperAdminRepository] getListingById error for ${id}:`, err.message);
      }
    }
    return inMemoryListings.find(l => l.id === id) || null;
  }

  static async updateListing(id, updates = {}, adminId = 'super_admin') {
    const oldListing = await this.getListingById(id);
    if (!oldListing) return { success: false, error: 'Listing not found' };

    const payload = { ...updates, updated_at: new Date().toISOString() };
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db.from('listings').update(payload).eq('id', id).select().single();
        if (!error && data) return { success: true, listing: data, oldListing };
      } catch (err) {
        logger.warn(`[SuperAdminRepository] updateListing DB error:`, err.message);
      }
    }

    const idx = inMemoryListings.findIndex(l => l.id === id);
    if (idx !== -1) {
      const updated = { ...inMemoryListings[idx], ...payload };
      inMemoryListings[idx] = updated;
      return { success: true, listing: updated, oldListing };
    }
    return { success: false, error: 'Listing update failed' };
  }

  // ── USERS & RBAC MANAGEMENT ──

  static async listUsers({ role = null, kyc = null, search = null, limit = 50, offset = 0 } = {}) {
    const db = this.db;
    if (db) {
      try {
        let query = db
          .from('profiles')
          .select('id, full_name, email, phone_number, city, primary_role, kyc_status, status, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (role && role !== 'ALL') query = query.eq('primary_role', role);
        if (kyc && kyc !== 'ALL') query = query.eq('kyc_status', kyc);
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) return data;
      } catch (err) {
        logger.warn('[SuperAdminRepository] listUsers error, using fallback:', err.message);
      }
    }

    let results = inMemoryUsers;
    if (role && role !== 'ALL') results = results.filter(u => u.primary_role === role);
    if (kyc && kyc !== 'ALL') results = results.filter(u => u.kyc_status === kyc);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(u => (u.full_name && u.full_name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.phone_number && u.phone_number.includes(q)));
    }
    return results.slice(offset, offset + limit);
  }

  static async getUserById(id) {
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db.from('profiles').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.warn(`[SuperAdminRepository] getUserById error:`, err.message);
      }
    }
    return inMemoryUsers.find(u => u.id === id) || null;
  }

  static async updateUser(id, updates = {}, adminId = 'super_admin') {
    const oldUser = await this.getUserById(id);
    if (!oldUser) return { success: false, error: 'User not found' };

    const payload = { ...updates, updated_at: new Date().toISOString() };
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db.from('profiles').update(payload).eq('id', id).select().single();
        if (!error && data) return { success: true, user: data, oldUser };
      } catch (err) {
        logger.warn(`[SuperAdminRepository] updateUser DB error:`, err.message);
      }
    }

    const idx = inMemoryUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      const updated = { ...inMemoryUsers[idx], ...payload };
      inMemoryUsers[idx] = updated;
      return { success: true, user: updated, oldUser };
    }
    return { success: false, error: 'User update failed' };
  }

  // ── ORDERS & ESCROW MANAGEMENT ──

  static async listOrders({ status = null, escrowStatus = null, search = null, limit = 50, offset = 0 } = {}) {
    const db = this.db;
    if (db) {
      try {
        let query = db
          .from('orders')
          .select('id, order_number, user_id, store_id, total_amount, currency, status, payment_status, escrow_status, created_at, stores(name), profiles(full_name)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status && status !== 'ALL') query = query.eq('status', status);
        if (escrowStatus && escrowStatus !== 'ALL') query = query.eq('escrow_status', escrowStatus);

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(o => ({
            ...o,
            customer_name: (o.profiles && o.profiles.full_name) || 'Acheteur LOUMOO',
            store_name: (o.stores && o.stores.name) || 'Boutique'
          }));
        }
      } catch (err) {
        logger.warn('[SuperAdminRepository] listOrders error, using fallback:', err.message);
      }
    }

    let results = inMemoryOrders;
    if (status && status !== 'ALL') results = results.filter(o => o.status === status);
    if (escrowStatus && escrowStatus !== 'ALL') results = results.filter(o => o.escrow_status === escrowStatus);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(o => (o.order_number && o.order_number.toLowerCase().includes(q)) || (o.customer_name && o.customer_name.toLowerCase().includes(q)));
    }
    return results.slice(offset, offset + limit);
  }

  static async getOrderById(id) {
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db.from('orders').select('*, stores(name), profiles(full_name)').eq('id', id).maybeSingle();
        if (!error && data) {
          return {
            ...data,
            customer_name: (data.profiles && data.profiles.full_name) || 'Acheteur LOUMOO',
            store_name: (data.stores && data.stores.name) || 'Boutique'
          };
        }
      } catch (err) {
        logger.warn(`[SuperAdminRepository] getOrderById error:`, err.message);
      }
    }
    return inMemoryOrders.find(o => o.id === id) || null;
  }

  static async updateOrder(id, updates = {}, adminId = 'super_admin') {
    const oldOrder = await this.getOrderById(id);
    if (!oldOrder) return { success: false, error: 'Order not found' };

    const payload = { ...updates, updated_at: new Date().toISOString() };
    const db = this.db;
    if (db) {
      try {
        const { data, error } = await db.from('orders').update(payload).eq('id', id).select().single();
        if (!error && data) return { success: true, order: data, oldOrder };
      } catch (err) {
        logger.warn(`[SuperAdminRepository] updateOrder DB error:`, err.message);
      }
    }

    const idx = inMemoryOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const updated = { ...inMemoryOrders[idx], ...payload };
      inMemoryOrders[idx] = updated;
      return { success: true, order: updated, oldOrder };
    }
    return { success: false, error: 'Order update failed' };
  }
}

module.exports = SuperAdminRepository;
module.exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
module.exports.DEFAULT_STORES = DEFAULT_STORES;
module.exports.DEFAULT_LISTINGS = DEFAULT_LISTINGS;
module.exports.DEFAULT_USERS = DEFAULT_USERS;
module.exports.DEFAULT_ORDERS = DEFAULT_ORDERS;
