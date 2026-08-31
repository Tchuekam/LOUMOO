-- ==============================================================================
-- LOUMOO ENTERPRISE BACKEND MIGRATION: 004_store_business_system.sql
-- Description: Creates Stores, Store Members, Store Profiles, Store Verifications,
--              Store Hours, Store Locations, Store Settings, and Store Analytics
--              tables with strict foreign keys, indexes, and RLS security.
-- ==============================================================================

-- 1. Stores Master Entity Table
CREATE TABLE IF NOT EXISTS iam.stores (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category_id VARCHAR(64) NOT NULL DEFAULT 'electronics',
    logo_url TEXT,
    cover_url TEXT,
    phone_number VARCHAR(32),
    email VARCHAR(255),
    website_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED')),
    visibility VARCHAR(32) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'UNLISTED')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_tier VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_tier IN ('unverified', 'individual_verified', 'pro_merchant', 'official_brand')),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    rating_count INT NOT NULL DEFAULT 0,
    follower_count INT NOT NULL DEFAULT 0,
    product_count INT NOT NULL DEFAULT 0,
    onboarding_step VARCHAR(64) NOT NULL DEFAULT 'NOT_STARTED' CHECK (onboarding_step IN ('NOT_STARTED', 'IN_PROGRESS', 'PROFILE_COMPLETED', 'BUSINESS_INFO_COMPLETED', 'LOCATION_COMPLETED', 'HOURS_COMPLETED', 'VERIFICATION_SUBMITTED', 'ACTIVE')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON iam.stores(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stores_slug ON iam.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON iam.stores(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stores_category ON iam.stores(category_id);
CREATE INDEX IF NOT EXISTS idx_stores_discovery ON iam.stores(status, visibility, is_verified, rating DESC) WHERE deleted_at IS NULL;

-- 2. Store Members & Role-Based Permissions (Multi-User Store Staff)
CREATE TABLE IF NOT EXISTS iam.store_members (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
    permissions JSONB NOT NULL DEFAULT '["store.view", "store.manage_products", "store.manage_orders"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_store_user UNIQUE (store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_members_user ON iam.store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_store ON iam.store_members(store_id);

-- 3. Store Extended Public Profile
CREATE TABLE IF NOT EXISTS iam.store_profiles (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE UNIQUE,
    tagline VARCHAR(255),
    bio TEXT,
    return_policy TEXT,
    warranty_policy TEXT,
    shipping_policy TEXT,
    social_links JSONB NOT NULL DEFAULT '{"whatsapp": "", "facebook": "", "instagram": "", "website": ""}'::jsonb,
    badges JSONB NOT NULL DEFAULT '["fast_shipping", "escrow_ready"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_profiles_store ON iam.store_profiles(store_id);

-- 4. Store Verification & Legal Compliance (Strictly Private)
CREATE TABLE IF NOT EXISTS iam.store_verifications (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE UNIQUE,
    legal_business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(64) NOT NULL DEFAULT 'individual' CHECK (business_type IN ('individual', 'pro', 'sarl', 'sa', 'cooperative')),
    rccm_number VARCHAR(128),
    tax_id_niu VARCHAR(128),
    representative_full_name VARCHAR(150),
    representative_id_type VARCHAR(32) NOT NULL DEFAULT 'cni' CHECK (representative_id_type IN ('cni', 'passport', 'driver_license', 'residence_permit')),
    representative_id_number VARCHAR(64),
    id_document_front_url TEXT,
    id_document_back_url TEXT,
    business_document_url TEXT,
    tax_document_url TEXT,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (verification_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_RESUBMISSION')),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(64) REFERENCES iam.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_verifications_store ON iam.store_verifications(store_id);
CREATE INDEX IF NOT EXISTS idx_store_verifications_status ON iam.store_verifications(verification_status);

-- 5. Store Opening Hours & Operational Schedule
CREATE TABLE IF NOT EXISTS iam.store_hours (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE UNIQUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Douala',
    is_always_open BOOLEAN NOT NULL DEFAULT FALSE,
    is_temporarily_closed BOOLEAN NOT NULL DEFAULT FALSE,
    temporary_closure_reason TEXT,
    schedule JSONB NOT NULL DEFAULT '{
        "monday":    {"open": "08:00", "close": "18:30", "closed": false},
        "tuesday":   {"open": "08:00", "close": "18:30", "closed": false},
        "wednesday": {"open": "08:00", "close": "18:30", "closed": false},
        "thursday":  {"open": "08:00", "close": "18:30", "closed": false},
        "friday":    {"open": "08:00", "close": "18:30", "closed": false},
        "saturday":  {"open": "09:00", "close": "17:00", "closed": false},
        "sunday":    {"open": "10:00", "close": "14:00", "closed": true}
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_hours_store ON iam.store_hours(store_id);

-- 6. Store Physical & Commercial Location
CREATE TABLE IF NOT EXISTS iam.store_locations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE UNIQUE,
    country VARCHAR(64) NOT NULL DEFAULT 'Cameroon',
    region VARCHAR(64) NOT NULL DEFAULT 'Littoral',
    city VARCHAR(64) NOT NULL DEFAULT 'Douala',
    district_quarter VARCHAR(100) NOT NULL DEFAULT 'Akwa',
    street_address TEXT NOT NULL,
    landmark TEXT,
    building_floor VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    service_radius_km INT DEFAULT 25,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_locations_store ON iam.store_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_geo ON iam.store_locations(city, region);

-- 7. Store Operational Settings & Merchant Preferences
CREATE TABLE IF NOT EXISTS iam.store_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE UNIQUE,
    currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
    accepts_escrow BOOLEAN NOT NULL DEFAULT TRUE,
    accepts_momo BOOLEAN NOT NULL DEFAULT TRUE,
    accepts_orange_money BOOLEAN NOT NULL DEFAULT TRUE,
    accepts_cash_on_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    allow_store_pickup BOOLEAN NOT NULL DEFAULT TRUE,
    allow_national_shipping BOOLEAN NOT NULL DEFAULT TRUE,
    minimum_order_xaf NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    auto_accept_orders BOOLEAN NOT NULL DEFAULT FALSE,
    notification_settings JSONB NOT NULL DEFAULT '{"new_order_sms": true, "new_order_email": true, "low_stock_alert": true, "payout_processed": true}'::jsonb,
    privacy_settings JSONB NOT NULL DEFAULT '{"show_phone": true, "show_email": false, "show_physical_address": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_settings_store ON iam.store_settings(store_id);

-- 8. Store Daily Analytics & Performance Aggregates
CREATE TABLE IF NOT EXISTS iam.store_analytics (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) NOT NULL REFERENCES iam.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views_count INT NOT NULL DEFAULT 0,
    unique_visitors INT NOT NULL DEFAULT 0,
    product_views_count INT NOT NULL DEFAULT 0,
    add_to_cart_count INT NOT NULL DEFAULT 0,
    orders_count INT NOT NULL DEFAULT 0,
    revenue_xaf NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    conversion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_store_date UNIQUE (store_id, date)
);

CREATE INDEX IF NOT EXISTS idx_store_analytics_store_date ON iam.store_analytics(store_id, date DESC);

-- 9. Row Level Security (RLS) Policies
ALTER TABLE iam.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.store_analytics ENABLE ROW LEVEL SECURITY;

-- Stores RLS: Public active stores are viewable by all; draft/private stores only by members
DROP POLICY IF EXISTS p_stores_public_read ON iam.stores;
CREATE POLICY p_stores_public_read ON iam.stores
    FOR SELECT USING (status = 'ACTIVE' AND visibility = 'PUBLIC' AND deleted_at IS NULL);

-- Store Verifications RLS: Strictly private to store members with admin/owner role
DROP POLICY IF EXISTS p_store_verifications_owner ON iam.store_verifications;
CREATE POLICY p_store_verifications_owner ON iam.store_verifications
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM iam.store_members 
            WHERE user_id = auth.uid()::text AND role IN ('owner', 'admin')
        )
    );

-- Store Settings RLS: Only store owners/admins can read and update
DROP POLICY IF EXISTS p_store_settings_owner ON iam.store_settings;
CREATE POLICY p_store_settings_owner ON iam.store_settings
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM iam.store_members 
            WHERE user_id = auth.uid()::text AND role IN ('owner', 'admin')
        )
    );

-- Store Analytics RLS: Only store members can read private performance data
DROP POLICY IF EXISTS p_store_analytics_members ON iam.store_analytics;
CREATE POLICY p_store_analytics_members ON iam.store_analytics
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM iam.store_members 
            WHERE user_id = auth.uid()::text
        )
    );
