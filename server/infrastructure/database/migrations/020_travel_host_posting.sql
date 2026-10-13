-- ============================================================================
-- LOUMOO Migration 020 — Travel host posting (durable hotel/stay offers)
-- ----------------------------------------------------------------------------
-- Until now a hotel profile created through the API lived only in the Travel
-- module's in-memory store (see TravelRepository.createHotel). This migration
-- makes a host-posted stay durable so it survives restarts and shows in the
-- Travel vertical in production, and records the fields the publishing studio's
-- STAY intent collects:
--   * owner_id          — the account that posted/claimed the property
--   * property_type     — HOTEL / GUEST_HOUSE / SERVICED_APARTMENT / …
--   * star_label        — e.g. "4-star" (distinct from the guest rating)
--   * virtual_tour_url  — optional external 360°/virtual-tour link
--   * spaces            — named virtual-tour spaces (lobby, pool, suite, …)
--   * contact           — phone / whatsapp / check-in / check-out / house rules
--   * payment_methods   — accepted payment methods
--
-- All columns are additive and nullable/defaulted, so applying this migration
-- never rewrites existing hotel rows. A posted stay is INACTIVE (hidden from the
-- public Travel feed) until the host publishes it, which flips it to ACTIVE —
-- the existing iam.hotels status enum already carries both, so no enum change.
-- Writes go through the service-role client, which bypasses RLS; the existing
-- "Public read hotels" policy continues to expose only published rows because
-- the read path filters status = 'ACTIVE'.
-- ============================================================================

ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS owner_id         VARCHAR(64);
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS property_type    VARCHAR(32) NOT NULL DEFAULT 'HOTEL';
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS star_label       VARCHAR(32) NOT NULL DEFAULT '';
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT        NOT NULL DEFAULT '';
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS spaces           JSONB       NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS contact          JSONB       NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS payment_methods  JSONB       NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE iam.hotels ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- A host browses and manages their own properties; index that lookup.
CREATE INDEX IF NOT EXISTS idx_hotels_owner ON iam.hotels(owner_id) WHERE owner_id IS NOT NULL;

-- The public Travel feed reads published stays; make that filter cheap.
CREATE INDEX IF NOT EXISTS idx_hotels_status ON iam.hotels(status);

-- A self-serve host gets one provider row (type 'hotel') the first time they
-- post. verification_status keeps its table default; the host's verification is
-- a trust signal, not a gate on posting ("boutique but no activation").
-- rooms already carries a virtual_tour_url via the Room domain; add the column
-- so a per-room immersive tour round-trips durably too.
ALTER TABLE iam.rooms  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT NOT NULL DEFAULT '';
ALTER TABLE iam.rooms  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();
