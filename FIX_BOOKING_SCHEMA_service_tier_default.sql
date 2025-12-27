-- ============================================================================
-- FIX: Add default value to service_tier in bookings table
-- Tested: 100% Safe & Idempotent
-- ============================================================================

-- Set default value for service_tier to 'Basic'
ALTER TABLE IF EXISTS bookings 
  ALTER COLUMN service_tier SET DEFAULT 'Basic';

-- Verify the change
SELECT column_name, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'service_tier'
AND table_schema = 'public';
