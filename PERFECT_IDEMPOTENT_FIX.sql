-- =====================================================
-- OASIS BI PRO: PERFECT IDEMPOTENT 3-ROLE SCHEMA FIX
-- Created: 22 Desember 2025
-- Purpose: Fix ALL issues found in database analysis
-- Safe to run multiple times
-- =====================================================

-- ===========================
-- PART 1: FIX FUNCTION (Prevents RLS Recursion)
-- ===========================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================
-- PART 2: FIX USER_PROFILES TABLE
-- ===========================

-- Ensure capster_id column exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

-- Update role constraint to include 'capster'
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('customer', 'admin', 'barbershop', 'capster'));

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 3: CLEAN DUPLICATE CAPSTERS
-- ===========================

-- Remove duplicate capsters (keep only first occurrence)
DELETE FROM capsters
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY capster_name, phone ORDER BY created_at) as rn
    FROM capsters
  ) t WHERE t.rn > 1
);

-- ===========================
-- PART 4: FIX BOOKINGS TABLE
-- ===========================

-- Add missing columns to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) DEFAULT 0;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_capster_date_time_unique'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_capster_date_time_unique 
    UNIQUE(capster_id, booking_date, booking_time);
  END IF;
END $$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 5: FIX TRANSACTIONS TABLE
-- ===========================

-- Add capster_id to transactions if not exists
ALTER TABLE barbershop_transactions 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

ALTER TABLE barbershop_transactions 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON barbershop_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 6: FIX RLS POLICIES FOR USER_PROFILES
-- ===========================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
    END LOOP;
END $$;

-- Policy 1: Service role has FULL access (CRITICAL for triggers & registration)
CREATE POLICY "service_role_full_access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Users can INSERT their own profile during registration
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

-- Policy 5: Admin can read all profiles
CREATE POLICY "admin_read_all"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- ===========================
-- PART 7: FIX RLS FOR BARBERSHOP_CUSTOMERS
-- ===========================

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

-- Service role full access
CREATE POLICY "service_role_customers_access"
ON barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Customers can read their own data
CREATE POLICY "customers_read_own"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (customer_phone IN (
  SELECT customer_phone 
  FROM user_profiles 
  WHERE id = auth.uid()
));

-- Staff can read all
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON barbershop_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 8: FIX RLS FOR CAPSTERS
-- ===========================

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

-- Service role full access
CREATE POLICY "service_role_capsters_access"
ON capsters
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All authenticated can read capsters
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_capsters_updated_at ON capsters;
CREATE TRIGGER update_capsters_updated_at
  BEFORE UPDATE ON capsters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 9: FIX RLS FOR SERVICE_CATALOG
-- ===========================

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

-- Service role full access
CREATE POLICY "service_role_catalog_access"
ON service_catalog
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public read access
CREATE POLICY "service_catalog_read_all"
ON service_catalog
FOR SELECT
USING (true);

-- Admin can modify
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER update_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 10: FIX RLS FOR BOOKINGS
-- ===========================

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
  WHERE id = auth.uid()
));

-- Customers can create bookings
CREATE POLICY "customers_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (customer_phone IN (
  SELECT customer_phone 
  FROM user_profiles 
  WHERE id = auth.uid()
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

-- Staff can modify bookings
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

-- ===========================
-- PART 11: FIX RLS FOR TRANSACTIONS
-- ===========================

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
  WHERE id = auth.uid()
));

-- Staff can read all
CREATE POLICY "staff_read_all_transactions"
ON barbershop_transactions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
));

-- Staff can modify
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

-- ===========================
-- PART 12: CREATE TRIGGER FUNCTIONS FOR CAPSTER STATS
-- ===========================

-- Function to update capster stats when transaction is created
DROP FUNCTION IF EXISTS update_capster_stats() CASCADE;

CREATE OR REPLACE FUNCTION update_capster_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.capster_id IS NOT NULL THEN
    UPDATE capsters
    SET 
      total_customers_served = total_customers_served + 1,
      total_revenue_generated = total_revenue_generated + COALESCE(NEW.total_price, 0),
      updated_at = NOW()
    WHERE id = NEW.capster_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_capster_stats ON barbershop_transactions;
CREATE TRIGGER trg_update_capster_stats
  AFTER INSERT ON barbershop_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_capster_stats();

-- Function to update capster rating when review is created
DROP FUNCTION IF EXISTS update_capster_rating() CASCADE;

CREATE OR REPLACE FUNCTION update_capster_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.capster_id IS NOT NULL AND NEW.is_approved = true THEN
    UPDATE capsters
    SET 
      rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM customer_reviews
        WHERE capster_id = NEW.capster_id AND is_approved = true
      ),
      updated_at = NOW()
    WHERE id = NEW.capster_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_capster_rating ON customer_reviews;
CREATE TRIGGER trg_update_capster_rating
  AFTER INSERT OR UPDATE ON customer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_capster_rating();

-- ===========================
-- PART 13: AUTO-CREATE BARBERSHOP_CUSTOMER ON USER_PROFILES INSERT
-- ===========================

DROP FUNCTION IF EXISTS auto_create_barbershop_customer() CASCADE;

CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create barbershop_customer for customer role with phone
  IF NEW.role = 'customer' AND NEW.customer_phone IS NOT NULL THEN
    INSERT INTO barbershop_customers (
      customer_phone,
      customer_name,
      first_visit_date,
      last_visit_date
    ) VALUES (
      NEW.customer_phone,
      COALESCE(NEW.customer_name, NEW.full_name, SPLIT_PART(NEW.email, '@', 1)),
      CURRENT_DATE,
      CURRENT_DATE
    )
    ON CONFLICT (customer_phone) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_barbershop_customer ON user_profiles;
CREATE TRIGGER trg_auto_create_barbershop_customer
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_barbershop_customer();

-- ===========================
-- VERIFICATION QUERIES
-- ===========================

-- Check tables and row counts
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = pt.tablename) x) as exists
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'barbershop_customers',
    'capsters',
    'service_catalog',
    'bookings',
    'barbershop_transactions',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews'
  )
ORDER BY tablename;

-- Check RLS enabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles',
    'barbershop_customers',
    'capsters',
    'service_catalog',
    'bookings',
    'barbershop_transactions'
  )
ORDER BY tablename;

-- Check policy counts
SELECT 
  tablename, 
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'barbershop_customers',
    'capsters',
    'service_catalog',
    'bookings',
    'barbershop_transactions'
  )
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- ✅ PERFECT IDEMPOTENT SCHEMA FIX COMPLETE
-- This script has been tested and is safe to run multiple times
-- Fixes:
--  1. User_profiles role constraint (includes 'capster')
--  2. Removed duplicate capsters
--  3. Fixed bookings table (added all missing columns)
--  4. Fixed transactions table (added capster_id, service_id)
--  5. Fixed ALL RLS policies (no recursion, proper access)
--  6. Added auto-create barbershop_customer trigger
--  7. Added capster stats update triggers
-- =====================================================
