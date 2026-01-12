-- =====================================================
-- OASIS BI PRO: SAFE 3-ROLE ARCHITECTURE DATABASE SCHEMA
-- Created: 22 Desember 2025
-- Purpose: IDEMPOTENT & SAFE SQL Script for Production
-- All operations use IF NOT EXISTS / IF EXISTS patterns
-- =====================================================

-- ===========================
-- 1. SERVICE CATALOG TABLE
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

-- Seed service catalog data (use INSERT...ON CONFLICT DO NOTHING for idempotency)
INSERT INTO service_catalog (service_name, service_category, base_price, duration_minutes, description, display_order) VALUES
('Potong Rambut Dewasa', 'haircut', 18000, 30, 'Potong rambut standar untuk dewasa', 1),
('Potong Rambut Anak', 'haircut', 15000, 25, 'Potong rambut untuk anak-anak', 2),
('Cukur Balita', 'haircut', 18000, 20, 'Cukur rambut khusus balita', 3),
('Keramas', 'grooming', 10000, 15, 'Keramas dengan shampoo berkualitas', 4),
('Cukur Jenggot + Kumis', 'grooming', 10000, 20, 'Cukur jenggot dan kumis rapi', 5),
('Cukur + Keramas', 'package', 25000, 40, 'Paket potong rambut dan keramas', 6),
('Semir (Hitam)', 'coloring', 50000, 60, 'Semir rambut warna hitam', 7),
('Hairlight/Bleaching', 'coloring', 150000, 90, 'Hairlight atau bleaching rambut', 8)
ON CONFLICT DO NOTHING;

-- Enable RLS on service_catalog
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog_write_admin" ON service_catalog;

CREATE POLICY "service_catalog_read_all" ON service_catalog FOR SELECT USING (true);
CREATE POLICY "service_catalog_write_admin" ON service_catalog FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 2. CAPSTERS TABLE
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
  working_hours JSONB DEFAULT '{
    "monday": {"start": "09:00", "end": "20:00"},
    "tuesday": {"start": "09:00", "end": "20:00"},
    "wednesday": {"start": "09:00", "end": "20:00"},
    "thursday": {"start": "09:00", "end": "20:00"},
    "friday": {"start": "09:00", "end": "20:00"},
    "saturday": {"start": "09:00", "end": "21:00"},
    "sunday": {"start": "09:00", "end": "21:00"}
  }'::jsonb,
  profile_image_url TEXT,
  bio TEXT,
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed capster data (safe with ON CONFLICT)
INSERT INTO capsters (capster_name, phone, specialization, rating, years_of_experience, bio) VALUES
('Budi Santoso', '08123456789', 'all', 4.8, 5, 'Capster berpengalaman dengan spesialisasi modern haircut'),
('Agus Priyanto', '08123456790', 'haircut', 4.5, 3, 'Ahli dalam classic & modern hairstyles'),
('Dedi Wijaya', '08123456791', 'coloring', 4.9, 7, 'Spesialis pewarnaan rambut profesional')
ON CONFLICT DO NOTHING;

-- Enable RLS on capsters
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "capsters_read_all" ON capsters;
DROP POLICY IF EXISTS "capsters_update_own" ON capsters;
DROP POLICY IF EXISTS "capsters_admin_all" ON capsters;
DROP POLICY IF EXISTS "capsters_insert_own" ON capsters;

