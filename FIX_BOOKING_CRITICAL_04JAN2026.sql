-- =====================================
-- COMPREHENSIVE BOOKING FIX
-- Date: 04 January 2026
-- Issue: Customer cannot book online
-- =====================================

-- 1. AUTO-APPROVE ALL EXISTING CAPSTERS
-- This allows customers to immediately book with any capster
UPDATE capsters
SET 
  is_approved = true,
  updated_at = NOW()
WHERE is_approved = false OR is_approved IS NULL;

-- 2. SET DEFAULT BOOKING STATUS FOR EXISTING BOOKINGS
UPDATE bookings
SET booking_status = 'pending'
WHERE booking_status IS NULL;

-- 3. ENSURE BOOKING STATUS HAS DEFAULT VALUE
ALTER TABLE bookings
ALTER COLUMN booking_status SET DEFAULT 'pending';

-- 4. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_capsters_approved 
ON capsters(is_approved) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_bookings_customer 
ON bookings(customer_phone);

CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
ON bookings(booking_date, booking_status);

-- 5. VERIFY RESULTS
DO $$
DECLARE
  approved_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO approved_count FROM capsters WHERE is_approved = true;
  SELECT COUNT(*) INTO total_count FROM capsters;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTS:';
  RAISE NOTICE '   - Total Capsters: %', total_count;
  RAISE NOTICE '   - Approved Capsters: %', approved_count;
  RAISE NOTICE '   - Ready for Booking: %', CASE WHEN approved_count > 0 THEN 'YES ✅' ELSE 'NO ❌' END;
  RAISE NOTICE '';
END $$;
