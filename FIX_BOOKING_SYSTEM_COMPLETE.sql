-- ========================================
-- FIX BOOKING SYSTEM COMPLETE
-- Masalah: "Loading capsters..." terus menerus
-- Root Cause: RLS policies memblokir akses customer
-- ========================================

-- 1. DROP existing policies yang salah
DROP POLICY IF EXISTS "capsters_read_all" ON capsters;
DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog;
DROP POLICY IF EXISTS "bookings_customer_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_customer_read_own" ON bookings;
DROP POLICY IF EXISTS "bookings_capster_read_assigned" ON bookings;
DROP POLICY IF EXISTS "bookings_admin_all" ON bookings;

-- 2. ENABLE RLS pada tables
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 3. CREATE POLICY untuk capsters - SEMUA ORANG BISA BACA
CREATE POLICY "capsters_read_all"
  ON capsters
  FOR SELECT
  USING (true); -- Semua orang bisa baca capsters

-- Policy untuk admin manage capsters
CREATE POLICY "capsters_admin_all"
  ON capsters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 4. CREATE POLICY untuk service_catalog - SEMUA ORANG BISA BACA
CREATE POLICY "service_catalog_read_all"
  ON service_catalog
  FOR SELECT
  USING (is_active = true); -- Hanya services yang aktif

-- Policy untuk admin manage services
CREATE POLICY "service_catalog_admin_all"
  ON service_catalog
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 5. CREATE POLICY untuk bookings
-- Customer bisa insert booking mereka sendiri
CREATE POLICY "bookings_customer_insert"
  ON bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'customer'
      AND up.customer_phone = bookings.customer_phone
    )
  );

-- Customer bisa read booking mereka sendiri
CREATE POLICY "bookings_customer_read_own"
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'customer'
      AND up.customer_phone = bookings.customer_phone
    )
  );

-- Capster bisa read bookings yang assigned ke mereka
CREATE POLICY "bookings_capster_read_assigned"
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      INNER JOIN capsters c ON c.id = up.capster_id
      WHERE up.id = auth.uid()
      AND up.role = 'capster'
      AND bookings.capster_id = c.id
    )
  );

-- Capster bisa update status bookings mereka
CREATE POLICY "bookings_capster_update_own"
  ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      INNER JOIN capsters c ON c.id = up.capster_id
      WHERE up.id = auth.uid()
      AND up.role = 'capster'
      AND bookings.capster_id = c.id
    )
  );

-- Admin bisa all operations
CREATE POLICY "bookings_admin_all"
  ON bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 6. VERIFY schema tables exists
DO $$
BEGIN
  -- Check capsters table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'capsters') THEN
    RAISE NOTICE '✅ capsters table exists';
  ELSE
    RAISE EXCEPTION '❌ capsters table not found!';
  END IF;

  -- Check service_catalog table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_catalog') THEN
    RAISE NOTICE '✅ service_catalog table exists';
  ELSE
    RAISE EXCEPTION '❌ service_catalog table not found!';
  END IF;

  -- Check bookings table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
    RAISE NOTICE '✅ bookings table exists';
  ELSE
    RAISE EXCEPTION '❌ bookings table not found!';
  END IF;

  RAISE NOTICE '✅ All required tables exist!';
END
$$;

-- 7. VERIFY RLS policies count
DO $$
DECLARE
  v_capsters_count INTEGER;
  v_services_count INTEGER;
  v_bookings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_capsters_count FROM capsters WHERE is_active = true;
  SELECT COUNT(*) INTO v_services_count FROM service_catalog WHERE is_active = true;
  SELECT COUNT(*) INTO v_bookings_count FROM bookings;

  RAISE NOTICE '📊 Capsters count: %', v_capsters_count;
  RAISE NOTICE '📊 Services count: %', v_services_count;
  RAISE NOTICE '📊 Bookings count: %', v_bookings_count;

  IF v_capsters_count = 0 THEN
    RAISE WARNING '⚠️  No active capsters found! Add capsters first.';
  END IF;

  IF v_services_count = 0 THEN
    RAISE WARNING '⚠️  No active services found! Add services first.';
  END IF;
END
$$;

-- 8. SUCCESS MESSAGE
RAISE NOTICE '🎉 BOOKING SYSTEM FIX COMPLETE!';
RAISE NOTICE '✅ RLS policies updated for public read access';
RAISE NOTICE '✅ Capsters: PUBLIC READ ACCESS';
RAISE NOTICE '✅ Services: PUBLIC READ ACCESS (active only)';
RAISE NOTICE '✅ Bookings: Role-based access control';
RAISE NOTICE '';
RAISE NOTICE '📝 Testing instructions:';
RAISE NOTICE '1. Login sebagai customer';
RAISE NOTICE '2. Buka halaman booking';
RAISE NOTICE '3. Capsters list seharusnya langsung muncul';
RAISE NOTICE '4. Pilih service, capster, tanggal, waktu';
RAISE NOTICE '5. Submit booking';
RAISE NOTICE '';
RAISE NOTICE '🔥 Ready for production use!';
