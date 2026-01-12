-- ========================================
-- FIXED: RLS POLICIES WITHOUT INFINITE RECURSION
-- Apply this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
-- ========================================

-- STEP 1: Disable RLS temporarily to clear everything
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Public users can view roles" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert own profile during registration" ON user_profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;

-- STEP 3: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create SIMPLIFIED RLS Policies (NO RECURSION)

-- Policy 1: Service role has FULL access (MOST IMPORTANT - for triggers)
CREATE POLICY "service_role_full_access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can INSERT their own profile ONLY during registration
CREATE POLICY "authenticated_insert_own"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can SELECT their own profile
CREATE POLICY "authenticated_select_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 4: Users can UPDATE their own profile  
CREATE POLICY "authenticated_update_own"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- STEP 5: Fix SQL Function (Change from IMMUTABLE to STABLE)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- STEP 6: Recreate Triggers
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

-- ========================================
-- VERIFICATION (Run after applying above)
-- ========================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check function volatility
SELECT proname, provolatile 
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- ========================================
-- READY TO APPLY ✅
-- ========================================
