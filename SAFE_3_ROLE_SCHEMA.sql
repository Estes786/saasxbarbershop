-- =====================================================
-- OASIS BI PRO: 3-ROLE ARCHITECTURE - IDEMPOTENT & SAFE
-- Created: 21 Desember 2025
-- Purpose: Safe deployment dengan DROP IF EXISTS
-- =====================================================

-- ===========================
-- STEP 1: DROP OLD POLICIES (IDEMPOTENT)
-- ===========================

-- Drop policies untuk service_catalog
DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog_write_admin" ON service_catalog;

-- Drop policies untuk capsters
DROP POLICY IF EXISTS "capsters_read_all" ON capsters;
DROP POLICY IF EXISTS "capsters_update_own" ON capsters;
DROP POLICY IF EXISTS "capsters_admin_all" ON capsters;

-- Drop policies untuk booking_slots
DROP POLICY IF EXISTS "booking_slots_read_all" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_manage_own" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_admin_all" ON booking_slots;

-- Drop policies untuk customer_loyalty
DROP POLICY IF EXISTS "customer_loyalty_read_own" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_read_capster_admin" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_update_admin" ON customer_loyalty;

-- Drop policies untuk customer_reviews
DROP POLICY IF EXISTS "customer_reviews_read_approved" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_create_own" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_read_all_staff" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_manage_admin" ON customer_reviews;

-- Drop policies untuk user_profiles (FIX infinite recursion)
DROP POLICY IF EXISTS "user_profiles_read_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_read_all_admin" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON user_profiles;

-- ===========================
-- STEP 2: CREATE TABLES (IDEMPOTENT)
-- ===========================

-- 1. SERVICE CATALOG
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

-- 2. CAPSTERS TABLE
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

-- 3. BOOKING SLOTS
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capster_id UUID REFERENCES capsters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'completed')),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time, capster_id)
);

-- 4. CUSTOMER LOYALTY
CREATE TABLE IF NOT EXISTS customer_loyalty (
  customer_phone TEXT PRIMARY KEY REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  loyalty_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_since TIMESTAMPTZ DEFAULT NOW(),
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMER REVIEWS
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_phone TEXT REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL,
  service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_google_review BOOLEAN DEFAULT FALSE,
  google_review_url TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- STEP 3: SEED DATA (SAFE)
-- ===========================

-- Seed service catalog (UPSERT style)
INSERT INTO service_catalog (service_name, service_category, base_price, duration_minutes, description, display_order) 
VALUES
  ('Dewasa', 'haircut', 18000, 30, 'Potong rambut dewasa standar', 1),
  ('Anak Kecil', 'haircut', 15000, 20, 'Potong rambut anak kecil', 2),
  ('Cukur Balita', 'haircut', 18000, 25, 'Potong rambut untuk balita', 3),
  ('Keramas', 'grooming', 10000, 15, 'Keramas dengan shampoo berkualitas', 4),
  ('Cukur Jenggot + Kumis', 'grooming', 10000, 15, 'Cukur jenggot dan kumis rapi', 5),
  ('Cukur + Keramas', 'package', 25000, 40, 'Paket hemat cukur dan keramas', 6),
  ('Semir (Hitam)', 'coloring', 50000, 45, 'Semir rambut warna hitam', 7),
  ('Hairlight/Bleaching', 'coloring', 150000, 90, 'Hairlight atau bleaching mulai dari 150k', 8)
ON CONFLICT DO NOTHING;

-- Seed capsters (UPSERT style)
INSERT INTO capsters (capster_name, phone, specialization, rating, years_of_experience, bio) 
VALUES
  ('Budi Santoso', '08123456789', 'all', 4.8, 5, 'Capster berpengalaman dengan spesialisasi modern haircut'),
  ('Agus Priyanto', '08123456790', 'haircut', 4.5, 3, 'Ahli dalam classic & modern hairstyles'),
  ('Dedi Wijaya', '08123456791', 'coloring', 4.9, 7, 'Spesialis pewarnaan rambut profesional')
ON CONFLICT DO NOTHING;

-- ===========================
-- STEP 4: UPDATE EXISTING TABLES
-- ===========================

-- Add capster_id to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

-- Update role constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('customer', 'admin', 'barbershop', 'capster'));

-- Add columns to bookings
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

