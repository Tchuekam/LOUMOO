-- ==============================================================================
-- LOUMOO ENTERPRISE BACKEND MIGRATION: 002_authentication_and_identity.sql
-- Description: Extends IAM Profiles, Privacy Preferences, Account Security Events,
--              Phone/Email verification state, and RLS policies for multi-tenant isolation.
-- ==============================================================================

-- 1. Extend iam.profiles with buyer, seller, onboarding, and lifecycle fields
ALTER TABLE iam.profiles
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32),
  ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS city VARCHAR(64) DEFAULT 'Douala',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS buyer_interests JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shopping_priorities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seller_type VARCHAR(32) DEFAULT 'individual' CHECK (seller_type IN ('individual', 'pro', 'service')),
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_niu_number VARCHAR(64),
  ADD COLUMN IF NOT EXISTS rccm_number VARCHAR(64),
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS kyc_doc_type VARCHAR(32),
  ADD COLUMN IF NOT EXISTS kyc_doc_status VARCHAR(32) DEFAULT 'pending' CHECK (kyc_doc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(32) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deletion_requested', 'anonymized')),
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on phone_number for rapid lookup and OTP verification
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON iam.profiles (phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON iam.profiles (account_status);

-- 2. Create system.privacy_preferences table
CREATE TABLE IF NOT EXISTS system.privacy_preferences (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES iam.profiles(id) ON DELETE CASCADE UNIQUE,
  analytics_consent BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  personalized_recommendations BOOLEAN DEFAULT TRUE,
  profile_visibility VARCHAR(32) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'contacts_only', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_user_id ON system.privacy_preferences (user_id);

-- 3. Create system.account_security_events table
CREATE TABLE IF NOT EXISTS system.account_security_events (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) REFERENCES iam.profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL, -- 'signup', 'signin', 'otp_requested', 'otp_verified', 'password_reset_requested', 'session_revoked', 'deletion_requested', 'account_anonymized'
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_events_user_id ON system.account_security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON system.account_security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_created ON system.account_security_events (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE system.privacy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.account_security_events ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies
-- Users can view and update only their own privacy preferences
DROP POLICY IF EXISTS "Users can manage own privacy preferences" ON system.privacy_preferences;
CREATE POLICY "Users can manage own privacy preferences"
  ON system.privacy_preferences
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Users can view their own security audit events
DROP POLICY IF EXISTS "Users can view own security events" ON system.account_security_events;
CREATE POLICY "Users can view own security events"
  ON system.account_security_events
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to privacy preferences" ON system.privacy_preferences;
CREATE POLICY "Service role full access to privacy preferences"
  ON system.privacy_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to security events" ON system.account_security_events;
CREATE POLICY "Service role full access to security events"
  ON system.account_security_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
