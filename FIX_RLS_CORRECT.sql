-- ========================================
-- CORRECT RLS FIX - Based on Actual Schema
-- Fix untuk error: "new row violates row-level security policy"
-- ========================================

-- ========================================
-- 1. USER_PROFILES TABLE
-- ========================================

ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role_all" ON user_profiles;

-- Create new policies
CREATE POLICY "user_profiles_select_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
ON user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_service_role_all"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 2. BARBERSHOP_CUSTOMERS TABLE
-- Note: This table doesn't have user_id column
-- It's analytics data based on phone numbers
-- ========================================

ALTER TABLE IF EXISTS barbershop_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON barbershop_customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON barbershop_customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON barbershop_customers;
DROP POLICY IF EXISTS "Service role has full access" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_select_own" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_insert_own" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_update_own" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_service_role_all" ON barbershop_customers;

-- Allow all authenticated users to read customer analytics
CREATE POLICY "customers_select_all"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert/update customer data
CREATE POLICY "customers_insert_all"
ON barbershop_customers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "customers_update_all"
ON barbershop_customers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "customers_service_role_all"
ON barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 3. BARBERSHOP_TRANSACTIONS TABLE
-- ========================================

ALTER TABLE IF EXISTS barbershop_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "transactions_select_all" ON barbershop_transactions;
DROP POLICY IF EXISTS "transactions_insert_authenticated" ON barbershop_transactions;
DROP POLICY IF EXISTS "transactions_service_role_all" ON barbershop_transactions;

-- Create policies
CREATE POLICY "transactions_select_all"
ON barbershop_transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "transactions_insert_authenticated"
ON barbershop_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "transactions_update_authenticated"
ON barbershop_transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "transactions_service_role_all"
ON barbershop_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 4. BARBERSHOP_ANALYTICS_DAILY TABLE
-- ========================================

ALTER TABLE IF EXISTS barbershop_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "analytics_select_all" ON barbershop_analytics_daily;
DROP POLICY IF EXISTS "analytics_service_role_all" ON barbershop_analytics_daily;

-- Create policies
CREATE POLICY "analytics_select_all"
ON barbershop_analytics_daily
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "analytics_insert_authenticated"
ON barbershop_analytics_daily
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "analytics_update_authenticated"
ON barbershop_analytics_daily
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "analytics_service_role_all"
ON barbershop_analytics_daily
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 5. BARBERSHOP_ACTIONABLE_LEADS TABLE
-- ========================================

ALTER TABLE IF EXISTS barbershop_actionable_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "leads_select_all" ON barbershop_actionable_leads;
DROP POLICY IF EXISTS "leads_service_role_all" ON barbershop_actionable_leads;

-- Create policies
CREATE POLICY "leads_select_all"
ON barbershop_actionable_leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "leads_insert_authenticated"
ON barbershop_actionable_leads
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "leads_update_authenticated"
ON barbershop_actionable_leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "leads_service_role_all"
ON barbershop_actionable_leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 6. BARBERSHOP_CAMPAIGN_TRACKING TABLE
-- ========================================

ALTER TABLE IF EXISTS barbershop_campaign_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "campaigns_select_all" ON barbershop_campaign_tracking;
DROP POLICY IF EXISTS "campaigns_service_role_all" ON barbershop_campaign_tracking;

-- Create policies
CREATE POLICY "campaigns_select_all"
ON barbershop_campaign_tracking
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "campaigns_insert_authenticated"
ON barbershop_campaign_tracking
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "campaigns_update_authenticated"
ON barbershop_campaign_tracking
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "campaigns_service_role_all"
ON barbershop_campaign_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 7. BOOKINGS TABLE (if exists and has user_id)
-- ========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "bookings_select_own" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_insert_authenticated" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_update_own" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_service_role_all" ON bookings';
    
    -- Create policies (assuming bookings doesn't have user_id based on error)
    EXECUTE 'CREATE POLICY "bookings_select_all" ON bookings FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "bookings_insert_authenticated" ON bookings FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "bookings_update_authenticated" ON bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "bookings_service_role_all" ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check RLS status for all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'barbershop_customers',
    'barbershop_transactions',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking',
    'bookings'
  )
ORDER BY tablename;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN (
  'user_profiles',
  'barbershop_customers',
  'barbershop_transactions',
  'barbershop_analytics_daily',
  'barbershop_actionable_leads',
  'barbershop_campaign_tracking',
  'bookings'
)
ORDER BY tablename, policyname;

-- ========================================
-- ALL RLS FIXES APPLIED ✅
-- ========================================
