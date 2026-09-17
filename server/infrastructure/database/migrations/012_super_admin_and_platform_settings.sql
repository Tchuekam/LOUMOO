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
