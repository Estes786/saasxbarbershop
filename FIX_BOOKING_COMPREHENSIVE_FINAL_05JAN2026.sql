-- ============================================================
-- 🚀 COMPREHENSIVE BOOKING SYSTEM FIX - FINAL
-- ============================================================
-- Date: 05 Januari 2026
-- Purpose: Fix booking history & optimize performance
-- Issues Fixed:
--   1. ❌ Booking history tidak muncul
--   2. ❌ Loading lambat saat booking
--   3. ❌ Phone number matching issues
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: ADD INDEXES FOR PERFORMANCE
-- ============================================================

-- Index untuk booking queries (faster loading)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone 
ON bookings(customer_phone);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_date 
ON bookings(booking_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON bookings(status);

-- Composite index untuk common queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_date 
ON bookings(customer_phone, booking_date DESC, booking_time DESC);

-- Index untuk service_catalog (faster service loading)
CREATE INDEX IF NOT EXISTS idx_service_catalog_active 
ON service_catalog(is_active) 
WHERE is_active = true;

-- Index untuk capsters (faster capster loading)
CREATE INDEX IF NOT EXISTS idx_capsters_active_approved 
ON capsters(is_active, status) 
WHERE is_active = true AND status = 'approved';

RAISE NOTICE '✅ Performance indexes created';

-- ============================================================
-- STEP 2: ADD PHONE NORMALIZATION FUNCTION
-- ============================================================

-- Function to normalize phone numbers for consistent matching
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Remove spaces, dashes, and leading +62
  RETURN regexp_replace(
    regexp_replace(phone, '^\\+?62', '0'),
    '[\\s\\-]',
    '',
    'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

RAISE NOTICE '✅ Phone normalization function created';

-- ============================================================
-- STEP 3: ADD NORMALIZED PHONE COLUMN (for faster queries)
-- ============================================================

-- Add normalized_phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'normalized_phone'
  ) THEN
    ALTER TABLE bookings ADD COLUMN normalized_phone TEXT;
    RAISE NOTICE '✅ Added normalized_phone column';
  ELSE
    RAISE NOTICE 'ℹ️  normalized_phone column already exists';
  END IF;
END $$;

-- Update existing bookings with normalized phone
UPDATE bookings 
SET normalized_phone = normalize_phone(customer_phone)
WHERE normalized_phone IS NULL OR normalized_phone = '';

-- Create index on normalized_phone
CREATE INDEX IF NOT EXISTS idx_bookings_normalized_phone 
ON bookings(normalized_phone);

RAISE NOTICE '✅ Normalized phone data updated';

-- ============================================================
-- STEP 4: CREATE TRIGGER FOR AUTO-NORMALIZATION
-- ============================================================

-- Trigger function to auto-normalize phone on insert/update
CREATE OR REPLACE FUNCTION trigger_normalize_booking_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_phone := normalize_phone(NEW.customer_phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS normalize_booking_phone_trigger ON bookings;

-- Create new trigger
CREATE TRIGGER normalize_booking_phone_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_booking_phone();

RAISE NOTICE '✅ Auto-normalization trigger created';

-- ============================================================
-- STEP 5: OPTIMIZE RLS POLICIES FOR BETTER PERFORMANCE
-- ============================================================

-- Drop and recreate customer bookings policy with optimization
DROP POLICY IF EXISTS "Customers can view own bookings" ON bookings;

CREATE POLICY "Customers can view own bookings" ON bookings
  FOR SELECT
  USING (
    normalize_phone(customer_phone) = normalize_phone(auth.jwt() ->> 'user_metadata' ->> 'customer_phone')
    OR 
    customer_phone = (auth.jwt() ->> 'user_metadata' ->> 'customer_phone')
  );

RAISE NOTICE '✅ Optimized RLS policy for customer bookings';

-- ============================================================
-- STEP 6: CREATE HELPER VIEW FOR BOOKING HISTORY
-- ============================================================

-- Materialized view for faster booking queries (optional, can refresh periodically)
CREATE OR REPLACE VIEW booking_history_view AS
SELECT 
  b.id,
  b.customer_phone,
  b.normalized_phone,
  b.booking_date,
  b.booking_time,
  b.status,
  b.queue_number,
  b.customer_notes,
  b.rating,
  b.feedback,
  b.total_price,
  b.created_at,
  -- Service info
  sc.service_name,
  sc.base_price as service_price,
  -- Capster info
  c.capster_name,
  c.phone as capster_phone,
  -- Branch info
  br.branch_name,
  br.branch_code
FROM bookings b
LEFT JOIN service_catalog sc ON b.service_id = sc.id
LEFT JOIN capsters c ON b.capster_id = c.id
LEFT JOIN branches br ON b.branch_id = br.id
ORDER BY b.booking_date DESC, b.booking_time DESC;

RAISE NOTICE '✅ Booking history view created';

-- ============================================================
-- STEP 7: ADD HELPFUL DATABASE FUNCTIONS
-- ============================================================

-- Function to get customer booking history (with phone variants)
CREATE OR REPLACE FUNCTION get_customer_bookings(customer_phone_input TEXT)
RETURNS TABLE (
  id UUID,
  booking_date DATE,
  booking_time TIME,
  status TEXT,
  queue_number INTEGER,
  customer_notes TEXT,
  rating INTEGER,
  total_price DECIMAL,
  service_name TEXT,
  service_price DECIMAL,
  capster_name TEXT,
  branch_name TEXT
) AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Normalize input phone
  normalized := normalize_phone(customer_phone_input);
  
  -- Return matching bookings
  RETURN QUERY
  SELECT 
    b.id,
    b.booking_date,
    b.booking_time,
    b.status,
    b.queue_number,
    b.customer_notes,
    b.rating,
    b.total_price,
    sc.service_name,
    sc.base_price as service_price,
    c.capster_name,
    br.branch_name
  FROM bookings b
  LEFT JOIN service_catalog sc ON b.service_id = sc.id
  LEFT JOIN capsters c ON b.capster_id = c.id
  LEFT JOIN branches br ON b.branch_id = br.id
  WHERE 
    b.normalized_phone = normalized
    OR normalize_phone(b.customer_phone) = normalized
    OR b.customer_phone = customer_phone_input
  ORDER BY b.booking_date DESC, b.booking_time DESC;
END;
$$ LANGUAGE plpgsql STABLE;

RAISE NOTICE '✅ Customer bookings function created';

-- ============================================================
-- STEP 8: ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================================

-- Update statistics for better query plans
ANALYZE bookings;
ANALYZE service_catalog;
ANALYZE capsters;
ANALYZE branches;
ANALYZE barbershop_customers;

RAISE NOTICE '✅ Table statistics updated';

-- ============================================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================================

RAISE NOTICE ' ';
RAISE NOTICE '================================================';
RAISE NOTICE '🎯 VERIFICATION & DIAGNOSTICS';
RAISE NOTICE '================================================';

-- Show booking counts
RAISE NOTICE ' ';
RAISE NOTICE '📊 BOOKING STATISTICS:';
RAISE NOTICE '   Total Bookings: %', (SELECT COUNT(*) FROM bookings);
RAISE NOTICE '   Pending: %', (SELECT COUNT(*) FROM bookings WHERE status = 'pending');
RAISE NOTICE '   Confirmed: %', (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed');
RAISE NOTICE '   Completed: %', (SELECT COUNT(*) FROM bookings WHERE status = 'completed');

-- Show capsters status
RAISE NOTICE ' ';
RAISE NOTICE '👥 CAPSTER STATUS:';
RAISE NOTICE '   Total Capsters: %', (SELECT COUNT(*) FROM capsters);
RAISE NOTICE '   Approved: %', (SELECT COUNT(*) FROM capsters WHERE status = 'approved');
RAISE NOTICE '   Active: %', (SELECT COUNT(*) FROM capsters WHERE is_active = true);

-- Show services
RAISE NOTICE ' ';
RAISE NOTICE '💈 SERVICE CATALOG:';
RAISE NOTICE '   Total Services: %', (SELECT COUNT(*) FROM service_catalog);
RAISE NOTICE '   Active Services: %', (SELECT COUNT(*) FROM service_catalog WHERE is_active = true);

-- Show recent bookings with phone numbers
RAISE NOTICE ' ';
RAISE NOTICE '📱 RECENT BOOKINGS (Phone Numbers):';
DO $$
DECLARE
  booking_record RECORD;
BEGIN
  FOR booking_record IN 
    SELECT customer_phone, normalized_phone, booking_date, status 
    FROM bookings 
    ORDER BY created_at DESC 
    LIMIT 5
  LOOP
    RAISE NOTICE '   Phone: % | Normalized: % | Date: % | Status: %', 
      booking_record.customer_phone,
      booking_record.normalized_phone,
      booking_record.booking_date,
      booking_record.status;
  END LOOP;
END $$;

RAISE NOTICE ' ';
RAISE NOTICE '================================================';
RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY!';
RAISE NOTICE '================================================';
RAISE NOTICE ' ';
RAISE NOTICE '📋 WHAT WAS FIXED:';
RAISE NOTICE '   ✅ Added performance indexes';
RAISE NOTICE '   ✅ Phone normalization function';
RAISE NOTICE '   ✅ Auto-normalization trigger';
RAISE NOTICE '   ✅ Optimized RLS policies';
RAISE NOTICE '   ✅ Created booking history view';
RAISE NOTICE '   ✅ Added helper functions';
RAISE NOTICE ' ';
RAISE NOTICE '🚀 NEXT STEPS:';
RAISE NOTICE '   1. Test booking from customer dashboard';
RAISE NOTICE '   2. Check booking history appears correctly';
RAISE NOTICE '   3. Verify phone number matching works';
RAISE NOTICE '   4. Monitor performance improvement';
RAISE NOTICE ' ';

COMMIT;

-- ============================================================
-- USAGE EXAMPLES (for testing)
-- ============================================================
-- 
-- Test phone normalization:
-- SELECT normalize_phone('+6281234567890');
-- SELECT normalize_phone('08123456789');
-- SELECT normalize_phone('0812-3456-789');
-- 
-- Get customer bookings:
-- SELECT * FROM get_customer_bookings('+6281234567890');
-- SELECT * FROM get_customer_bookings('08123456789');
-- 
-- View booking history:
-- SELECT * FROM booking_history_view WHERE normalized_phone = normalize_phone('08123456789');
-- 
-- ============================================================
