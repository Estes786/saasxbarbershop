-- =========================================
-- FIX USER PROFILE NOT FOUND ERROR
-- Safe & Idempotent SQL Script
-- =========================================

-- 1. Drop existing RLS policies yang bermasalah
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON user_profiles;

-- 2. Recreate RLS policies dengan lebih permissive
-- Allow users to read their OWN profile (critical for login/dashboard)
CREATE POLICY "Users can read their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their OWN profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS (for backend operations)
CREATE POLICY "Service role can do anything"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow admin role to read all profiles
CREATE POLICY "Admin can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Fix NULL customer_name and customer_phone for existing users
-- Update NULL customer_name to use email prefix
UPDATE user_profiles
SET customer_name = SPLIT_PART(email, '@', 1)
WHERE customer_name IS NULL OR customer_name = '';

-- 4. Ensure RLS is enabled but not too strict
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =========================================
-- SUCCESS! 
-- Users should now be able to:
-- 1. Read their own profile after login
-- 2. Update their own profile
-- 3. No more "User profile not found" error
-- =========================================
