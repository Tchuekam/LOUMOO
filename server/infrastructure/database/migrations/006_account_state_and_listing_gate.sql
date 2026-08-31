-- ============================================================================
-- LOUMOO MIGRATION 006 — Canonical Account State, Onboarding & Listing Gate
-- ----------------------------------------------------------------------------
-- Establishes ONE canonical representation for every piece of account state
-- that authorization depends on, removes contradictory verification booleans,
-- and adds the staging tables that make listing media uploads transactionally
-- safe.
-- ============================================================================

-- ── 1. CANONICAL VERIFICATION TIMESTAMPS ────────────────────────────────────
-- Verification is represented by ONE nullable timestamp per channel.
-- `is_email_verified` / `is_phone_verified` survive only as GENERATED mirrors
-- so no writer can ever set them out of sync with the timestamp.

ALTER TABLE iam.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Backfill from the legacy booleans before they are replaced.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'iam' AND table_name = 'profiles'
      AND column_name = 'is_email_verified' AND is_generated = 'NEVER'
  ) THEN
    UPDATE iam.profiles
       SET email_verified_at = COALESCE(email_verified_at, updated_at, NOW())
     WHERE is_email_verified IS TRUE AND email_verified_at IS NULL;

    UPDATE iam.profiles
       SET phone_verified_at = COALESCE(phone_verified_at, updated_at, NOW())
     WHERE is_phone_verified IS TRUE AND phone_verified_at IS NULL;

    ALTER TABLE iam.profiles DROP COLUMN is_email_verified;
    ALTER TABLE iam.profiles DROP COLUMN is_phone_verified;

    ALTER TABLE iam.profiles
      ADD COLUMN is_email_verified BOOLEAN
        GENERATED ALWAYS AS (email_verified_at IS NOT NULL) STORED;
    ALTER TABLE iam.profiles
      ADD COLUMN is_phone_verified BOOLEAN
        GENERATED ALWAYS AS (phone_verified_at IS NOT NULL) STORED;
  END IF;
END $$;

-- ── 2. CANONICAL ONBOARDING & SELLER STATE ──────────────────────────────────
ALTER TABLE iam.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_status VARCHAR(32) NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS primary_store_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS clerk_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clerk_deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_onboarding_status') THEN
    ALTER TABLE iam.profiles ADD CONSTRAINT chk_profiles_onboarding_status
      CHECK (onboarding_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_seller_status') THEN
    ALTER TABLE iam.profiles ADD CONSTRAINT chk_profiles_seller_status
      CHECK (seller_status IN ('NONE', 'ONBOARDING', 'PENDING_VERIFICATION', 'READY', 'REJECTED'));
  END IF;
  -- An account cannot be seller-ready without having completed onboarding.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_seller_requires_onboarding') THEN
    ALTER TABLE iam.profiles ADD CONSTRAINT chk_profiles_seller_requires_onboarding
      CHECK (seller_status <> 'READY' OR onboarding_status = 'COMPLETED');
  END IF;
  -- Onboarding cannot be COMPLETED without a completion timestamp.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_onboarding_completed_at') THEN
    ALTER TABLE iam.profiles ADD CONSTRAINT chk_profiles_onboarding_completed_at
      CHECK (onboarding_status <> 'COMPLETED' OR onboarding_completed_at IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON iam.profiles(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_profiles_seller_status ON iam.profiles(seller_status);

-- ── 3. RESUMABLE, SERVER-BACKED ONBOARDING PROGRESS ─────────────────────────
-- One row per (user, step). This is what lets a user abandon onboarding on a
-- phone and resume at the exact same step on a laptop.
CREATE TABLE IF NOT EXISTS iam.onboarding_progress (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  step_key VARCHAR(48) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_onboarding_user_step UNIQUE (user_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON iam.onboarding_progress(user_id);

-- ── 4. STAGED MEDIA UPLOADS (TRANSACTIONAL SAFETY) ──────────────────────────
-- Every byte written to object storage is recorded here FIRST. A staged asset
-- that is never attached to a listing is reclaimable by the sweeper, so a
-- failed listing creation can never leave an orphaned file behind forever.
CREATE TABLE IF NOT EXISTS system.upload_sessions (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  store_id VARCHAR(64) REFERENCES iam.stores(id) ON DELETE CASCADE,
  listing_id VARCHAR(64),
  bucket VARCHAR(64) NOT NULL DEFAULT 'listing-media',
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT,
  mime_type VARCHAR(64) NOT NULL,
  detected_format VARCHAR(16) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  width INT,
  height INT,
  checksum_sha256 VARCHAR(64),
  status VARCHAR(24) NOT NULL DEFAULT 'STAGED'
    CHECK (status IN ('STAGED', 'ATTACHED', 'DISCARDED', 'ORPHANED')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  attached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_owner ON system.upload_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_listing ON system.upload_sessions(listing_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_sweep ON system.upload_sessions(status, expires_at);

-- ── 5. LISTING MEDIA PROVENANCE ─────────────────────────────────────────────
ALTER TABLE iam.listing_media
  ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(64),
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS upload_session_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS checksum_sha256 VARCHAR(64),
  ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_listing_media_listing ON iam.listing_media(listing_id);

-- ── 6. DUPLICATE-SUBMISSION DEFENCE ─────────────────────────────────────────
-- A seller must not be able to create two identical listings by double-clicking.
ALTER TABLE iam.listings
  ADD COLUMN IF NOT EXISTS creation_fingerprint VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS uq_listings_creation_fingerprint
  ON iam.listings(store_id, creation_fingerprint)
  WHERE creation_fingerprint IS NOT NULL AND deleted_at IS NULL;

-- ── 7. CONTACT VERIFICATION CHALLENGES ──────────────────────────────────────
-- Used only when LOUMOO itself owns a verification channel (currently phone,
-- when an SMS provider is configured). Codes are stored HASHED — never plain.
CREATE TABLE IF NOT EXISTS system.verification_challenges (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE CASCADE,
  channel VARCHAR(16) NOT NULL CHECK (channel IN ('email', 'phone')),
  destination VARCHAR(255) NOT NULL,
  code_hash VARCHAR(128) NOT NULL,
  attempts_remaining INT NOT NULL DEFAULT 3,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_challenges_lookup
  ON system.verification_challenges(channel, destination, consumed_at);

-- ── 8. WEBHOOK IDEMPOTENCY HARDENING ────────────────────────────────────────
-- `event_id` is already UNIQUE; add the processing columns the handler needs to
-- make retries safe and observable.
ALTER TABLE system.webhook_events
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS result JSONB;

-- ── 9. ROW LEVEL SECURITY ───────────────────────────────────────────────────
ALTER TABLE iam.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.verification_challenges ENABLE ROW LEVEL SECURITY;

-- No permissive policies are declared: these tables are reachable only through
-- the service role (the LOUMOO API), never directly from a browser client.
