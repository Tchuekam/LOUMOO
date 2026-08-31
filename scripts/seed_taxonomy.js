#!/usr/bin/env node
/**
 * LOUMOO — Taxonomy & Storage Provisioner
 * ---------------------------------------------------------------------------
 * Mirrors the code-defined marketplace taxonomy into the database and ensures
 * the listing media bucket exists.
 *
 * Why this exists: `iam.listings.category_id` is a foreign key into
 * `iam.listing_categories`. If the taxonomy lives only in JavaScript, every
 * real listing insert fails. Seeding from the same constant the validator uses
 * guarantees the database and the validator agree.
 *
 *   node scripts/seed_taxonomy.js
 *
 * Idempotent: safe to run on every deploy.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');
const ListingTaxonomyUseCase = require('../server/modules/listing/application/ListingTaxonomyUseCase');
const config = require('../server/config/env');

async function seedCategories(db) {
  const categories = ListingTaxonomyUseCase.listAllCategories();

  // Parents first so the self-referencing FK resolves.
  const ordered = [...categories].sort((a, b) => (a.level || 1) - (b.level || 1));

  for (const c of ordered) {
    const row = {
      id: c.id,
      parent_id: c.parentId || null,
      vertical: c.vertical,
      name: c.name,
      slug: c.slug,
      icon: c.icon || 'tag',
      description: c.description || null,
      level: c.level || 1,
      supported_listing_types: c.supported_listing_types || c.supportedListingTypes || ['PHYSICAL_PRODUCT'],
      is_active: true,
      display_order: c.display_order || 0,
      updated_at: new Date().toISOString()
    };
    const { error } = await db.from('listing_categories').upsert(row, { onConflict: 'id' });
    if (error) throw new Error(`listing_categories[${c.id}]: ${error.message}`);
  }
  console.log(`[seed] ${ordered.length} categories synchronised.`);

  let attrCount = 0;
  for (const c of ordered) {
    const defs = c.attribute_definitions || c.attributeDefinitions || [];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const { error } = await db.from('category_attributes').upsert({
        id: `${c.id}__${d.slug}`,
        category_id: c.id,
        name: d.name,
        slug: d.slug,
        attribute_type: d.attribute_type || 'text',
        is_required: Boolean(d.is_required),
        is_searchable: d.is_searchable !== false,
        is_filterable: d.is_filterable !== false,
        is_variant_option: Boolean(d.is_variant_option),
        unit: d.unit || null,
        allowed_values: d.allowed_values || [],
        validation_rules: d.validation_rules || {},
        display_order: i,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw new Error(`category_attributes[${c.id}.${d.slug}]: ${error.message}`);
      attrCount++;
    }
  }
  console.log(`[seed] ${attrCount} category attributes synchronised.`);
}

/**
 * Creates the listing media bucket if it is missing.
 * PRIVATE: objects are served through signed URLs issued by the API, so a
 * storage path can never be enumerated or hot-linked by a stranger.
 */
async function ensureStorageBucket() {
  const bucket = config.supabase.storageBucket;
  const base = config.supabase.url.replace(/\/$/, '');
  const key = config.supabase.serviceRoleKey;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  const listRes = await fetch(`${base}/storage/v1/bucket`, { headers });
  const buckets = await listRes.json();
  if (Array.isArray(buckets) && buckets.some(b => b.name === bucket || b.id === bucket)) {
    console.log(`[seed] Storage bucket "${bucket}" already exists.`);
    return;
  }

  const createRes = await fetch(`${base}/storage/v1/bucket`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false,
      file_size_limit: 10 * 1024 * 1024,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })
  });
  const body = await createRes.text();
  if (!createRes.ok) throw new Error(`bucket create failed (${createRes.status}): ${body}`);
  console.log(`[seed] Created private storage bucket "${bucket}".`);
}

(async () => {
  const db = SupabaseDatabase.getAdmin();
  await seedCategories(db);
  await ensureStorageBucket();
  console.log('[seed] Done.');
  process.exit(0);
})().catch(err => {
  console.error('[seed] FAILED:', err.message);
  process.exit(1);
});
