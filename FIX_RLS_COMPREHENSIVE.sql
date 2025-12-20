-- ========================================
-- COMPREHENSIVE RLS FIX FOR RBAC
-- ========================================
-- Fix RLS policies untuk user_profiles table
-- Tujuan: Memastikan role-based access control bekerja dengan benar
-- ========================================

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "service_role_full_access" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_select_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_update_own" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON user_profiles;

-- Step 2: Disable RLS temporarily untuk testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS dengan policies yang benar
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW comprehensive policies

-- Policy 1: Service role has full access
CREATE POLICY "service_role_full_access" 
ON user_profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 2: Users can insert their own profile during signup
CREATE POLICY "users_insert_own_profile" 
ON user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can view their own profile
CREATE POLICY "users_select_own_profile" 
ON user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Policy 4: Users can update their own profile
CREATE POLICY "users_update_own_profile" 
ON user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Policy 5: Admin can view all profiles
CREATE POLICY "admin_select_all_profiles" 
ON user_profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Step 5: Fix barbershop_customers RLS
ALTER TABLE barbershop_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_full_access_customers" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;

-- Create NEW policies for barbershop_customers
CREATE POLICY "service_role_full_access_customers" 
ON barbershop_customers 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "customers_view_own_data" 
ON barbershop_customers 
FOR SELECT 
TO authenticated 
USING (
  customer_phone IN (
    SELECT customer_phone FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "customers_insert_during_signup" 
ON barbershop_customers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "admin_view_all_customers" 
ON barbershop_customers 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Step 6: Verify policies
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'barbershop_customers')
ORDER BY tablename, policyname;

-- ========================================
-- DONE ✅
-- ========================================
-- Expected result:
-- - RLS enabled on both tables
-- - 5 policies on user_profiles
-- - 4 policies on barbershop_customers
-- - Role-based access control working
-- ========================================
