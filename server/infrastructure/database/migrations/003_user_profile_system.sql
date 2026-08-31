-- ==============================================================================
-- LOUMOO ENTERPRISE BACKEND MIGRATION: 003_user_profile_system.sql
-- Description: Creates Addresses, Saved Items, Followed Stores, User Activities,
--              Notification Preferences, and Orders tables with RLS and constraints.
-- ==============================================================================

-- 1. Addresses Table (African & Cameroon Marketplace Schema)
CREATE TABLE IF NOT EXISTS iam.addresses (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    recipient_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'Cameroon',
    region VARCHAR(64) NOT NULL DEFAULT 'Littoral',
    city VARCHAR(64) NOT NULL DEFAULT 'Douala',
    quarter VARCHAR(100),
    street_address TEXT NOT NULL,
    landmark TEXT,
    delivery_instructions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(32) NOT NULL DEFAULT 'shipping' CHECK (category IN ('shipping', 'billing', 'pickup')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON iam.addresses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_addresses_default ON iam.addresses(user_id, is_default) WHERE is_default = TRUE AND deleted_at IS NULL;

-- 2. Saved Items (Wishlist) Table
CREATE TABLE IF NOT EXISTS iam.saved_items (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    price_xaf NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(64) DEFAULT 'Electronics',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON iam.saved_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_items_product ON iam.saved_items(product_id);

-- 3. Followed Stores Table
CREATE TABLE IF NOT EXISTS iam.followed_stores (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    store_id VARCHAR(64) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    store_avatar TEXT,
    city VARCHAR(64) DEFAULT 'Douala',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_store UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_followed_stores_user ON iam.followed_stores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followed_stores_store ON iam.followed_stores(store_id);

-- 4. User Activities (User-Facing Activity Stream)
CREATE TABLE IF NOT EXISTS iam.user_activities (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL, -- 'profile_updated', 'address_added', 'address_removed', 'store_followed', 'store_unfollowed', 'item_saved', 'item_removed', 'order_placed', 'settings_changed'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(64),
    resource_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON iam.user_activities(user_id, created_at DESC);

-- 5. Notification Preferences Table
CREATE TABLE IF NOT EXISTS iam.notification_preferences (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE UNIQUE,
    channels JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "sms": true, "whatsapp": false}'::jsonb,
    categories JSONB NOT NULL DEFAULT '{"transactional": true, "marketing": true, "social": true, "system": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON iam.notification_preferences(user_id);

-- 6. Orders Domain Table (Purchase History Foundation)
CREATE TABLE IF NOT EXISTS iam.orders (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    buyer_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE RESTRICT,
    seller_id VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE SET NULL,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    total_amount_xaf NUMERIC(14, 2) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'escrow_held', 'refunded')),
    fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'processing' CHECK (fulfillment_status IN ('processing', 'in_transit', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON iam.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON iam.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON iam.orders(order_number);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE iam.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.followed_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.orders ENABLE ROW LEVEL SECURITY;

-- 8. Strict RLS Policies for Resource Owners
CREATE POLICY "Users can manage own addresses"
    ON iam.addresses FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own saved items"
    ON iam.saved_items FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own followed stores"
    ON iam.followed_stores FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view own user activities"
    ON iam.user_activities FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own notification preferences"
    ON iam.notification_preferences FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Buyers can view own orders"
    ON iam.orders FOR SELECT
    USING (buyer_id = auth.uid()::text);

-- Service Role Full Access
CREATE POLICY "Service role full access to addresses" ON iam.addresses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to saved_items" ON iam.saved_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to followed_stores" ON iam.followed_stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to user_activities" ON iam.user_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to notification_preferences" ON iam.notification_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to orders" ON iam.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
