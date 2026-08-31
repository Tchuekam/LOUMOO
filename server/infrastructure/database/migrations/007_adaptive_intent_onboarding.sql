-- ==============================================================================
-- LOUMOO ENTERPRISE BACKEND MIGRATION: 007_adaptive_intent_onboarding.sql
-- Description: Adaptive questionnaire engine persistence — answers, structured
--              intent signals (declared vs inferred), goals, and actionable
--              user missions. Extends the identity system; does NOT replace it.
--
-- Abstraction chain:  Question -> Answer -> Intent -> Goal -> Mission
--                      -> Profile -> Personalization
-- ==============================================================================

-- ── 1. ADAPTIVE QUESTIONNAIRE ANSWERS ─────────────────────────────────────────
-- One row per (user, question_key). The adaptive engine's questions are NOT the
-- identity onboarding steps: they are dynamic (the next question depends on the
-- previous answer) and most accept free text. `raw_text` preserves exactly what
-- the user wrote; `value` holds the structured answer (chips/choices/extracted).
CREATE TABLE IF NOT EXISTS iam.onboarding_answers (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  question_key VARCHAR(48) NOT NULL,
  phase VARCHAR(32) NOT NULL DEFAULT 'intent',
  raw_text TEXT,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- declared = the user picked/chose it; inferred = extracted from free text
  source VARCHAR(16) NOT NULL DEFAULT 'declared'
    CHECK (source IN ('declared', 'inferred', 'derived')),
  skipped BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_onboarding_answers_user_question UNIQUE (user_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user
  ON iam.onboarding_answers(user_id, answered_at DESC);

-- ── 2. STRUCTURED INTENT SIGNALS (DECLARED + INFERRED) ────────────────────────
-- The personalization substrate. Every signal carries confidence and provenance
-- so the platform can distinguish what the user SAID from what the system
-- INFERRED, and never over-personalizes from a single weak signal.
-- signal_type: intent | category | use_case | context | priority | constraint |
--              goal | behavior
CREATE TABLE IF NOT EXISTS iam.user_intent_signals (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  signal_type VARCHAR(32) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(16) NOT NULL DEFAULT 'declared'
    CHECK (source IN ('declared', 'inferred', 'derived')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  -- provenance: { origin: 'question:GOAL' | 'behavior:saved_item' | 'model:gpt-4o-mini', ... }
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_signals_user ON iam.user_intent_signals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_user_type ON iam.user_intent_signals(user_id, signal_type);

-- ── 3. USER GOALS ─────────────────────────────────────────────────────────────
-- What the user wants to accomplish (buy a laptop, grow a clothing business...).
-- Goals are derived from answers and signals; a goal can be achieved or
-- abandoned and replaced — users can always change their goal.
CREATE TABLE IF NOT EXISTS iam.user_goals (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  goal_type VARCHAR(32) NOT NULL DEFAULT 'purchase'
    CHECK (goal_type IN ('purchase', 'sell', 'growth', 'travel', 'service', 'explore')),
  status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'achieved', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  achieved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user ON iam.user_goals(user_id, created_at DESC);

-- ── 4. ACTIONABLE USER MISSIONS ───────────────────────────────────────────────
-- Onboarding produces a MISSION: a concrete, actionable objective that
-- personalizes the homepage, recommendations and suggested actions.
--   "Find a laptop for university" / "Start selling online" /
--   "Get my first customers" / "Grow my clothing business"
-- At most ONE active mission per user (partial unique index).
CREATE TABLE IF NOT EXISTS iam.user_missions (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mission_type VARCHAR(32) NOT NULL DEFAULT 'purchase'
    CHECK (mission_type IN ('purchase', 'sell', 'growth', 'travel', 'service', 'explore')),
  status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  source VARCHAR(16) NOT NULL DEFAULT 'onboarding'
    CHECK (source IN ('onboarding', 'derived', 'manual')),
  suggested_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user ON iam.user_missions(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_mission_per_user
  ON iam.user_missions(user_id) WHERE status = 'active';

-- ── 5. PROFILE: ADAPTIVE ONBOARDING LIFECYCLE ──────────────────────────────────
ALTER TABLE iam.profiles
  ADD COLUMN IF NOT EXISTS adaptive_status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS adaptive_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS adaptive_completed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_adaptive_status') THEN
    ALTER TABLE iam.profiles ADD CONSTRAINT chk_profiles_adaptive_status
      CHECK (adaptive_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_adaptive_completed_at') THEN
    ALTER TABLE iam.profiles ADD CONSTRAINT chk_profiles_adaptive_completed_at
      CHECK (adaptive_status <> 'COMPLETED' OR adaptive_completed_at IS NOT NULL);
  END IF;
END $$;

-- ── 6. ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE iam.onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_intent_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_missions ENABLE ROW LEVEL SECURITY;

-- No permissive policies are declared: these tables are reachable only through
-- the service role (the LOUMOO API), never directly from a browser client —
-- the same policy as onboarding_progress.
