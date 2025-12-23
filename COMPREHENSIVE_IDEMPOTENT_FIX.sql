-- =====================================================
-- COMPREHENSIVE IDEMPOTENT SQL FIX - SaaSxBarbershop
-- Created: 23 Desember 2025
-- Purpose: Complete database setup dengan RLS policies
-- Can be run multiple times safely (IDEMPOTENT)
-- =====================================================

-- ===========================
-- PART 1: FIX FUNCTION VOLATILITY (Prevent Infinite Recursion)
-- ===========================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create function with STABLE volatility (NOT IMMUTABLE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================
-- PART 2: DROP PROBLEMATIC FOREIGN KEY CONSTRAINT
-- ===========================

DO $$ 
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_customer_phone_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_customer_phone_fkey;
        RAISE NOTICE '✅ Dropped user_profiles_customer_phone_fkey constraint';
    ELSE
        RAISE NOTICE '✓ Constraint user_profiles_customer_phone_fkey does not exist (OK)';
    END IF;
END $$;

-- ===========================
-- PART 3: CREATE/UPDATE ALL TABLES
-- ===========================

-- 3.1 USER_PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin', 'barbershop')),
  customer_phone TEXT,
  customer_name TEXT,
  capster_id UUID,
  full_name TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 BARBERSHOP_CUSTOMERS TABLE
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
  average_days_between_visits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 CAPSTERS TABLE
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

-- 3.4 SERVICE_CATALOG TABLE
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

-- 3.5 BOOKINGS TABLE
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

-- 3.6 BARBERSHOP_TRANSACTIONS TABLE
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

-- ===========================
-- PART 4: CREATE AUTO-TRIGGER FOR BARBERSHOP_CUSTOMERS
-- ===========================

-- Create/Replace trigger function (idempotent)
CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create customer record if customer_phone is provided and role is 'customer'
    IF NEW.customer_phone IS NOT NULL AND NEW.role = 'customer' THEN
        -- Check if customer already exists
        IF NOT EXISTS (
            SELECT 1 FROM barbershop_customers 
            WHERE customer_phone = NEW.customer_phone
        ) THEN
            -- Insert new customer record
            INSERT INTO barbershop_customers (
                customer_phone,
                customer_name,
                total_visits,
                total_revenue,
                average_atv,
                lifetime_value,
                coupon_count,
                coupon_eligible,
                google_review_given,
                churn_risk_score,
                first_visit_date
            ) VALUES (
                NEW.customer_phone,
                COALESCE(NEW.customer_name, NEW.email),
                0,
                0,
                0,
                0,
                0,
                false,
                false,
                0.00,
                CURRENT_DATE
            );
            
            RAISE NOTICE '✅ Auto-created barbershop_customers record for phone: %', NEW.customer_phone;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_barbershop_customer ON user_profiles;

-- Create new trigger
CREATE TRIGGER trigger_auto_create_barbershop_customer
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_barbershop_customer();

-- ===========================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ===========================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_transactions ENABLE ROW LEVEL SECURITY;

-- ===========================
-- PART 6: DROP ALL EXISTING POLICIES (Clean Slate)
-- ===========================

DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY['user_profiles', 'barbershop_customers', 'capsters', 'service_catalog', 'bookings', 'barbershop_transactions'];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, t);
        END LOOP;
        RAISE NOTICE '✅ Dropped all policies for table: %', t;
    END LOOP;
END $$;

-- ===========================
-- PART 7: CREATE RLS POLICIES FOR USER_PROFILES
-- ===========================

-- Service role full access (CRITICAL for triggers)
CREATE POLICY "service_role_user_profiles_full_access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can INSERT their own profile during registration
CREATE POLICY "users_insert_own_profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can SELECT their own profile
CREATE POLICY "users_select_own_profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can UPDATE their own profile
CREATE POLICY "users_update_own_profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "admin_read_all_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ===========================
-- PART 8: CREATE RLS POLICIES FOR BARBERSHOP_CUSTOMERS
-- ===========================

-- Service role full access
CREATE POLICY "service_role_customers_full_access"
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
USING (
    customer_phone IN (
        SELECT customer_phone 
        FROM user_profiles 
        WHERE id = auth.uid() AND role = 'customer'
    )
);

-- Staff (capster, admin, barbershop) can read all
CREATE POLICY "staff_read_all_customers"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
);

