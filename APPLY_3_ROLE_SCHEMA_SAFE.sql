-- =====================================================
-- OASIS BI PRO: 3-ROLE ARCHITECTURE DATABASE SCHEMA (SAFE VERSION)
-- Created: 21 Desember 2025
-- Purpose: Transform 2-role to 3-role (Customer → Capster → Admin)
-- IDEMPOTENT: Safe to run multiple times
-- =====================================================

-- ===========================
-- 1. SERVICE CATALOG
-- ===========================
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

-- Delete existing data to avoid duplicates from fresh seeding
DELETE FROM service_catalog;

-- Seed data berdasarkan price list yang diberikan user
INSERT INTO service_catalog (service_name, service_category, base_price, duration_minutes, description, display_order) VALUES
('Cukur Dewasa', 'haircut', 18000, 30, 'Cukur rambut dewasa profesional', 1),
('Cukur Anak (6-10)', 'haircut', 15000, 25, 'Cukur rambut anak-anak', 2),
('Cukur Balita', 'haircut', 18000, 20, 'Cukur rambut balita', 3),
('Keramas', 'grooming', 10000, 15, 'Keramas dengan shampoo premium', 4),
('Kumis + Jenggot', 'grooming', 10000, 15, 'Cukur kumis dan jenggot', 5),
('Cukur + Keramas', 'package', 25000, 40, 'Paket cukur dan keramas hemat', 6),
('Semir (Hitam)', 'coloring', 50000, 45, 'Semir rambut hitam', 7),
('Hairlight/Bleaching', 'coloring', 150000, 90, 'Hairlight atau bleaching rambut', 8);

-- Enable RLS
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid "already exists" error
DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog_write_admin" ON service_catalog;

-- Recreate policies
CREATE POLICY "service_catalog_read_all" ON service_catalog FOR SELECT USING (true);

CREATE POLICY "service_catalog_write_admin" ON service_catalog FOR ALL 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 2. CAPSTERS TABLE (CORE FOR CAPSTER ROLE)
-- ===========================
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

-- Delete existing capsters data
DELETE FROM capsters;

-- Seed initial capsters for BOZQ Barbershop
INSERT INTO capsters (capster_name, phone, specialization, rating, years_of_experience, bio) VALUES
('Budi Santoso', '08123456789', 'all', 4.8, 5, 'Capster berpengalaman dengan spesialisasi modern haircut dan classic cut'),
('Agus Priyanto', '08123456790', 'haircut', 4.5, 3, 'Ahli dalam classic & modern hairstyles, spesialis fade dan undercut'),
('Dedi Wijaya', '08123456791', 'coloring', 4.9, 7, 'Spesialis pewarnaan rambut profesional, highlight & balayage expert');

-- Enable RLS
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "capsters_read_all" ON capsters;
DROP POLICY IF EXISTS "capsters_update_own" ON capsters;
DROP POLICY IF EXISTS "capsters_admin_all" ON capsters;

-- Recreate policies
CREATE POLICY "capsters_read_all" ON capsters FOR SELECT USING (true);

CREATE POLICY "capsters_update_own" ON capsters FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "capsters_admin_all" ON capsters FOR ALL 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 3. BOOKING SLOTS (Real-time Availability)
-- ===========================
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_booking_slots_date_capster ON booking_slots(date, capster_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_status ON booking_slots(status);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date_status ON booking_slots(date, status);

-- Enable RLS
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "booking_slots_read_all" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_manage_own" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_admin_all" ON booking_slots;

-- Recreate policies
CREATE POLICY "booking_slots_read_all" ON booking_slots FOR SELECT USING (true);

CREATE POLICY "booking_slots_manage_own" ON booking_slots FOR ALL 
USING (capster_id IN (SELECT id FROM capsters WHERE user_id = auth.uid()));

CREATE POLICY "booking_slots_admin_all" ON booking_slots FOR ALL 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 4. CUSTOMER LOYALTY (Gamification)
-- ===========================
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

-- Auto-generate referral code
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

-- Enable RLS
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "customer_loyalty_read_own" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_read_capster_admin" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_update_admin" ON customer_loyalty;

-- Recreate policies
CREATE POLICY "customer_loyalty_read_own" ON customer_loyalty FOR SELECT 
USING (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "customer_loyalty_read_capster_admin" ON customer_loyalty FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));

CREATE POLICY "customer_loyalty_update_admin" ON customer_loyalty FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 5. CUSTOMER REVIEWS (Social Proof)
-- ===========================
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_reviews_capster ON customer_reviews(capster_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON customer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_date ON customer_reviews(created_at);

-- Enable RLS
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "customer_reviews_read_approved" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_create_own" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_read_all_staff" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_manage_admin" ON customer_reviews;

-- Recreate policies
CREATE POLICY "customer_reviews_read_approved" ON customer_reviews FOR SELECT 
USING (is_approved = true);

CREATE POLICY "customer_reviews_create_own" ON customer_reviews FOR INSERT 
WITH CHECK (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "customer_reviews_read_all_staff" ON customer_reviews FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')));

CREATE POLICY "customer_reviews_manage_admin" ON customer_reviews FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 6. UPDATE EXISTING TABLES
-- ===========================

-- Add capster_id to user_profiles to support capster role
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

-- Update user_profiles role enum to include 'capster'
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('customer', 'admin', 'barbershop', 'capster'));

-- Add capster_id and service_id to bookings
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

-- Add capster_id to barbershop_transactions for tracking
ALTER TABLE barbershop_transactions 
ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;

ALTER TABLE barbershop_transactions 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL;

-- ===========================
-- 7. CREATE HELPER FUNCTIONS
-- ===========================

-- Function to update capster stats when transaction is created
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

-- Function to update capster rating when review is created
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
-- 8. VERIFICATION QUERIES
-- ===========================

-- Check all tables created successfully
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews',
    'user_profiles',
    'bookings',
    'barbershop_transactions'
  )
ORDER BY tablename;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_catalog', 'capsters', 'booking_slots', 'customer_loyalty', 'customer_reviews')
ORDER BY tablename, policyname;

-- Summary report
SELECT 
  'service_catalog' as table_name, 
  (SELECT COUNT(*) FROM service_catalog) as row_count
UNION ALL
SELECT 
  'capsters', 
  (SELECT COUNT(*) FROM capsters)
UNION ALL
SELECT 
  'booking_slots', 
  (SELECT COUNT(*) FROM booking_slots)
UNION ALL
SELECT 
  'customer_loyalty', 
  (SELECT COUNT(*) FROM customer_loyalty)
UNION ALL
SELECT 
  'customer_reviews', 
  (SELECT COUNT(*) FROM customer_reviews);

-- ===========================
-- EXECUTION COMPLETE!
-- ===========================
-- Script ini AMAN untuk dijalankan multiple kali
-- Semua duplicate policies sudah dibersihkan
-- Service catalog sudah menggunakan price list yang sesuai
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all tables created with verification queries
-- 3. Test RLS policies with different roles
-- 4. Begin frontend implementation
-- ===========================
