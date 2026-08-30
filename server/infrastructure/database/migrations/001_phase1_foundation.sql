-- ═══════════════════════════════════════════════════════════════════════════════
-- LOUMOO ENTERPRISE FOUNDATION MIGRATION (Phase 1)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Create Core Schemas ──
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS system;

-- ── 2. IAM Profiles (Clerk Identity Mapping) ──
CREATE TABLE IF NOT EXISTS iam.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(128) NOT NULL UNIQUE,
    phone_number VARCHAR(30),
    email VARCHAR(255),
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    avatar_url TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Douala',
    primary_role VARCHAR(30) NOT NULL DEFAULT 'customer',
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'deactivated'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_clerk ON iam.profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON iam.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON iam.profiles(email);

-- ── 3. Roles & Permissions (RBAC) ──
CREATE TABLE IF NOT EXISTS iam.roles (
    id VARCHAR(30) PRIMARY KEY,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO iam.roles (id, description, permissions) VALUES
('customer', 'Standard Buyer & App User', '["product:read", "cart:manage", "order:create", "order:read_own", "chat:use"]'::jsonb),
('seller', 'Storefront Merchant & Listing Owner', '["product:create", "product:update_own", "order:manage_own", "payout:request", "seller:profile"]'::jsonb),
('seller_staff', 'Storefront Delegate', '["product:update_own", "order:view_own", "chat:reply_own"]'::jsonb),
('moderator', 'Trust & Safety Moderator', '["listing:review", "chat:moderate", "announcement:approve"]'::jsonb),
('admin', 'Operations & Catalog Administrator', '["*"]'::jsonb),
('super_admin', 'Full Platform Root', '["*"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS iam.user_roles (
    user_id UUID NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    role_id VARCHAR(30) NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES iam.profiles(id),
    PRIMARY KEY (user_id, role_id)
);

-- ── 4. System Audit Logs ──
CREATE TABLE IF NOT EXISTS system.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES iam.profiles(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    diff JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON system.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON system.audit_logs(resource_type, resource_id);

-- ── 5. Transactional Outbox Events ──
CREATE TABLE IF NOT EXISTS system.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON system.outbox_events(status, created_at ASC);

-- ── 6. Idempotency Keys ──
CREATE TABLE IF NOT EXISTS system.idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES iam.profiles(id),
    route VARCHAR(255) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT,
    response_body JSONB,
    locked_until TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expiry ON system.idempotency_keys(expires_at);

-- ── 7. Webhook Events Ledger ──
CREATE TABLE IF NOT EXISTS system.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL, -- 'clerk', 'resend', 'momo', 'orange_money'
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED', -- 'RECEIVED', 'PROCESSED', 'FAILED'
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_source_status ON system.webhook_events(source, status);

-- ── 8. Dynamic Feature Flags ──
CREATE TABLE IF NOT EXISTS system.feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system.feature_flags (key, description, is_enabled) VALUES
('black_freeday_active', 'Enables Black FreeDay live claim timers & badges', true),
('voice_notes_enabled', 'Enables ElevenLabs / interactive waveform audio', true),
('maritime_tracking', 'Enables AISStream live vessel tracking on Port of Douala', true)
ON CONFLICT (key) DO NOTHING;

-- ── 9. Row Level Security (RLS) Policies ──
ALTER TABLE iam.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow public read of feature flags
CREATE POLICY "Public read for feature flags" ON system.feature_flags
    FOR SELECT USING (true);

-- Ensure service role has full bypass for backend operations
-- (By default in Supabase, service role bypasses RLS)
