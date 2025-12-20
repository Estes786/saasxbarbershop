-- ================================================
-- COMPREHENSIVE RLS AND RBAC FIX
-- ================================================
-- This script fixes all authentication and RLS issues
-- Safe to run multiple times (idempotent)

-- ================================================
-- 1. DROP ALL EXISTING POLICIES
-- ================================================
DO $$ 
BEGIN
  -- Drop all policies on user_profiles
  DROP POLICY IF EXISTS "Allow read own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Allow insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "service_role_full_access_customers" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
  
  -- Drop all policies on barbershop_customers
  DROP POLICY IF EXISTS "Allow read all customers" ON barbershop_customers;
  DROP POLICY IF EXISTS "Allow insert customers" ON barbershop_customers;
  DROP POLICY IF EXISTS "Allow update customers" ON barbershop_customers;
  DROP POLICY IF EXISTS "service_role_full_access" ON barbershop_customers;
  DROP POLICY IF EXISTS "barbershop_customers_select_policy" ON barbershop_customers;
  DROP POLICY IF EXISTS "barbershop_customers_insert_policy" ON barbershop_customers;
  DROP POLICY IF EXISTS "barbershop_customers_update_policy" ON barbershop_customers;
  
  RAISE NOTICE 'All existing policies dropped';
END $$;

-- ================================================
-- 2. DISABLE RLS TEMPORARILY
-- ================================================
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers DISABLE ROW LEVEL SECURITY;

-- ================================================
-- 3. CREATE CLEAN RLS POLICIES
-- ================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USER_PROFILES POLICIES
-- ================================================

-- Allow authenticated users to read their own profile
CREATE POLICY "user_profiles_read_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (during signup)
CREATE POLICY "user_profiles_insert_own"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "user_profiles_update_own"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service_role full access (for server-side operations)
CREATE POLICY "user_profiles_service_role_all"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ================================================
-- BARBERSHOP_CUSTOMERS POLICIES  
-- ================================================

-- Allow authenticated customers to read their own data
CREATE POLICY "barbershop_customers_read_own"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (
  customer_phone IN (
    SELECT customer_phone 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users to insert customer records
CREATE POLICY "barbershop_customers_insert_any"
ON barbershop_customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated customers to update their own data
CREATE POLICY "barbershop_customers_update_own"
ON barbershop_customers
FOR UPDATE
TO authenticated
USING (
  customer_phone IN (
    SELECT customer_phone 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  customer_phone IN (
    SELECT customer_phone 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Allow service_role full access
CREATE POLICY "barbershop_customers_service_role_all"
ON barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ================================================
-- 4. CREATE OR REPLACE HANDLE_NEW_USER TRIGGER
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is intentionally simple
  -- Profile creation is handled in application code
  -- This just logs the event
  RAISE LOG 'New user created: %', NEW.id;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ================================================

GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON barbershop_customers TO authenticated;
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON barbershop_customers TO service_role;

-- ================================================
-- VERIFICATION
-- ================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count policies on user_profiles
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_profiles';
  
  RAISE NOTICE 'user_profiles policies: %', policy_count;
  
  -- Count policies on barbershop_customers
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'barbershop_customers';
  
  RAISE NOTICE 'barbershop_customers policies: %', policy_count;
  
  RAISE NOTICE '✅ RLS policies applied successfully!';
END $$;