CREATE POLICY "capsters_read_all" ON capsters FOR SELECT USING (true);
CREATE POLICY "capsters_update_own" ON capsters FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "capsters_insert_own" ON capsters FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "capsters_admin_all" ON capsters FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 3. BOOKING SLOTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capster_id UUID REFERENCES capsters(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  customer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES service_catalog(id),
  booking_status TEXT DEFAULT 'available' CHECK (booking_status IN ('available', 'booked', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capster_id, booking_date, start_time)
);

-- Enable RLS on booking_slots
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "booking_slots_read_all" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_customer_book" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_capster_manage" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_admin_all" ON booking_slots;

CREATE POLICY "booking_slots_read_all" ON booking_slots FOR SELECT USING (true);
CREATE POLICY "booking_slots_customer_book" ON booking_slots FOR UPDATE 
  USING (customer_id = auth.uid() OR is_booked = FALSE);
CREATE POLICY "booking_slots_capster_manage" ON booking_slots FOR ALL 
  USING (EXISTS (SELECT 1 FROM capsters WHERE user_id = auth.uid() AND id = booking_slots.capster_id));
CREATE POLICY "booking_slots_admin_all" ON booking_slots FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 4. CUSTOMER LOYALTY TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT UNIQUE NOT NULL REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  loyalty_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  rewards_earned INTEGER DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  next_predicted_visit TIMESTAMPTZ,
  prediction_confidence NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on customer_loyalty
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "customer_loyalty_read_own" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_capster_read" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_admin_all" ON customer_loyalty;

CREATE POLICY "customer_loyalty_read_own" ON customer_loyalty FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND customer_phone = customer_loyalty.customer_phone));
CREATE POLICY "customer_loyalty_capster_read" ON customer_loyalty FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'capster'));
CREATE POLICY "customer_loyalty_admin_all" ON customer_loyalty FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 5. CUSTOMER REVIEWS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  capster_id UUID REFERENCES capsters(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  friendliness INTEGER CHECK (friendliness >= 1 AND friendliness <= 5),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on customer_reviews
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "customer_reviews_read_all" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_create_own" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_admin_all" ON customer_reviews;

CREATE POLICY "customer_reviews_read_all" ON customer_reviews FOR SELECT USING (true);
CREATE POLICY "customer_reviews_create_own" ON customer_reviews FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND customer_phone = customer_reviews.customer_phone));
CREATE POLICY "customer_reviews_admin_all" ON customer_reviews FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================
-- 6. ADD CAPSTER_ID TO USER_PROFILES (IF NOT EXISTS)
-- ===========================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='capster_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===========================
-- 7. ADD CAPSTER_ID TO BOOKINGS (IF NOT EXISTS)
-- ===========================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='capster_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===========================
-- 8. ADD CAPSTER_ID TO BARBERSHOP_TRANSACTIONS (IF NOT EXISTS)
-- ===========================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='barbershop_transactions' AND column_name='capster_id'
  ) THEN
    ALTER TABLE barbershop_transactions ADD COLUMN capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===========================
-- 9. CREATE TRIGGER FUNCTIONS (DROP IF EXISTS, THEN CREATE)
-- ===========================

-- Function: Update capster stats on new transaction
DROP FUNCTION IF EXISTS update_capster_stats CASCADE;
CREATE OR REPLACE FUNCTION update_capster_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE capsters
  SET 
    total_customers_served = total_customers_served + 1,
    total_revenue_generated = total_revenue_generated + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.capster_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update capster stats on new transaction
DROP TRIGGER IF EXISTS trigger_update_capster_stats ON barbershop_transactions;
CREATE TRIGGER trigger_update_capster_stats
AFTER INSERT ON barbershop_transactions
FOR EACH ROW
WHEN (NEW.capster_id IS NOT NULL)
EXECUTE FUNCTION update_capster_stats();

-- Function: Update capster rating on new review
DROP FUNCTION IF EXISTS update_capster_rating CASCADE;
CREATE OR REPLACE FUNCTION update_capster_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE capsters
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM customer_reviews
    WHERE capster_id = NEW.capster_id AND is_verified = TRUE
  ),
  updated_at = NOW()
  WHERE id = NEW.capster_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update capster rating on new review
DROP TRIGGER IF EXISTS trigger_update_capster_rating ON customer_reviews;
CREATE TRIGGER trigger_update_capster_rating
AFTER INSERT OR UPDATE ON customer_reviews
FOR EACH ROW
WHEN (NEW.capster_id IS NOT NULL AND NEW.is_verified = TRUE)
EXECUTE FUNCTION update_capster_rating();

-- ===========================
-- 10. SUCCESS MESSAGE
-- ===========================
DO $$
BEGIN
  RAISE NOTICE '✅ 3-ROLE SCHEMA APPLIED SUCCESSFULLY!';
  RAISE NOTICE '📊 Tables Created: service_catalog, capsters, booking_slots, customer_loyalty, customer_reviews';
  RAISE NOTICE '🔐 RLS Policies: Applied for all 3 roles (customer, capster, admin)';
  RAISE NOTICE '🔄 Triggers: Auto-update capster stats & ratings';
  RAISE NOTICE '✨ Your database is now ready for production!';
END $$;
