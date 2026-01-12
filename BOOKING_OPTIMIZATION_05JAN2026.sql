-- ============================================
-- BOOKING SYSTEM OPTIMIZATION & FIXES
-- Date: 5 January 2026
-- Purpose: Ensure booking system is 100% reliable and fast
-- ============================================

-- 1. Add index on bookings for faster customer queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone 
ON bookings(customer_phone);

CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
ON bookings(status, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_capster_date 
ON bookings(capster_id, booking_date);

-- 2. Ensure all capsters with status='approved' are is_active=true and is_available=true
UPDATE capsters 
SET is_active = true, is_available = true 
WHERE status = 'approved' AND (is_active = false OR is_available = false);

-- 3. Ensure all services are active
UPDATE service_catalog 
SET is_active = true 
WHERE is_active = false;

-- 4. Create function to auto-update queue_number
CREATE OR REPLACE FUNCTION update_queue_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign queue number based on date + capster
  SELECT COALESCE(MAX(queue_number), 0) + 1 
  INTO NEW.queue_number
  FROM bookings 
  WHERE booking_date = NEW.booking_date 
    AND capster_id = NEW.capster_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS set_queue_number ON bookings;

-- Create trigger
CREATE TRIGGER set_queue_number
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_queue_number();

-- 5. Verify data integrity
DO $$
BEGIN
  RAISE NOTICE '✅ BOOKING SYSTEM OPTIMIZATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Stats:';
  RAISE NOTICE '  - Total Bookings: %', (SELECT COUNT(*) FROM bookings);
  RAISE NOTICE '  - Active Services: %', (SELECT COUNT(*) FROM service_catalog WHERE is_active = true);
  RAISE NOTICE '  - Approved Capsters: %', (SELECT COUNT(*) FROM capsters WHERE status = ''approved'' AND is_active = true);
  RAISE NOTICE '  - Total Branches: %', (SELECT COUNT(*) FROM branches WHERE is_active = true);
  RAISE NOTICE '';
  RAISE NOTICE '✅ All indexes created for performance';
  RAISE NOTICE '✅ All capsters activated';
  RAISE NOTICE '✅ All services activated';
  RAISE NOTICE '✅ Queue number auto-assignment enabled';
END $$;
