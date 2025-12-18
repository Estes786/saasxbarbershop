-- ========================================
-- MIGRATION: Create user_profiles and bookings tables
-- Date: December 18, 2025
-- Purpose: Role-based access control and booking system
-- ========================================

-- ========================================
-- 1. CREATE user_profiles TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  customer_phone TEXT REFERENCES barbershop_customers(customer_phone),
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_phone ON user_profiles(customer_phone);

-- ========================================
-- 2. ENABLE RLS ON user_profiles
-- ========================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Admin can see all profiles
DROP POLICY IF EXISTS "Admin full access user_profiles" ON user_profiles;
CREATE POLICY "Admin full access user_profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer can only see their own profile
DROP POLICY IF EXISTS "Customer see own profile" ON user_profiles;
CREATE POLICY "Customer see own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- Customer can update their own profile
DROP POLICY IF EXISTS "Customer update own profile" ON user_profiles;
CREATE POLICY "Customer update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- ========================================
-- 3. UPDATE RLS POLICIES FOR barbershop_transactions
-- ========================================

-- Customer can only see their own transactions
DROP POLICY IF EXISTS "Customer see own transactions" ON barbershop_transactions;
CREATE POLICY "Customer see own transactions" ON barbershop_transactions
  FOR SELECT USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ========================================
-- 4. UPDATE RLS POLICIES FOR barbershop_customers
-- ========================================

-- Customer can only see their own customer profile
DROP POLICY IF EXISTS "Customer see own customer profile" ON barbershop_customers;
CREATE POLICY "Customer see own customer profile" ON barbershop_customers
  FOR SELECT USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customer can update their own customer profile
DROP POLICY IF EXISTS "Customer update own customer profile" ON barbershop_customers;
CREATE POLICY "Customer update own customer profile" ON barbershop_customers
  FOR UPDATE USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ========================================
-- 5. CREATE bookings TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone),
  customer_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_tier TEXT NOT NULL CHECK (service_tier IN ('Basic', 'Premium', 'Mastery')),
  requested_capster TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ========================================
-- 6. ENABLE RLS ON bookings
-- ========================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Admin can see all bookings
DROP POLICY IF EXISTS "Admin full access bookings" ON bookings;
CREATE POLICY "Admin full access bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer can see their own bookings
DROP POLICY IF EXISTS "Customer see own bookings" ON bookings;
CREATE POLICY "Customer see own bookings" ON bookings
  FOR SELECT USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customer can create their own bookings
DROP POLICY IF EXISTS "Customer create own bookings" ON bookings;
CREATE POLICY "Customer create own bookings" ON bookings
  FOR INSERT WITH CHECK (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customer can update their own bookings (before confirmed)
DROP POLICY IF EXISTS "Customer update own bookings" ON bookings;
CREATE POLICY "Customer update own bookings" ON bookings
  FOR UPDATE USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
    AND status = 'pending'
  );

-- ========================================
-- 7. CREATE TRIGGERS FOR updated_at
-- ========================================

-- Trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bookings TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

COMMENT ON TABLE user_profiles IS 'User authentication and role management';
COMMENT ON TABLE bookings IS 'Customer booking appointments';