-- Add columns to transactions
ALTER TABLE barbershop_transactions 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

ALTER TABLE barbershop_transactions 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL;

-- ===========================
-- STEP 5: CREATE INDEXES
-- ===========================

CREATE INDEX IF NOT EXISTS idx_booking_slots_date_capster ON booking_slots(date, capster_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_status ON booking_slots(status);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date_status ON booking_slots(date, status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_capster ON customer_reviews(capster_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON customer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_date ON customer_reviews(created_at);

-- ===========================
-- STEP 6: CREATE FUNCTIONS & TRIGGERS
-- ===========================

-- Referral code generator
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := 'BOZQ' || substring(md5(random()::text) from 1 for 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON customer_loyalty;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON customer_loyalty
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION generate_referral_code();

-- Update capster stats
CREATE OR REPLACE FUNCTION update_capster_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.capster_id IS NOT NULL THEN
    UPDATE capsters
    SET 
      total_customers_served = total_customers_served + 1,
      total_revenue_generated = total_revenue_generated + NEW.net_revenue,
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

-- Update capster rating
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
-- STEP 7: ENABLE RLS
-- ===========================

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===========================
-- STEP 8: CREATE RLS POLICIES (NO RECURSION!)
-- ===========================

-- ===== SERVICE CATALOG POLICIES =====
CREATE POLICY "service_catalog_read_all" ON service_catalog 
FOR SELECT USING (true);

CREATE POLICY "service_catalog_write_admin" ON service_catalog 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== CAPSTERS POLICIES =====
CREATE POLICY "capsters_read_all" ON capsters 
FOR SELECT USING (true);

CREATE POLICY "capsters_update_own" ON capsters 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "capsters_admin_all" ON capsters 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== BOOKING SLOTS POLICIES =====
CREATE POLICY "booking_slots_read_all" ON booking_slots 
FOR SELECT USING (true);

CREATE POLICY "booking_slots_manage_own" ON booking_slots 
FOR ALL USING (
  capster_id IN (SELECT id FROM capsters WHERE user_id = auth.uid())
);

CREATE POLICY "booking_slots_admin_all" ON booking_slots 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== CUSTOMER LOYALTY POLICIES =====
CREATE POLICY "customer_loyalty_read_own" ON customer_loyalty 
FOR SELECT USING (
  customer_phone IN (
    SELECT customer_phone FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'customer_phone' IS NOT NULL
  )
);

CREATE POLICY "customer_loyalty_read_capster_admin" ON customer_loyalty 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('capster', 'admin', 'barbershop')
  )
);

CREATE POLICY "customer_loyalty_update_admin" ON customer_loyalty 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== CUSTOMER REVIEWS POLICIES =====
CREATE POLICY "customer_reviews_read_approved" ON customer_reviews 
FOR SELECT USING (is_approved = true);

CREATE POLICY "customer_reviews_create_own" ON customer_reviews 
FOR INSERT WITH CHECK (
  customer_phone IN (
    SELECT raw_user_meta_data->>'customer_phone' FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
);

CREATE POLICY "customer_reviews_read_all_staff" ON customer_reviews 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('capster', 'admin', 'barbershop')
  )
);

CREATE POLICY "customer_reviews_manage_admin" ON customer_reviews 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== USER PROFILES POLICIES (FIX INFINITE RECURSION) =====
-- Simple policies using auth.uid() directly - NO recursion!
CREATE POLICY "user_profiles_select_own" ON user_profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "user_profiles_update_self" ON user_profiles 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "user_profiles_read_all_admin" ON user_profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===========================
-- VERIFICATION QUERIES
-- ===========================

-- Count tables
SELECT 
  'service_catalog' as table_name, 
  COUNT(*) as row_count
FROM service_catalog
UNION ALL
SELECT 'capsters', COUNT(*) FROM capsters
UNION ALL
SELECT 'booking_slots', COUNT(*) FROM booking_slots
UNION ALL
SELECT 'customer_loyalty', COUNT(*) FROM customer_loyalty
UNION ALL
SELECT 'customer_reviews', COUNT(*) FROM customer_reviews;

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_catalog', 'capsters', 'booking_slots', 'customer_loyalty', 'customer_reviews', 'user_profiles')
ORDER BY tablename, policyname;

-- ===========================
-- DEPLOYMENT COMPLETE!
-- ===========================
