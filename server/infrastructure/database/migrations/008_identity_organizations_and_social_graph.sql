-- ==============================================================================
-- LOUMOO ENTERPRISE BACKEND MIGRATION: 008_identity_organizations_and_social_graph.sql
-- Description: Extends profiles and stores with commercial identity fields;
--              Creates organizations, organization members, social graph
--              (follows, recommendations, blocks), and verified transaction reviews.
-- ==============================================================================

-- ── 1. EXTEND IAM.PROFILES WITH USERNAME & SOCIAL FIELDS ──────────────────────
ALTER TABLE iam.profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(48),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS headline VARCHAR(255),
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS follower_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_username'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username
      ON iam.profiles(LOWER(username))
      WHERE username IS NOT NULL AND deleted_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON iam.profiles(username);

-- ── 2. NEW TABLE: IAM.ORGANIZATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.organizations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    legal_name VARCHAR(255),
    org_type VARCHAR(48) NOT NULL DEFAULT 'COMPANY'
      CHECK (org_type IN ('COMPANY', 'AGENCY', 'INSTITUTE', 'COMMUNITY', 'ENTERPRISE', 'COOPERATIVE', 'BRAND')),
    logo_url TEXT,
    cover_url TEXT,
    description TEXT,
    email VARCHAR(255),
    phone_number VARCHAR(32),
    website_url TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Douala',
    country VARCHAR(64) NOT NULL DEFAULT 'Cameroon',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
      CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON iam.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON iam.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON iam.organizations(status) WHERE deleted_at IS NULL;

-- ── 3. NEW TABLE: IAM.ORGANIZATION_MEMBERS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.organization_members (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(64) NOT NULL REFERENCES iam.organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'MEMBER'
      CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'EDITOR', 'SUPPORT', 'MEMBER')),
    permissions JSONB NOT NULL DEFAULT '["org.view", "store.manage_products"]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
      CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
    invited_by VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_organization_member UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON iam.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON iam.organization_members(organization_id);

-- ── 4. EXTEND IAM.STORES WITH COMMERCIAL IDENTITY & REPUTATION FIELDS ─────────
ALTER TABLE iam.stores
  ADD COLUMN IF NOT EXISTS seller_type VARCHAR(32) NOT NULL DEFAULT 'SHOP',
  ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) REFERENCES iam.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recommendation_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS trust_tier VARCHAR(32) NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS completed_orders_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_stores_seller_type') THEN
    ALTER TABLE iam.stores ADD CONSTRAINT chk_stores_seller_type
      CHECK (seller_type IN ('FREELANCER', 'SHOP', 'AGENCY', 'INSTITUTE', 'BRAND', 'ORGANIZATION', 'OTHER'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_stores_trust_tier') THEN
    ALTER TABLE iam.stores ADD CONSTRAINT chk_stores_trust_tier
      CHECK (trust_tier IN ('NEW', 'ESTABLISHED', 'TOP_RATED', 'VERIFIED_LEADER'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stores_org_id ON iam.stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_stores_seller_type ON iam.stores(seller_type);
CREATE INDEX IF NOT EXISTS idx_stores_trust_tier ON iam.stores(trust_tier);

-- ── 5. NEW TABLE: IAM.SOCIAL_FOLLOWS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.social_follows (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    follower_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('user', 'seller')),
    target_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_follow UNIQUE (follower_id, target_type, target_id),
    CONSTRAINT chk_no_self_user_follow CHECK (target_type <> 'user' OR follower_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_social_follows_follower ON iam.social_follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_follows_target ON iam.social_follows(target_type, target_id, created_at DESC);

-- ── 6. NEW TABLE: IAM.SOCIAL_RECOMMENDATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.social_recommendations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    author_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('user', 'seller')),
    target_id VARCHAR(64) NOT NULL,
    note TEXT NOT NULL,
    relationship_context VARCHAR(64) NOT NULL DEFAULT 'client'
      CHECK (relationship_context IN ('client', 'partner', 'colleague', 'buyer', 'mentor', 'peer')),
    status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED'
      CHECK (status IN ('PUBLISHED', 'HIDDEN', 'FLAGGED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_rec UNIQUE (author_id, target_type, target_id),
    CONSTRAINT chk_no_self_rec CHECK (target_type <> 'user' OR author_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_social_rec_author ON iam.social_recommendations(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_rec_target ON iam.social_recommendations(target_type, target_id, created_at DESC);

-- ── 7. NEW TABLE: IAM.REVIEWS (TRANSACTION-VERIFIED & COMMUNITY REVIEWS) ──────
CREATE TABLE IF NOT EXISTS iam.reviews (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    author_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('seller', 'product', 'service')),
    target_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64) REFERENCES iam.orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_votes_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED'
      CHECK (status IN ('PUBLISHED', 'PENDING_MODERATION', 'FLAGGED', 'HIDDEN')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_order_target
  ON iam.reviews(author_id, order_id, target_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_target ON iam.reviews(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON iam.reviews(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON iam.reviews(target_type, target_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON iam.reviews(target_type, target_id, is_verified_purchase);

-- ── 8. NEW TABLE: IAM.SOCIAL_BLOCKS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.social_blocks (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    blocker_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    blocked_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_social_blocks_lookup ON iam.social_blocks(blocker_id, blocked_id);

-- ── 9. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
ALTER TABLE iam.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.social_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.social_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_orgs_public_read ON iam.organizations;
CREATE POLICY p_orgs_public_read ON iam.organizations
    FOR SELECT USING (status = 'ACTIVE' AND deleted_at IS NULL);

DROP POLICY IF EXISTS p_rec_public_read ON iam.social_recommendations;
CREATE POLICY p_rec_public_read ON iam.social_recommendations
    FOR SELECT USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS p_reviews_public_read ON iam.reviews;
CREATE POLICY p_reviews_public_read ON iam.reviews
    FOR SELECT USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS p_follows_public_read ON iam.social_follows;
CREATE POLICY p_follows_public_read ON iam.social_follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS p_service_role_orgs ON iam.organizations;
CREATE POLICY p_service_role_orgs ON iam.organizations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_service_role_org_members ON iam.organization_members;
CREATE POLICY p_service_role_org_members ON iam.organization_members FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_service_role_follows ON iam.social_follows;
CREATE POLICY p_service_role_follows ON iam.social_follows FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_service_role_recommendations ON iam.social_recommendations;
CREATE POLICY p_service_role_recommendations ON iam.social_recommendations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_service_role_reviews ON iam.reviews;
CREATE POLICY p_service_role_reviews ON iam.reviews FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_service_role_blocks ON iam.social_blocks;
CREATE POLICY p_service_role_blocks ON iam.social_blocks FOR ALL TO service_role USING (true) WITH CHECK (true);