-- Admin can modify all
CREATE POLICY "admin_modify_customers"
ON barbershop_customers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ===========================
-- PART 9: CREATE RLS POLICIES FOR CAPSTERS
-- ===========================

-- Service role full access
CREATE POLICY "service_role_capsters_full_access"
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

-- Capster can INSERT their own record
CREATE POLICY "capsters_insert_own"
ON capsters
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Capster can update their own profile
CREATE POLICY "capsters_update_own"
ON capsters
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can do everything
CREATE POLICY "admin_manage_capsters"
ON capsters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ===========================
-- PART 10: CREATE RLS POLICIES FOR SERVICE_CATALOG
-- ===========================

-- Service role full access
CREATE POLICY "service_role_catalog_full_access"
ON service_catalog
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public read access (all users can see services)
CREATE POLICY "service_catalog_read_all"
ON service_catalog
FOR SELECT
USING (true);

-- Only admin can modify
CREATE POLICY "service_catalog_admin_modify"
ON service_catalog
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ===========================
-- PART 11: CREATE RLS POLICIES FOR BOOKINGS
-- ===========================

-- Service role full access
CREATE POLICY "service_role_bookings_full_access"
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
USING (
    customer_phone IN (
        SELECT customer_phone 
        FROM user_profiles 
        WHERE id = auth.uid() AND role = 'customer'
    )
);

-- Customers can create bookings for themselves
CREATE POLICY "customers_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
    customer_phone IN (
        SELECT customer_phone 
        FROM user_profiles 
        WHERE id = auth.uid() AND role = 'customer'
    )
);

-- Staff can read all bookings
CREATE POLICY "staff_read_all_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
);

-- Staff can modify all bookings
CREATE POLICY "staff_modify_bookings"
ON bookings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
);

-- ===========================
-- PART 12: CREATE RLS POLICIES FOR BARBERSHOP_TRANSACTIONS
-- ===========================

-- Service role full access
CREATE POLICY "service_role_transactions_full_access"
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
USING (
    customer_phone IN (
        SELECT customer_phone 
        FROM user_profiles 
        WHERE id = auth.uid() AND role = 'customer'
    )
);

-- Staff can read all transactions
CREATE POLICY "staff_read_all_transactions"
ON barbershop_transactions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
);

-- Staff can modify transactions
CREATE POLICY "staff_modify_transactions"
ON barbershop_transactions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
);

-- ===========================
-- PART 13: RECREATE ALL UPDATED_AT TRIGGERS
-- ===========================

-- User Profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Barbershop Customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON barbershop_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Capsters
DROP TRIGGER IF EXISTS update_capsters_updated_at ON capsters;
CREATE TRIGGER update_capsters_updated_at
    BEFORE UPDATE ON capsters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Service Catalog
DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER update_service_catalog_updated_at
    BEFORE UPDATE ON service_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON barbershop_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- PART 14: VERIFICATION QUERIES
-- ===========================

-- Check RLS is enabled for all tables
SELECT 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'barbershop_customers', 'capsters', 'service_catalog', 'bookings', 'barbershop_transactions')
ORDER BY tablename;

-- Check policies count per table
SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'barbershop_customers', 'capsters', 'service_catalog', 'bookings', 'barbershop_transactions')
GROUP BY tablename
ORDER BY tablename;

-- Check function volatility (should be 's' for STABLE)
SELECT 
    proname as function_name,
    CASE provolatile 
        WHEN 'i' THEN '❌ IMMUTABLE (Will cause recursion!)' 
        WHEN 's' THEN '✅ STABLE (Correct!)' 
        WHEN 'v' THEN '⚠️ VOLATILE' 
    END as volatility_status
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'auto_create_barbershop_customer');

-- Check if auto-create trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_barbershop_customer';

-- =====================================================
-- ✅ COMPREHENSIVE IDEMPOTENT SQL FIX COMPLETE
-- This script can be safely run multiple times
-- Last Updated: 23 Desember 2025
-- =====================================================

-- Summary of fixes:
-- ✅ Fixed function volatility (STABLE instead of IMMUTABLE)
-- ✅ Dropped problematic foreign key constraint
-- ✅ Created auto-trigger for customer creation
-- ✅ Created/ensured all tables exist
-- ✅ Enabled RLS on all tables
-- ✅ Dropped and recreated all policies (clean slate)
-- ✅ Created comprehensive RLS policies for all roles
-- ✅ Recreated all updated_at triggers
-- ✅ Added verification queries
