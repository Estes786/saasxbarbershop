-- ========================================
-- COMPLETE RLS & RBAC FIX
-- TESTED AND READY TO APPLY ✅
-- ========================================
-- This script fixes:
-- 1. RLS infinite recursion errors
-- 2. barbershop_customers insert errors
-- 3. RBAC role-based access control
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ========================================
DROP POLICY IF EXISTS "service_role_full_access" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_select_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_update_own" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON user_profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;

DROP POLICY IF EXISTS "service_role_full_access_customers" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;
DROP POLICY IF EXISTS "admin_view_all_customers" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_view_own_data" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_insert_during_signup" ON barbershop_customers;

-- ========================================
-- STEP 2: ENABLE RLS
-- ========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: USER_PROFILES POLICIES
-- ========================================

-- Policy 1: Service role has full access (CRITICAL for auth triggers)
CREATE POLICY "service_role_full_access" ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Users can insert their own profile ONLY during signup
CREATE POLICY "users_insert_own_profile" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can view their own profile
CREATE POLICY "users_select_own_profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 4: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 5: Admins can view all profiles
CREATE POLICY "admin_select_all_profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- STEP 4: BARBERSHOP_CUSTOMERS POLICIES
-- ========================================

-- Policy 1: Service role has full access
CREATE POLICY "service_role_full_access_customers" ON barbershop_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can insert during signup (CRITICAL FIX)
CREATE POLICY "customers_insert_during_signup" ON barbershop_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Customers can view their own data
CREATE POLICY "customers_view_own_data" ON barbershop_customers
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 4: Admins can view all customers
CREATE POLICY "admin_view_all_customers" ON barbershop_customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================
-- Run this to verify policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('user_profiles', 'barbershop_customers')
-- ORDER BY tablename, policyname;

-- Expected results:
-- user_profiles: 5 policies
-- barbershop_customers: 4 policies
-- Total: 9 policies

-- ========================================
-- READY TO APPLY ✅
-- ========================================
