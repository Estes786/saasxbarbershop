-- ================================================================
-- PERFORMANCE OPTIMIZATION - BALIK.LAGI SYSTEM
-- Date: 02 January 2026
-- Purpose: Fix slow booking performance & optimize queries
-- ================================================================

-- =============================================================
-- PART 1: ADD DATABASE INDEXES FOR FASTER QUERIES
-- =============================================================

-- Index for customer bookings query (most common query)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone_date 
ON bookings(customer_phone, booking_date DESC);

-- Index for branch-specific queries
CREATE INDEX IF NOT EXISTS idx_bookings_branch_date 
ON bookings(branch_id, booking_date DESC);

-- Index for capster bookings
CREATE INDEX IF NOT EXISTS idx_bookings_capster_status 
ON bookings(capster_id, status);

-- Index for service catalog by branch
CREATE INDEX IF NOT EXISTS idx_service_catalog_branch_active 
ON service_catalog(branch_id, is_active);

-- Index for capsters by branch
CREATE INDEX IF NOT EXISTS idx_capsters_branch_available 
ON capsters(branch_id, is_available);

-- Index for status queries (for dashboard)
CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
ON bookings(status, booking_date);

-- Composite index for booking conflicts check
CREATE INDEX IF NOT EXISTS idx_bookings_conflict_check 
ON bookings(capster_id, booking_date, status) 
WHERE status NOT IN ('cancelled', 'completed');

-- =============================================================
-- PART 2: OPTIMIZE RLS POLICIES (Remove slow policies)
-- =============================================================

-- Drop and recreate bookings RLS policies with better performance
DROP POLICY IF EXISTS "Customers can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Capsters can view their bookings" ON bookings;

-- Optimized Customer policies
CREATE POLICY "customers_view_own_bookings" ON bookings
  FOR SELECT
  USING (customer_phone IN (
    SELECT customer_phone FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'customer'
  ));

CREATE POLICY "customers_create_bookings" ON bookings
  FOR INSERT
  WITH CHECK (customer_phone IN (
    SELECT customer_phone FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'customer'
  ));

-- Optimized Capster policy
CREATE POLICY "capsters_view_assigned_bookings" ON bookings
  FOR SELECT
  USING (
    capster_id IN (
      SELECT id FROM capsters 
      WHERE capster_id IN (
        SELECT capster_id FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'capster'
      )
    )
  );

-- =============================================================
-- PART 3: ADD MATERIALIZED VIEW FOR PERFORMANCE (Optional)
-- =============================================================

-- Create a function to refresh booking stats
CREATE OR REPLACE FUNCTION refresh_booking_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This can be used for caching heavy queries
  -- For now, we rely on indexes
  NULL;
END;
$$;

-- =============================================================
-- PART 4: OPTIMIZE BOOKING CREATION
-- =============================================================

-- Add a function to create booking with validation
CREATE OR REPLACE FUNCTION create_booking_optimized(
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_branch_id UUID,
  p_service_id UUID,
  p_capster_id UUID,
  p_booking_date TIMESTAMP,
  p_booking_time TEXT,
  p_service_tier TEXT,
  p_customer_notes TEXT
)
RETURNS TABLE(booking_id UUID, queue_number INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id UUID;
  v_queue_number INT;
BEGIN
  -- Check for conflicts (fast with index)
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE capster_id = p_capster_id
      AND booking_date::DATE = p_booking_date::DATE
      AND booking_time = p_booking_time
      AND status NOT IN ('cancelled', 'completed')
  ) THEN
    RAISE EXCEPTION 'Capster sudah ada booking di waktu tersebut';
  END IF;

  -- Generate queue number for today
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO v_queue_number
  FROM bookings
  WHERE booking_date::DATE = p_booking_date::DATE
    AND branch_id = p_branch_id;

  -- Insert booking
  INSERT INTO bookings (
    customer_phone,
    customer_name,
    branch_id,
    service_id,
    capster_id,
    booking_date,
    booking_time,
    service_tier,
    customer_notes,
    queue_number,
    status,
    booking_source
  ) VALUES (
    p_customer_phone,
    p_customer_name,
    p_branch_id,
    p_service_id,
    p_capster_id,
    p_booking_date,
    p_booking_time,
    p_service_tier,
    p_customer_notes,
    v_queue_number,
    'pending',
    'online'
  )
  RETURNING id INTO v_booking_id;

  RETURN QUERY SELECT v_booking_id, v_queue_number;
END;
$$;

-- =============================================================
-- PART 5: ANALYZE TABLES (Update Statistics)
-- =============================================================

ANALYZE bookings;
ANALYZE service_catalog;
ANALYZE capsters;
ANALYZE branches;
ANALYZE user_profiles;

-- =============================================================
-- VERIFICATION QUERIES
-- =============================================================

-- Check indexes created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('bookings', 'service_catalog', 'capsters')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY tablename, policyname;

RAISE NOTICE '✅ Performance optimization complete!';
RAISE NOTICE '📊 Database indexes added for faster queries';
RAISE NOTICE '🔒 RLS policies optimized';
RAISE NOTICE '⚡ Booking creation optimized';
