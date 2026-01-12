-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For user_profiles table
-- ========================================
-- Purpose: Allow authenticated users to manage their own profiles
-- Execute in: Supabase SQL Editor
-- ========================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Public users can view roles" ON user_profiles;

-- ========================================
-- POLICY 1: Users can view their own profile
-- ========================================
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ========================================
-- POLICY 2: Users can insert their own profile
-- ========================================
-- This allows new users to create their profile during registration
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================================
-- POLICY 3: Users can update their own profile
-- ========================================
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ========================================
-- POLICY 4: Service role has full access
-- ========================================
-- This is critical for server-side operations (OAuth callback, admin operations)
CREATE POLICY "Service role has full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- VERIFICATION
-- ========================================
-- Check if policies are applied correctly
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Expected output: 4 policies (SELECT, INSERT, UPDATE, ALL)
