-- ==============================================================================
-- LOUMOO ENTERPRISE BACKEND MIGRATION: 012_super_admin_and_platform_settings.sql
-- Description: Creates Dynamic System Settings and Immutable Audit Logs tables
--              for zero-code operational management and super administrative control.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS iam;

-- 1. DYNAMIC SYSTEM SETTINGS (Key-Value + JSONB Store)
CREATE TABLE IF NOT EXISTS iam.system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    category VARCHAR(64) NOT NULL DEFAULT 'general', -- 'general', 'commercial', 'financial', 'operational', 'notifications', 'feature_flags'
    description TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON iam.system_settings(category);

-- 2. IMMUTABLE ADMINISTRATIVE AUDIT LOGS
CREATE TABLE IF NOT EXISTS iam.audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL, -- 'store.verify', 'store.suspend', 'user.role_change', 'listing.moderate', 'escrow.release', 'config.update'
    resource_type VARCHAR(64) NOT NULL, -- 'store', 'user', 'listing', 'order', 'system_setting'
    resource_id VARCHAR(64) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON iam.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON iam.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON iam.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON iam.audit_logs(created_at DESC);

-- 3. SEED DEFAULT PLATFORM CONFIGURATIONS (Zero-Code Foundation)
INSERT INTO iam.system_settings (key, value, category, description, is_secret)
VALUES
    (
        'platform_commission_rate',
        '{"rate_percent": 5.0, "payout_fee_fixed_xaf": 150, "escrow_hold_days": 3, "category_rates": {"electronics": 5.0, "fashion": 8.0, "services": 10.0, "travel": 7.5}}'::jsonb,
        'financial',
        'Global platform commission percentages, escrow hold periods, and payout fees.',
        false
    ),
    (
        'seller_whatsapp_default',
        '{"number": "237690123456", "label": "LOUMOO Central Merchant & Client Care", "fallback_message": "Hello LOUMOO Support! I am contacting you regarding an order."}'::jsonb,
        'commercial',
        'Default platform WhatsApp hotline when a merchant has not configured a custom phone number.',
        false
    ),
    (
        'maintenance_mode',
        '{"enabled": false, "banner_text": "LOUMOO platform upgrade in progress. Order processing remains active.", "allow_admin_bypass": true}'::jsonb,
        'operational',
        'Emergency maintenance kill-switch and user-facing broadcast announcement.',
        false
    ),
    (
        'announcement_banner',
        '{"active": true, "message": "Bienvenue sur LOUMOO! Expédition express sécurisée partout à Douala et Yaoundé.", "badge": "NOUVEAU", "cta_text": "Découvrir les boutiques", "cta_url": "/stores"}'::jsonb,
        'general',
        'Global banner displayed on top of marketplace screens.',
        false
    ),
    (
        'shipping_rates_by_city',
        '{"Douala": 1000, "Yaounde": 1500, "Bafoussam": 2500, "Kribi": 2500, "Bamenda": 3000, "Garoua": 4000, "Maroua": 4500}'::jsonb,
        'operational',
        'Base regional delivery fees in XAF for Cameroon delivery zones.',
        false
    ),
    (
        'feature_flags',
        '{"travel_enabled": true, "visual_search_enabled": true, "escrow_enabled": true, "ai_assistant_enabled": true, "crypto_payments_enabled": false}'::jsonb,
        'feature_flags',
        'Runtime feature flags toggleable without server restart.',
        false
    )
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. ROW LEVEL SECURITY
ALTER TABLE iam.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read for non-secret system settings
CREATE POLICY system_settings_read_public ON iam.system_settings
    FOR SELECT
    USING (is_secret = false);

-- Admin full access on system settings
CREATE POLICY system_settings_admin_all ON iam.system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM iam.profiles
            WHERE iam.profiles.id = auth.uid()::text
            AND iam.profiles.primary_role IN ('admin', 'super_admin')
        )
    );

-- Admin read on audit logs
CREATE POLICY audit_logs_admin_select ON iam.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM iam.profiles
            WHERE iam.profiles.id = auth.uid()::text
            AND iam.profiles.primary_role IN ('admin', 'super_admin')
        )
    );
