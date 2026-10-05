-- ============================================================================
-- LOUMOO — Migration 017: Rider presence
-- ----------------------------------------------------------------------------
-- A rider in iam.delivery_drivers EXISTS; this table says whether they are HERE.
-- One row per rider, overwritten in place:
--
--   status        offline | online | busy | paused
--   latitude /    the rider's last reported availability position (null when
--   longitude /   they never shared one, or while offline or paused)
--   accuracy
--   last_seen_at  the last heartbeat (POST /deliveries/driver/presence/heartbeat);
--                 a rider whose last_seen_at is older than the TTL
--                 (RIDER_PRESENCE_TTL_SECONDS, default 120) is offline whatever
--                 `status` says
--   updated_at    the last write to the row
--
-- `suspended` is deliberately NOT a stored status. It is the rider's account
-- standing (iam.delivery_drivers.status), read when asking, so a suspension
-- applied anywhere wins over this row and can never be undone by it.
--
-- This is the rider's LIVE availability, not a trail. It is kept apart from
-- iam.driver_locations on purpose: that table is the GPS history of one
-- delivery (kept for disputes, pruned on a schedule), this is one mutable row
-- per rider that only the rider's own device may move, and nothing here is
-- history. Posting a delivery location never touches it, and a heartbeat never
-- writes a delivery location.
--
-- The backend is the only reader/writer (service-role client), exactly like the
-- delivery tables in migration 013. RLS is on with a service-role policy ONLY.
--
-- Idempotent: safe to re-run. Riders registered before this migration simply
-- have no row yet, which reads as offline until they go online.
-- ============================================================================

CREATE TABLE IF NOT EXISTS iam.rider_presence (
    rider_id      VARCHAR(64) PRIMARY KEY
                    REFERENCES iam.delivery_drivers(profile_id) ON DELETE CASCADE,
    status        VARCHAR(16) NOT NULL DEFAULT 'offline'
                    CHECK (status IN ('offline', 'online', 'busy', 'paused')),
    latitude      DOUBLE PRECISION CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    longitude     DOUBLE PRECISION CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    -- Metres, as reported by the device.
    accuracy      DOUBLE PRECISION CHECK (accuracy IS NULL OR accuracy >= 0),
    last_seen_at  TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- A position is a pair: never a latitude on its own.
    CONSTRAINT rider_presence_position_pair
        CHECK ((latitude IS NULL) = (longitude IS NULL))
);

-- The two scans the server makes over the whole table: "who is online and fresh"
-- (ranking riders for an offer) and "who is online and stale" (the sweeper that
-- sets silent riders offline). Both only care about online rows.
CREATE INDEX IF NOT EXISTS idx_rider_presence_online_seen
    ON iam.rider_presence(last_seen_at)
    WHERE status = 'online';

ALTER TABLE iam.rider_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to rider_presence" ON iam.rider_presence;
CREATE POLICY "Service role full access to rider_presence"
    ON iam.rider_presence FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- A policy is not a GRANT (see the note at the end of migration 013). No sequence
-- here: the key is the rider's profile id.
GRANT ALL ON iam.rider_presence TO service_role;

NOTIFY pgrst, 'reload schema';
