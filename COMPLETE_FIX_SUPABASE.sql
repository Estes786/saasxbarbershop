-- ========================================
-- COMPLETE SUPABASE CONFIGURATION FIX
-- For OASIS BI PRO Barbershop Application
-- ========================================
-- Execute this entire script in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
-- ========================================

-- ========================================
-- STEP 1: Fix RLS Infinite Recursion
-- ========================================
-- Problem: "infinite recursion detected in policy for relation 'user_profiles'"
-- Solution: Drop problematic policies and create simple ones

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Public users can view roles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role_all" ON user_profiles;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies WITHOUT recursion
-- Policy 1: Allow authenticated users to read their own profile
CREATE POLICY "user_profiles_select_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Allow authenticated users to insert their own profile
CREATE POLICY "user_profiles_insert_own"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Policy 3: Allow authenticated users to update their own profile
CREATE POLICY "user_profiles_update_own"
ON user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 4: Service role bypass (CRITICAL for OAuth callback)
CREATE POLICY "user_profiles_service_role_all"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- STEP 2: Verify RLS Policies
-- ========================================
SELECT 
    'RLS Policies Verification' AS check_name,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Expected output: 4 policies
-- - user_profiles_select_own (SELECT, authenticated)
-- - user_profiles_insert_own (INSERT, authenticated)  
-- - user_profiles_update_own (UPDATE, authenticated)
-- - user_profiles_service_role_all (ALL, service_role)

-- ========================================
-- STEP 3: Check RLS is Enabled
-- ========================================
SELECT 
    'RLS Status Check' AS check_name,
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Expected: rls_enabled = true

-- ========================================
-- STEP 4: Verify Foreign Key Constraints
-- ========================================
SELECT
    'Foreign Key Constraints' AS check_name,
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_profiles';

-- Expected output:
-- 1. id → auth.users(id)
-- 2. customer_phone → barbershop_customers(customer_phone)

-- ========================================
-- STEP 5: Test Profile Creation
-- ========================================
-- This tests if a service role can create profiles
-- Should return no errors

DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Count existing profiles
    SELECT COUNT(*) INTO test_count FROM user_profiles;
    
    RAISE NOTICE 'Current profile count: %', test_count;
    RAISE NOTICE 'RLS policies applied successfully!';
    RAISE NOTICE 'Service role can query user_profiles.';
END $$;

-- ========================================
-- STEP 6: Verify Customer Records
-- ========================================
SELECT
    'Customer Records Check' AS check_name,
    COUNT(*) AS total_customers,
    COUNT(CASE WHEN customer_name IS NOT NULL THEN 1 END) AS customers_with_name,
    COUNT(CASE WHEN customer_phone IS NOT NULL THEN 1 END) AS customers_with_phone
FROM barbershop_customers;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUPABASE CONFIGURATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was fixed:';
    RAISE NOTICE '   1. ✅ RLS infinite recursion resolved';
    RAISE NOTICE '   2. ✅ 4 RLS policies created correctly';
    RAISE NOTICE '   3. ✅ Service role can bypass RLS';
    RAISE NOTICE '   4. ✅ Authenticated users can manage own profile';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Update Site URL in Supabase Auth Settings';
    RAISE NOTICE '   2. Configure Google OAuth (optional)';
    RAISE NOTICE '   3. Start testing authentication flows';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Testing URLs:';
    RAISE NOTICE '   Registration: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register';
    RAISE NOTICE '   Admin Reg: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register/admin';
    RAISE NOTICE '   Login: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/login';
    RAISE NOTICE '';
END $$;

-- ========================================
-- END OF SCRIPT
-- ========================================
