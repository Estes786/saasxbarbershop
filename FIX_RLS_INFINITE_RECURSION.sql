-- ========================================
-- FIX RLS INFINITE RECURSION
-- This error occurs when RLS policies reference the same table
-- causing infinite loop in permission checks
-- ========================================

-- STEP 1: Disable RLS temporarily to clean up
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Public users can view roles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;

-- STEP 3: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create CORRECT RLS Policies (no recursion)

-- Policy 1: Service role MUST come first (bypasses all checks)
CREATE POLICY "service_role_full_access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read their own profile
CREATE POLICY "users_read_own_profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Authenticated users can insert their own profile (registration)
CREATE POLICY "users_insert_own_profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Authenticated users can update their own profile
CREATE POLICY "users_update_own_profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- ========================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
-- ========================================
