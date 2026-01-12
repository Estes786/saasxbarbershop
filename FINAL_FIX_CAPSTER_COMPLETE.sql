-- =====================================================
-- FINAL FIX: Capster Registration & Dashboard Complete
-- Created: 22 Desember 2024
-- Purpose: Fix ALL issues with capster registration and login flow
-- =====================================================

-- ===========================
-- PART 1: DROP PROBLEMATIC CONSTRAINTS
-- ===========================

-- Remove foreign key constraint that causes registration errors
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_customer_phone_fkey'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_customer_phone_fkey;
        RAISE NOTICE 'Dropped user_profiles_customer_phone_fkey constraint';
    END IF;
END $$;

-- ===========================
-- PART 2: ENSURE ALL TABLES EXIST WITH CORRECT SCHEMA
-- ===========================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin', 'barbershop')),
  customer_phone TEXT,
  customer_name TEXT,
  capster_id UUID, -- Link to capsters table (will be set after capster record created)
  full_name TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capsters Table
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

-- Barbershop Customers Table
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
  average_days_between_visits NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Catalog Table
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

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL,
  service_id UUID REFERENCES service_catalog(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  customer_name TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capster_id, booking_date, booking_time)
);

-- Transactions Table
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
-- PART 3: FIX RLS POLICIES
-- ===========================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_transactions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('user_profiles', 'capsters', 'barbershop_customers', 'service_catalog', 'bookings', 'barbershop_transactions')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- USER_PROFILES Policies
CREATE POLICY "service_role_full_access" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "authenticated_select_own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "authenticated_update_own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CAPSTERS Policies
CREATE POLICY "service_role_capsters_access" ON capsters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "capsters_read_all" ON capsters FOR SELECT TO authenticated USING (true);
CREATE POLICY "capsters_insert_own" ON capsters FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "capsters_update_own" ON capsters FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "capsters_admin_all" ON capsters FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- BARBERSHOP_CUSTOMERS Policies
CREATE POLICY "service_role_customers_access" ON barbershop_customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customers_read_own" ON barbershop_customers FOR SELECT TO authenticated USING (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid() AND role = 'customer'));
CREATE POLICY "staff_read_all" ON barbershop_customers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));
CREATE POLICY "admin_modify_all" ON barbershop_customers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- SERVICE_CATALOG Policies
CREATE POLICY "service_role_catalog_access" ON service_catalog FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_catalog_read_all" ON service_catalog FOR SELECT USING (true);
CREATE POLICY "service_catalog_admin_modify" ON service_catalog FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- BOOKINGS Policies
CREATE POLICY "service_role_bookings_access" ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customers_read_own_bookings" ON bookings FOR SELECT TO authenticated USING (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid() AND role = 'customer'));
CREATE POLICY "customers_create_own_bookings" ON bookings FOR INSERT TO authenticated WITH CHECK (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid() AND role = 'customer'));
CREATE POLICY "staff_read_all_bookings" ON bookings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));
CREATE POLICY "staff_modify_bookings" ON bookings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop'))) WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));

-- TRANSACTIONS Policies
CREATE POLICY "service_role_transactions_access" ON barbershop_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customers_read_own_transactions" ON barbershop_transactions FOR SELECT TO authenticated USING (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid() AND role = 'customer'));
CREATE POLICY "staff_read_all_transactions" ON barbershop_transactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));
CREATE POLICY "staff_modify_transactions" ON barbershop_transactions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop'))) WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));

-- ===========================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- ===========================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_capsters_user_id ON capsters(user_id);
CREATE INDEX IF NOT EXISTS idx_capsters_is_available ON capsters(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_capster_date ON bookings(capster_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ===========================
-- PART 5: VERIFICATION QUERIES
-- ===========================

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'capsters', 'barbershop_customers', 'service_catalog', 'bookings', 'barbershop_transactions')
ORDER BY tablename;

-- Check policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'capsters', 'barbershop_customers', 'service_catalog', 'bookings', 'barbershop_transactions')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- ✅ CAPSTER FIX COMPLETE
-- This script fixes all capster registration & login issues
-- =====================================================
