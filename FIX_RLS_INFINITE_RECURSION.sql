-- ========================================
-- FIX: Infinite Recursion in RLS Policies
-- ========================================
-- Problem: Current RLS policies cause infinite recursion
-- Solution: Disable RLS temporarily OR simplify policies
-- ========================================

-- OPTION 1: Disable RLS (Quick fix for testing)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Keep RLS but use simplified policies (Recommended for production)
-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies without recursion
-- Policy 1: Allow authenticated users to read their own profile
CREATE POLICY "user_profiles_select_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Allow authenticated users to insert their own profile
-- IMPORTANT: Use auth.uid() directly, not a subquery
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

-- Policy 4: Service role bypass (for OAuth callback and admin operations)
CREATE POLICY "user_profiles_service_role_all"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 5: Allow public read access for role checking (optional, only if needed)
-- Uncomment if you need unauthenticated users to check roles
-- CREATE POLICY "user_profiles_public_read_role"
-- ON user_profiles
-- FOR SELECT
-- TO public
-- USING (true);

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Expected: 4 policies (SELECT, INSERT, UPDATE, ALL)
-- No infinite recursion errors should appear

-- ========================================
-- TEST QUERIES
-- ========================================
-- Test 1: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';
-- Expected: rowsecurity = true

-- Test 2: Count profiles (should work with service role)
SELECT COUNT(*) FROM user_profiles;
-- Expected: No errors

-- ========================================
-- NOTES
-- ========================================
-- 1. The infinite recursion occurs when policies reference
--    the same table they're protecting in a subquery
-- 2. Always use auth.uid() directly in USING/WITH CHECK
-- 3. Never use subqueries like (SELECT id FROM user_profiles WHERE ...)
-- 4. Service role policies always bypass RLS
-- ========================================
