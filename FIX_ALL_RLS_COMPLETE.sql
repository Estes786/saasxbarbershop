-- ========================================
-- COMPLETE RLS FIX FOR ALL AUTHENTICATION TABLES
-- ========================================
-- Purpose: Fix "new row violates row-level security policy" error
-- Tables: user_profiles, barbershop_customers
-- Execute in: Supabase SQL Editor
-- ========================================

-- ========================================
-- PART 1: USER_PROFILES TABLE
-- ========================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access to user_profiles" ON user_profiles;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to user_profiles"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- PART 2: BARBERSHOP_CUSTOMERS TABLE (CRITICAL FIX)
-- ========================================

-- Enable RLS on barbershop_customers
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Anyone can insert new customer" ON barbershop_customers;
DROP POLICY IF EXISTS "Customers can view their own data" ON barbershop_customers;
DROP POLICY IF EXISTS "Customers can update their own data" ON barbershop_customers;
DROP POLICY IF EXISTS "Service role has full access to customers" ON barbershop_customers;
DROP POLICY IF EXISTS "Authenticated can insert customers" ON barbershop_customers;

-- POLICY 1: Allow authenticated users to insert customer records (CRITICAL FOR REGISTRATION)
-- This is needed because registration flow creates customer record during sign-up
CREATE POLICY "Authenticated can insert customers"
ON barbershop_customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- POLICY 2: Allow customers to view their own customer data
-- Match by phone number stored in their profile
CREATE POLICY "Customers can view their own data"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (
  customer_phone IN (
    SELECT customer_phone 
    FROM user_profiles 
    WHERE id = auth.uid() AND customer_phone IS NOT NULL
  )
);

-- POLICY 3: Allow customers to update their own customer data
CREATE POLICY "Customers can update their own data"
ON barbershop_customers
FOR UPDATE
TO authenticated
USING (
  customer_phone IN (
    SELECT customer_phone 
    FROM user_profiles 
    WHERE id = auth.uid() AND customer_phone IS NOT NULL
  )
)
WITH CHECK (
  customer_phone IN (
    SELECT customer_phone 
    FROM user_profiles 
    WHERE id = auth.uid() AND customer_phone IS NOT NULL
  )
);

-- POLICY 4: Service role has full access (for server-side operations)
CREATE POLICY "Service role has full access to customers"
ON barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check user_profiles policies
SELECT 
    'user_profiles' as table_name,
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check barbershop_customers policies
SELECT 
    'barbershop_customers' as table_name,
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies 
WHERE tablename = 'barbershop_customers'
ORDER BY policyname;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- user_profiles: 4 policies (SELECT, INSERT, UPDATE, ALL for service_role)
-- barbershop_customers: 4 policies (INSERT for authenticated, SELECT, UPDATE, ALL for service_role)
-- ========================================
