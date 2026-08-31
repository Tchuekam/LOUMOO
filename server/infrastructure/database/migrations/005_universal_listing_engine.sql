-- ============================================================================
-- LOUMOO ENTERPRISE UNIVERSAL LISTING & COMMERCE ENGINE SCHEMA
-- Migration: 005_universal_listing_engine.sql
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS iam;

-- 1. LISTING CATEGORIES & TAXONOMY
CREATE TABLE IF NOT EXISTS iam.listing_categories (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  parent_id VARCHAR(64) REFERENCES iam.listing_categories(id) ON DELETE SET NULL,
  vertical VARCHAR(64) NOT NULL, -- electronics, fashion, home, services, hotels, travel, food, automotive, digital
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  icon VARCHAR(64) DEFAULT 'tag',
  description TEXT,
  level INT NOT NULL DEFAULT 1, -- 1: Vertical, 2: Category, 3: Subcategory, 4: Product Type
  supported_listing_types JSONB NOT NULL DEFAULT '["PHYSICAL_PRODUCT"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_categories_vertical ON iam.listing_categories(vertical);
CREATE INDEX IF NOT EXISTS idx_listing_categories_parent ON iam.listing_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_slug ON iam.listing_categories(slug);

-- 2. DYNAMIC CATEGORY ATTRIBUTE DEFINITIONS
CREATE TABLE IF NOT EXISTS iam.category_attributes (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id VARCHAR(64) NOT NULL REFERENCES iam.listing_categories(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL,
  attribute_type VARCHAR(32) NOT NULL DEFAULT 'text', -- text, longtext, number, decimal, boolean, select, multi_select, color, measurement, currency
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_searchable BOOLEAN NOT NULL DEFAULT true,
  is_filterable BOOLEAN NOT NULL DEFAULT true,
  is_variant_option BOOLEAN NOT NULL DEFAULT false,
  unit VARCHAR(32), -- GB, mAh, cm, kg, hrs, nights, etc.
  allowed_values JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb, -- min, max, regex, options
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_category_attributes_cat ON iam.category_attributes(category_id);

-- 3. MASTER UNIVERSAL LISTINGS TABLE
CREATE TABLE IF NOT EXISTS iam.listings (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE,
  seller_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  listing_type VARCHAR(32) NOT NULL DEFAULT 'PHYSICAL_PRODUCT', -- PHYSICAL_PRODUCT, DIGITAL_PRODUCT, SERVICE, BOOKING, RENTAL, SUBSCRIPTION, BUNDLE
  category_id VARCHAR(64) NOT NULL REFERENCES iam.listing_categories(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description VARCHAR(500),
  description TEXT,
  sku VARCHAR(128),
  barcode VARCHAR(128),
  brand VARCHAR(128),
  model VARCHAR(128),
  condition VARCHAR(32) DEFAULT 'new', -- new, refurbished, used_like_new, used_good, pre_owned, not_applicable
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PREVIEW, READY, PENDING_REVIEW, PUBLISHED, PAUSED, ARCHIVED, REJECTED
  rejection_reason TEXT,
  visibility VARCHAR(32) NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, PRIVATE, UNLISTED
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
  base_price_minor BIGINT NOT NULL DEFAULT 0,
  sale_price_minor BIGINT,
  compare_at_price_minor BIGINT,
  has_variants BOOLEAN NOT NULL DEFAULT false,
  fulfillment_model VARCHAR(32) NOT NULL DEFAULT 'DELIVERY_OR_PICKUP', -- DELIVERY, PICKUP, DELIVERY_OR_PICKUP, DIGITAL_DOWNLOAD, SERVICE_ONSITE, SERVICE_REMOTE, BOOKING_VOUCHER
  view_count INT NOT NULL DEFAULT 0,
  save_count INT NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  rating_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_listings_store_id ON iam.listings(store_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON iam.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON iam.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON iam.listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON iam.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON iam.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON iam.listings(created_at DESC);

-- 4. DYNAMIC ATTRIBUTE VALUES (EAV)
CREATE TABLE IF NOT EXISTS iam.listing_attribute_values (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id VARCHAR(64) NOT NULL REFERENCES iam.listings(id) ON DELETE CASCADE,
  attribute_id VARCHAR(64) NOT NULL REFERENCES iam.category_attributes(id) ON DELETE CASCADE,
  attribute_slug VARCHAR(128) NOT NULL,
  value_text TEXT,
  value_number NUMERIC(14, 4),
  value_boolean BOOLEAN,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, attribute_slug)
);

CREATE INDEX IF NOT EXISTS idx_listing_attr_val_listing ON iam.listing_attribute_values(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_attr_val_slug ON iam.listing_attribute_values(attribute_slug);

-- 5. LISTING MEDIA ASSETS
CREATE TABLE IF NOT EXISTS iam.listing_media (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id VARCHAR(64) NOT NULL REFERENCES iam.listings(id) ON DELETE CASCADE,
  media_type VARCHAR(16) NOT NULL DEFAULT 'IMAGE', -- IMAGE, VIDEO, DOCUMENT
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  width INT,
  height INT,
  file_size_bytes BIGINT,
  mime_type VARCHAR(64),
  alt_text VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_media_listing ON iam.listing_media(listing_id, display_order ASC);

-- 6. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS iam.listing_variants (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id VARCHAR(64) NOT NULL REFERENCES iam.listings(id) ON DELETE CASCADE,
  sku VARCHAR(128),
  barcode VARCHAR(128),
  title VARCHAR(255) NOT NULL,
  options_summary JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"color": "Space Grey", "storage": "256GB"}
  price_minor BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
  compare_at_price_minor BIGINT,
  stock_quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  image_url TEXT,
  weight_grams INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_variants_listing ON iam.listing_variants(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_variants_sku ON iam.listing_variants(sku);

-- 7. CONCURRENCY-SAFE INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS iam.listing_inventory (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id VARCHAR(64) NOT NULL REFERENCES iam.listings(id) ON DELETE CASCADE,
  variant_id VARCHAR(64) REFERENCES iam.listing_variants(id) ON DELETE CASCADE,
  on_hand INT NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 3,
  allow_backorder BOOLEAN NOT NULL DEFAULT false,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_inventory_listing ON iam.listing_inventory(listing_id);

-- 8. SERVICE, BOOKING & RENTAL AVAILABILITY
CREATE TABLE IF NOT EXISTS iam.listing_availability (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id VARCHAR(64) NOT NULL REFERENCES iam.listings(id) ON DELETE CASCADE,
  availability_strategy VARCHAR(32) NOT NULL DEFAULT 'STOCK', -- STOCK, TIME_SLOT, DATE_RANGE, CAPACITY, UNLIMITED
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Douala',
  lead_time_hours INT NOT NULL DEFAULT 2,
  cutoff_time_hours INT NOT NULL DEFAULT 1,
  min_duration_units INT DEFAULT 1,
  max_duration_units INT DEFAULT 30,
  capacity_per_slot INT DEFAULT 1,
  weekly_schedule JSONB DEFAULT '{"monday":[{"start":"08:00","end":"18:00"}]}'::jsonb,
  blackout_dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_availability_listing ON iam.listing_availability(listing_id);

-- 9. LISTING AUTOSAVE DRAFTS (Temporary state storage)
CREATE TABLE IF NOT EXISTS iam.listing_drafts (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE,
  seller_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  step_identifier VARCHAR(64) NOT NULL DEFAULT 'step1',
  draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, seller_id)
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE iam.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.listing_drafts ENABLE ROW LEVEL SECURITY;

-- Public read for published listings and taxonomy
CREATE POLICY "Public read for published listings" ON iam.listings
  FOR SELECT USING (status = 'PUBLISHED' AND visibility = 'PUBLIC' AND deleted_at IS NULL);

CREATE POLICY "Public read for active categories" ON iam.listing_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read for category attributes" ON iam.category_attributes
  FOR SELECT USING (true);

CREATE POLICY "Public read for published listing media" ON iam.listing_media
  FOR SELECT USING (EXISTS (SELECT 1 FROM iam.listings l WHERE l.id = listing_media.listing_id AND l.status = 'PUBLISHED' AND l.deleted_at IS NULL));

CREATE POLICY "Public read for published listing variants" ON iam.listing_variants
  FOR SELECT USING (EXISTS (SELECT 1 FROM iam.listings l WHERE l.id = listing_variants.listing_id AND l.status = 'PUBLISHED' AND l.deleted_at IS NULL));

-- Store owners and staff full access to own listings
CREATE POLICY "Store owners manage own listings" ON iam.listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM iam.store_members sm
      WHERE sm.store_id = listings.store_id
      AND sm.user_id = auth.uid()::text::text
      AND sm.role IN ('owner', 'admin', 'manager', 'staff')
    )
  );

CREATE POLICY "Store owners manage own listing drafts" ON iam.listing_drafts
  FOR ALL USING (
    seller_id = auth.uid()::text::text OR
    EXISTS (
      SELECT 1 FROM iam.store_members sm
      WHERE sm.store_id = listing_drafts.store_id
      AND sm.user_id = auth.uid()::text::text
    )
  );
