-- =====================================================
-- OASIS BI PRO: IDEMPOTENT SCHEMA & RLS FIX
-- Created: 21 Desember 2025
-- Purpose: Safe, idempotent SQL that can be run multiple times
-- Fixes: Infinite recursion in RLS policies
-- =====================================================

-- ===========================
-- PART 1: FIX FUNCTION VOLATILITY (Prevents Infinite Recursion)
-- ===========================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create function with STABLE volatility (NOT IMMUTABLE)
-- This prevents the "infinite recursion detected in policy" error
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================
-- PART 2: USER_PROFILES TABLE & RLS
-- ===========================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin', 'barbershop')),
  customer_phone TEXT,
  customer_name TEXT,
  capster_id UUID, -- Link to capsters table
  full_name TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
    END LOOP;
END $$;

-- Create SIMPLIFIED RLS Policies (NO RECURSION)

-- Policy 1: Service role has FULL access (CRITICAL for triggers)
CREATE POLICY "service_role_full_access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can INSERT their own profile during registration
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

-- Recreate trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 3: BARBERSHOP_CUSTOMERS TABLE & RLS
-- ===========================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS barbershop_customers (
  customer_phone TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  total_visits INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  average_atv NUMERIC(10,2) DEFAULT 0,
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  coupon_count INTEGER DEFAULT 0,
  coupon_eligible BOOLEAN DEFAULT FALSE,
  google_review_given BOOLEAN DEFAULT FALSE,
  churn_risk_score NUMERIC(3,2) DEFAULT 0.00 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1),
  first_visit_date DATE,
  last_visit_date DATE,
  days_since_last_visit INTEGER,
  visit_frequency TEXT,
  preferred_services TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'barbershop_customers') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON barbershop_customers', r.policyname);
    END LOOP;
END $$;

-- Recreate policies
-- Service role full access
CREATE POLICY "service_role_customers_access"
ON barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Customers can read their own data (match by phone)
CREATE POLICY "customers_read_own"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (customer_phone IN (
  SELECT customer_phone 
  FROM user_profiles 
  WHERE id = auth.uid() AND role = 'customer'
));

-- Staff (capster, admin, barbershop) can read all
CREATE POLICY "staff_read_all"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
));

-- Admin can modify all
CREATE POLICY "admin_modify_all"
ON barbershop_customers
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Recreate trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON barbershop_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 4: CAPSTERS TABLE & RLS
-- ===========================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS capsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  capster_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT DEFAULT 'all' CHECK (specialization IN ('haircut', 'grooming', 'coloring', 'all')),
  rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_customers_served INTEGER DEFAULT 0,
  total_revenue_generated NUMERIC(12,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "20:00"}, "tuesday": {"start": "09:00", "end": "20:00"}, "wednesday": {"start": "09:00", "end": "20:00"}, "thursday": {"start": "09:00", "end": "20:00"}, "friday": {"start": "09:00", "end": "20:00"}, "saturday": {"start": "09:00", "end": "21:00"}, "sunday": {"start": "09:00", "end": "21:00"}}'::jsonb,
  profile_image_url TEXT,
  bio TEXT,
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'capsters') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON capsters', r.policyname);
    END LOOP;
END $$;

-- Recreate policies
-- Service role full access
CREATE POLICY "service_role_capsters_access"
ON capsters
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All authenticated users can read capsters
CREATE POLICY "capsters_read_all"
ON capsters
FOR SELECT
TO authenticated
USING (true);

-- Capster can update their own profile
CREATE POLICY "capsters_update_own"
ON capsters
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can do everything
CREATE POLICY "capsters_admin_all"
ON capsters
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Recreate trigger
DROP TRIGGER IF EXISTS update_capsters_updated_at ON capsters;
CREATE TRIGGER update_capsters_updated_at
  BEFORE UPDATE ON capsters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 5: SERVICE_CATALOG TABLE & RLS
-- ===========================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_category TEXT CHECK (service_category IN ('haircut', 'grooming', 'coloring', 'package', 'other')),
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_catalog') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON service_catalog', r.policyname);
    END LOOP;
END $$;

-- Recreate policies
-- Service role full access
CREATE POLICY "service_role_catalog_access"
ON service_catalog
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public read access (all roles can see services)
CREATE POLICY "service_catalog_read_all"
ON service_catalog
FOR SELECT
USING (true);

-- Only admin can modify
CREATE POLICY "service_catalog_admin_modify"
ON service_catalog
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Recreate trigger
DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER update_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 6: BOOKINGS TABLE & RLS
-- ===========================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL,
  service_id UUID REFERENCES service_catalog(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capster_id, booking_date, booking_time)
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bookings', r.policyname);
    END LOOP;
END $$;

-- Recreate policies
-- Service role full access
CREATE POLICY "service_role_bookings_access"
ON bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Customers can read their own bookings
CREATE POLICY "customers_read_own_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (customer_phone IN (
  SELECT customer_phone 
  FROM user_profiles 
  WHERE id = auth.uid() AND role = 'customer'
));

-- Customers can create bookings for themselves
CREATE POLICY "customers_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (customer_phone IN (
  SELECT customer_phone 
  FROM user_profiles 
  WHERE id = auth.uid() AND role = 'customer'
));

-- Staff can read all bookings
CREATE POLICY "staff_read_all_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
));

-- Staff can modify all bookings
CREATE POLICY "staff_modify_bookings"
ON bookings
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
));

-- Recreate trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 7: BARBERSHOP_TRANSACTIONS TABLE & RLS
-- ===========================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS barbershop_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  customer_phone TEXT REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  capster_name TEXT,
  services_taken TEXT[],
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'qris', 'transfer', 'other')),
  coupon_used BOOLEAN DEFAULT FALSE,
  google_review_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE barbershop_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'barbershop_transactions') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON barbershop_transactions', r.policyname);
    END LOOP;
END $$;

-- Recreate policies
-- Service role full access
CREATE POLICY "service_role_transactions_access"
ON barbershop_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Customers can read their own transactions
CREATE POLICY "customers_read_own_transactions"
ON barbershop_transactions
FOR SELECT
TO authenticated
USING (customer_phone IN (
  SELECT customer_phone 
  FROM user_profiles 
  WHERE id = auth.uid() AND role = 'customer'
));

-- Staff can read all transactions
CREATE POLICY "staff_read_all_transactions"
ON barbershop_transactions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
));

-- Staff can modify transactions
CREATE POLICY "staff_modify_transactions"
ON barbershop_transactions
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
));

-- Recreate trigger
DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON barbershop_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- VERIFICATION QUERIES
-- ===========================

-- Check all RLS enabled tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'barbershop_customers', 'capsters', 'service_catalog', 'bookings', 'barbershop_transactions')
ORDER BY tablename;

-- Check function volatility
SELECT proname, provolatile 
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Check policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'barbershop_customers', 'capsters', 'service_catalog', 'bookings', 'barbershop_transactions')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- ✅ IDEMPOTENT SCHEMA FIX COMPLETE
-- This script can be safely run multiple times
-- =====================================================
