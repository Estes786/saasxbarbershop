-- ========================================
-- FIX SQL FUNCTION - IMMUTABLE ERROR
-- ========================================
-- Run this in Supabase SQL Editor to fix the IMMUTABLE function error
-- This fixes: ERROR 42897: functions in index predicate must be marked IMMUTABLE
-- ========================================

-- Step 1: Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Recreate function with STABLE marking
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 3: Recreate all triggers that use this function
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON barbershop_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON barbershop_customers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_updated_at ON barbershop_analytics_daily;
CREATE TRIGGER update_analytics_updated_at 
  BEFORE UPDATE ON barbershop_analytics_daily
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON barbershop_actionable_leads;
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON barbershop_actionable_leads
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_updated_at ON barbershop_campaign_tracking;
CREATE TRIGGER update_campaign_updated_at 
  BEFORE UPDATE ON barbershop_campaign_tracking
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Verify
SELECT proname, provolatile 
FROM pg_proc 
WHERE proname = 'update_updated_at_column';
-- Expected result: provolatile should be 's' (STABLE)

-- ========================================
-- DEPLOYMENT COMPLETE ✅
-- ========================================
