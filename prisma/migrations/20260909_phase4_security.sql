-- Phase 4 Security Migration
-- Adds: Data integrity constraints, indexes for performance, security audit improvements

-- Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON malam_suya.admin_accounts(email);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_role ON malam_suya.admin_accounts(role);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_lockout ON malam_suya.admin_accounts(lockout_until);

-- Add indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status ON malam_suya.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON malam_suya.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON malam_suya.bookings(customer_email);

-- Add indexes for meals
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON malam_suya.meals(created_at);
CREATE INDEX IF NOT EXISTS idx_meals_available ON malam_suya.meals(is_available);

-- Add indexes for login attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON malam_suya.login_attempts(ip_address);

-- Add constraint to prevent invalid data
ALTER TABLE IF EXISTS malam_suya.admin_accounts
ADD CONSTRAINT email_valid CHECK (email ~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}$'),
ADD CONSTRAINT valid_role CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR'));

-- Create materialized view for security analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS malam_suya.security_analytics AS
SELECT 
  DATE(timestamp) as event_date,
  event_type,
  severity,
  COUNT(*) as event_count
FROM malam_suya.security_events
GROUP BY DATE(timestamp), event_type, severity;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_security_analytics_date ON malam_suya.security_analytics(event_date);

-- Add function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp trigger to admin_accounts
DROP TRIGGER IF EXISTS update_admin_accounts_timestamp ON malam_suya.admin_accounts;
CREATE TRIGGER update_admin_accounts_timestamp
BEFORE UPDATE ON malam_suya.admin_accounts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Apply timestamp trigger to meals
DROP TRIGGER IF EXISTS update_meals_timestamp ON malam_suya.meals;
CREATE TRIGGER update_meals_timestamp
BEFORE UPDATE ON malam_suya.meals
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Add function to automatically delete old security events (30 day retention)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM malam_suya.security_events 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  DELETE FROM malam_suya.login_attempts 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  DELETE FROM malam_suya.audit_log 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';
