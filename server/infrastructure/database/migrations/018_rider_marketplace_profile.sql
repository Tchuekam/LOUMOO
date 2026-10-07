-- ============================================================================
-- LOUMOO — Migration 018: Rider marketplace profile
-- ----------------------------------------------------------------------------
-- Until now a rider (iam.delivery_drivers, migration 013) was an admin record:
-- a name, a phone and an active/suspended flag. The marketplace lets a BUYER see
-- and prefer a provider at checkout, so a rider needs the public, choosable
-- attributes a buyer compares: a photo, a vehicle, the areas they serve, their
-- own delivery tariff, and a reputation.
--
-- What is stored here, and what is NOT:
--   * stored: the attributes a rider/agency sets about themselves, plus a
--     reputation (rating_avg/rating_count) a future review flow will maintain.
--   * derived, never stored: "completed deliveries" is a COUNT over iam.deliveries
--     (status = 'delivered'), so it can never drift from the truth. The API
--     computes it; there is no column for it.
--
-- organization_id links a rider to an agency (iam.organizations, org_type
-- 'AGENCY'). Added now, nullable, so agencies — which come right after riders —
-- need no second migration; is_agency marks a provider row that IS an agency.
--
-- Idempotent: every ADD COLUMN is IF NOT EXISTS; safe to re-run.
-- ============================================================================

ALTER TABLE iam.delivery_drivers
    ADD COLUMN IF NOT EXISTS photo_url       TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_type    VARCHAR(24),
    -- Cities the rider serves, lowercased, e.g. ["douala","yaounde"]. Empty means
    -- "no stated limit" (serves anywhere), which is how an un-configured rider
    -- behaves, so existing riders keep working.
    ADD COLUMN IF NOT EXISTS service_areas   JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- The rider's own flat delivery tariff in whole XAF. NULL means "use the
    -- platform's standard city rate", so a rider who has set no price still quotes.
    ADD COLUMN IF NOT EXISTS base_fee_xaf    INTEGER,
    ADD COLUMN IF NOT EXISTS rating_avg      NUMERIC(2, 1),
    ADD COLUMN IF NOT EXISTS rating_count    INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_agency       BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64);

-- Constraints are added separately so a re-run on a table that already has the
-- columns still reaches them. Each is guarded: ADD CONSTRAINT is not idempotent
-- on its own, so it is wrapped to ignore "already exists".
DO $$
BEGIN
    BEGIN
        ALTER TABLE iam.delivery_drivers
            ADD CONSTRAINT chk_delivery_drivers_vehicle_type
            CHECK (vehicle_type IS NULL OR vehicle_type IN
                   ('motorbike', 'bicycle', 'car', 'van', 'tricycle', 'on_foot'));
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER TABLE iam.delivery_drivers
            ADD CONSTRAINT chk_delivery_drivers_base_fee
            CHECK (base_fee_xaf IS NULL OR base_fee_xaf >= 0);
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER TABLE iam.delivery_drivers
            ADD CONSTRAINT chk_delivery_drivers_rating_avg
            CHECK (rating_avg IS NULL OR (rating_avg >= 0 AND rating_avg <= 5));
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER TABLE iam.delivery_drivers
            ADD CONSTRAINT chk_delivery_drivers_rating_count
            CHECK (rating_count >= 0);
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER TABLE iam.delivery_drivers
            ADD CONSTRAINT fk_delivery_drivers_organization
            FOREIGN KEY (organization_id) REFERENCES iam.organizations(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- A buyer at checkout asks "who serves my city?". A GIN index makes the
-- JSONB containment test (service_areas @> '["douala"]') fast once there are
-- many riders; harmless while there are few.
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_service_areas
    ON iam.delivery_drivers USING GIN (service_areas);

CREATE INDEX IF NOT EXISTS idx_delivery_drivers_organization
    ON iam.delivery_drivers(organization_id)
    WHERE organization_id IS NOT NULL;
