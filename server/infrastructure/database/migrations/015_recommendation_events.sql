-- ============================================================================
-- LOUMOO — Migration 015: Recommendation events & learned profiles
-- ----------------------------------------------------------------------------
-- The data layer for the Discovery Engine (docs/RECOMMENDATION_ENGINE.md).
--
--   iam.recommendation_events    append-only interaction log (impression, dwell,
--                                click, save, cart, purchase, search, feedback).
--                                Keyed by subject_id = profiles.id for signed-in
--                                users, or an anonymous visitor id for guests, so
--                                a guest's taste survives until they sign in and
--                                is then stitched onto their account.
--   iam.recommendation_profiles  one derived, time-decayed preference vector per
--                                subject (short-term + long-term facet weights),
--                                rebuilt incrementally from the events.
--
-- The backend is the only reader/writer (service-role client). RLS is enabled
-- with a service-role policy ONLY: raw behavioural logs must never be reachable
-- with an end-user JWT, and the API layer decides what a user may see about
-- their own profile (the "Why am I seeing this?" surface).
--
-- Resilience: the module works before this migration is applied by falling back
-- to a per-process in-memory store (see RecommendationRepository). Applying this
-- migration turns on durable, cross-device, cross-instance personalization with
-- no code change.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Events ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iam.recommendation_events (
    id            BIGSERIAL PRIMARY KEY,
    -- profiles.id for a signed-in user, else the client's anonymous visitor id.
    subject_id    VARCHAR(80) NOT NULL,
    -- 'user' or 'visitor' — lets stitching find the guest rows to re-key.
    subject_kind  VARCHAR(16) NOT NULL DEFAULT 'visitor'
                    CHECK (subject_kind IN ('user', 'visitor')),
    -- Set once a guest signs in, so a visitor event can be attributed later
    -- without a destructive re-key.
    user_id       VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE CASCADE,
    event_type    VARCHAR(24) NOT NULL
                    CHECK (event_type IN (
                      'impression', 'dwell', 'click', 'view', 'search',
                      'save', 'unsave', 'add_to_cart', 'remove_from_cart',
                      'purchase', 'contact_seller', 'follow_store',
                      'not_interested', 'hide_store'
                    )),
    item_id       VARCHAR(80),
    -- Denormalised item facets, captured at event time, so scoring never has to
    -- re-load the catalogue and a renamed/removed item still carries its signal.
    category      VARCHAR(64),
    subcategory   VARCHAR(64),
    brand         VARCHAR(80),
    store_name    VARCHAR(160),
    price_xaf     BIGINT,
    city          VARCHAR(80),
    -- dwell_ms, position, surface, query tokens, etc.
    metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reco_events_subject
    ON iam.recommendation_events(subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reco_events_user
    ON iam.recommendation_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reco_events_item
    ON iam.recommendation_events(item_id, created_at DESC) WHERE item_id IS NOT NULL;
-- Trending is "distinct subjects per item in a recent window"; this index serves it.
CREATE INDEX IF NOT EXISTS idx_reco_events_type_time
    ON iam.recommendation_events(event_type, created_at DESC);

-- 2. Derived profiles -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS iam.recommendation_profiles (
    subject_id    VARCHAR(80) PRIMARY KEY,
    subject_kind  VARCHAR(16) NOT NULL DEFAULT 'visitor'
                    CHECK (subject_kind IN ('user', 'visitor')),
    user_id       VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE CASCADE,
    -- Facet -> weight, split into the two clocks. Each stored alongside the
    -- timestamp it was last decayed to, so a read can lazily re-decay to "now".
    short_term    JSONB NOT NULL DEFAULT '{}'::jsonb,
    long_term     JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Hard controls: item ids marked not-interested, store names hidden.
    suppressed    JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Ordered list of the subject's most recent item views (co-visitation seed,
    -- "pick up where you left off"). Capped by the service.
    recent_items  JSONB NOT NULL DEFAULT '[]'::jsonb,
    event_count   INTEGER NOT NULL DEFAULT 0,
    decayed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reco_profiles_user
    ON iam.recommendation_profiles(user_id) WHERE user_id IS NOT NULL;

-- Row Level Security -----------------------------------------------------------
ALTER TABLE iam.recommendation_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.recommendation_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to reco events" ON iam.recommendation_events;
CREATE POLICY "Service role full access to reco events"
    ON iam.recommendation_events FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to reco profiles" ON iam.recommendation_profiles;
CREATE POLICY "Service role full access to reco profiles"
    ON iam.recommendation_profiles FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Grants ------------------------------------------------------------------------
GRANT ALL ON iam.recommendation_events   TO service_role;
GRANT ALL ON iam.recommendation_profiles TO service_role;

-- BIGSERIAL in schema iam needs an explicit sequence grant or inserts fail 42501.
DO $$
BEGIN
  EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE '
    || pg_get_serial_sequence('iam.recommendation_events', 'id') || ' TO service_role';
EXCEPTION WHEN OTHERS THEN
  -- Sequence may not exist on a re-run against an older row shape; ignore.
  NULL;
END $$;
