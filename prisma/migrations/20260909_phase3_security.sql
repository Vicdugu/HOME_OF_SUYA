-- Phase 3 Security Migration
-- Adds: Account lockout tracking, login history, role-based access control, MFA support

-- Add missing fields to admin_accounts if not exists
ALTER TABLE IF EXISTS malam_suya.admin_accounts
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ADMIN',
ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB,
ADD COLUMN IF NOT EXISTS mfa_locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Create login_attempts tracking table
CREATE TABLE IF NOT EXISTS malam_suya.login_attempts (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES malam_suya.admin_accounts(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_admin_id FOREIGN KEY (admin_id) REFERENCES malam_suya.admin_accounts(id) ON DELETE CASCADE
);

-- Create index for faster queries on login attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_admin_id ON malam_suya.login_attempts(admin_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON malam_suya.login_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_admin_timestamp ON malam_suya.login_attempts(admin_id, timestamp);

-- Create audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS malam_suya.audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES malam_suya.admin_accounts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_audit_admin_id FOREIGN KEY (admin_id) REFERENCES malam_suya.admin_accounts(id) ON DELETE CASCADE
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON malam_suya.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON malam_suya.audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON malam_suya.audit_log(action);

-- Add security event logging
CREATE TABLE IF NOT EXISTS malam_suya.security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'LOGIN_FAILURE', 'ACCOUNT_LOCKED', 'MFA_DISABLED', etc
  admin_id TEXT REFERENCES malam_suya.admin_accounts(id) ON DELETE CASCADE,
  ip_address TEXT,
  description TEXT,
  severity TEXT DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_security_admin_id FOREIGN KEY (admin_id) REFERENCES malam_suya.admin_accounts(id) ON DELETE CASCADE
);

-- Create index for security events
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON malam_suya.security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON malam_suya.security_events(severity);
