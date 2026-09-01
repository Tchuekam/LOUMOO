-- ============================================================================
-- LOUMOO COMMERCIAL DISTRIBUTION ENGINE & ANNOUNCEMENTS SCHEMA
-- Migration: 009_announcements_and_distribution.sql
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS iam;

-- ── 1. TABLE: IAM.ANNOUNCEMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.announcements (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(64) REFERENCES iam.stores(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    organization_id VARCHAR(64) REFERENCES iam.organizations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(32) NOT NULL DEFAULT 'ANNOUNCEMENT'
      CHECK (type IN ('ANNOUNCEMENT', 'PROMOTION', 'PRODUCT_DROP', 'SERVICE_AVAILABLE', 'EVENT', 'HIRING', 'ALERT')),
    body TEXT NOT NULL,
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
      CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED', 'ARCHIVED')),
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    attachment_type VARCHAR(32) NOT NULL DEFAULT 'NONE'
      CHECK (attachment_type IN ('PRODUCT', 'SERVICE', 'STORE', 'EVENT', 'PROMOTION', 'NONE')),
    attachment_id VARCHAR(64),
    attachment_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    cta_type VARCHAR(32) NOT NULL DEFAULT 'VIEW_STORE'
      CHECK (cta_type IN ('VIEW_PRODUCT', 'BUY_NOW', 'CONTACT_SELLER', 'VIEW_STORE', 'BOOK_SERVICE', 'FOLLOW_SELLER', 'LEARN_MORE', 'REGISTER', 'APPLY_NOW')),
    cta_label VARCHAR(64) NOT NULL DEFAULT 'View Details',
    cta_url TEXT,
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_announcements_store ON iam.announcements(store_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON iam.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_org ON iam.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type_status ON iam.announcements(type, status);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON iam.announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_slug ON iam.announcements(slug);

-- ── 2. TABLE: IAM.ANNOUNCEMENT_TARGETS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.announcement_targets (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    announcement_id VARCHAR(64) NOT NULL UNIQUE REFERENCES iam.announcements(id) ON DELETE CASCADE,
    audience_scope VARCHAR(32) NOT NULL DEFAULT 'EVERYONE'
      CHECK (audience_scope IN ('EVERYONE', 'FOLLOWERS', 'PREVIOUS_BUYERS', 'TARGETED')),
    target_cities JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_buyer_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_targets_scope ON iam.announcement_targets(audience_scope);

-- ── 3. TABLE: IAM.ANNOUNCEMENT_METRICS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.announcement_metrics (
    announcement_id VARCHAR(64) PRIMARY KEY REFERENCES iam.announcements(id) ON DELETE CASCADE,
    impressions INT NOT NULL DEFAULT 0,
    views INT NOT NULL DEFAULT 0,
    unique_viewers INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    cta_clicks INT NOT NULL DEFAULT 0,
    shares INT NOT NULL DEFAULT 0,
    conversions INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_metrics_announcement ON iam.announcement_metrics(announcement_id);

-- ── 4. TABLE: IAM.ANNOUNCEMENT_EVENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam.announcement_events (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    announcement_id VARCHAR(64) NOT NULL REFERENCES iam.announcements(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(32) NOT NULL
      CHECK (event_type IN ('IMPRESSION', 'VIEW', 'CLICK', 'CTA_CLICK', 'SHARE', 'CONVERSION')),
    ip_hash VARCHAR(64),
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_events_announcement ON iam.announcement_events(announcement_id, event_type);
CREATE INDEX IF NOT EXISTS idx_announcement_events_user ON iam.announcement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_events_created ON iam.announcement_events(created_at DESC);

-- ── 5. ROW LEVEL SECURITY POLICIES ───────────────────────────────────────────
ALTER TABLE iam.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.announcement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.announcement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.announcement_events ENABLE ROW LEVEL SECURITY;

-- Public can view active published announcements
DROP POLICY IF EXISTS p_announcements_select_published ON iam.announcements;
CREATE POLICY p_announcements_select_published ON iam.announcements
  FOR SELECT USING (
    status = 'PUBLISHED' 
    AND deleted_at IS NULL 
    AND (published_at IS NULL OR published_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Authors can view all their own announcements (including drafts, scheduled, etc.)
DROP POLICY IF EXISTS p_announcements_select_author ON iam.announcements;
CREATE POLICY p_announcements_select_author ON iam.announcements
  FOR SELECT USING (auth.uid()::text = author_id);

-- Store owners and organization members can view their store announcements
DROP POLICY IF EXISTS p_announcements_select_store ON iam.announcements;
CREATE POLICY p_announcements_select_store ON iam.announcements
  FOR SELECT USING (
    store_id IN (SELECT id FROM iam.stores WHERE owner_id = auth.uid()::text)
  );

-- Insert policy: authenticated users can create announcements
DROP POLICY IF EXISTS p_announcements_insert ON iam.announcements;
CREATE POLICY p_announcements_insert ON iam.announcements
  FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- Update policy: author or store owner can update
DROP POLICY IF EXISTS p_announcements_update ON iam.announcements;
CREATE POLICY p_announcements_update ON iam.announcements
  FOR UPDATE USING (
    auth.uid()::text = author_id 
    OR store_id IN (SELECT id FROM iam.stores WHERE owner_id = auth.uid()::text)
  );

-- Delete policy: author or store owner can delete
DROP POLICY IF EXISTS p_announcements_delete ON iam.announcements;
CREATE POLICY p_announcements_delete ON iam.announcements
  FOR DELETE USING (
    auth.uid()::text = author_id 
    OR store_id IN (SELECT id FROM iam.stores WHERE owner_id = auth.uid()::text)
  );

-- Public can read metrics for published announcements
DROP POLICY IF EXISTS p_announcement_metrics_select ON iam.announcement_metrics;
CREATE POLICY p_announcement_metrics_select ON iam.announcement_metrics
  FOR SELECT USING (
    announcement_id IN (SELECT id FROM iam.announcements WHERE status = 'PUBLISHED' AND deleted_at IS NULL)
  );

-- Event tracking can be inserted by anyone (including anonymous viewers)
DROP POLICY IF EXISTS p_announcement_events_insert ON iam.announcement_events;
CREATE POLICY p_announcement_events_insert ON iam.announcement_events
  FOR INSERT WITH CHECK (true);
