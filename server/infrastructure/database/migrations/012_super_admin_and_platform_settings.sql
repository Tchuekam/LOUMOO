-- Migration 012: Super Admin Platform Settings & Audit Trail
-- Part 1: System Settings Schema Definition

CREATE SCHEMA IF NOT EXISTS iam;

CREATE TABLE IF NOT EXISTS iam.system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by VARCHAR(128),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE iam.system_settings ENABLE ROW LEVEL SECURITY;

-- Part 2: Seed Core Dynamic Configuration
INSERT INTO iam.system_settings (key, value, description, is_public)
VALUES 
    ('platform_commission_rate', '{"rate_percent": 5.0, "payout_fee_fixed_xaf": 3000}'::jsonb, 'Default platform commission and fixed escrow protection fee', true),
    ('seller_whatsapp_default', '{"number": "237690123456", "channel": "whatsapp"}'::jsonb, 'Default merchant communication hotline fallback', true),
    ('maintenance_mode', '{"enabled": false, "banner_text": "Maintenance programmée en cours"}'::jsonb, 'Platform maintenance mode toggle', true),
    ('announcement_banner', '{"enabled": true, "text_fr": "Livraison express offerte dès 50 000 XAF d''achats sur LOUMOO !"}'::jsonb, 'Global broadcast banner', true)
ON CONFLICT (key) DO NOTHING;

-- Part 3: Tamper-Evident Audit Logs Table
CREATE TABLE IF NOT EXISTS iam.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON iam.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON iam.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON iam.audit_logs(created_at DESC);
