-- ============================================================================
-- LOUMOO — Migration 010: Notifications feed
-- ----------------------------------------------------------------------------
-- A per-user notification feed. Rows are created server-side on real events
-- (order placed, delivery updates, …) and read by the buyer's account. The
-- backend uses the service-role client, but per-user RLS is defined so the feed
-- is safe to expose directly if ever queried with the user's own JWT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS iam.notifications (
    id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id     VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    type        VARCHAR(32) NOT NULL DEFAULT 'activity',
    tone        VARCHAR(16) NOT NULL DEFAULT 'accent'
                  CHECK (tone IN ('accent', 'success', 'sale', 'neutral')),
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON iam.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON iam.notifications(user_id) WHERE read = FALSE;

-- Row Level Security -----------------------------------------------------------
ALTER TABLE iam.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON iam.notifications;
CREATE POLICY "Users can read own notifications"
    ON iam.notifications FOR SELECT
    USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own notifications" ON iam.notifications;
CREATE POLICY "Users can update own notifications"
    ON iam.notifications FOR UPDATE
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Service role full access to notifications" ON iam.notifications;
CREATE POLICY "Service role full access to notifications"
    ON iam.notifications FOR ALL TO service_role
    USING (true) WITH CHECK (true);
