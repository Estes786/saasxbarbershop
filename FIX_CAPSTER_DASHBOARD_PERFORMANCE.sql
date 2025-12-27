-- ================================================================
-- FIX: CAPSTER DASHBOARD PERFORMANCE & DATA CLEANUP
-- Description: Optimize performance dan cleanup unused data
-- Date: 2025-12-27
-- Status: Production Ready & Idempotent
-- ================================================================

-- 1. Create index untuk optimize query performance
CREATE INDEX IF NOT EXISTS idx_bookings_capster_date 
ON bookings(capster_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_capsters_user_id 
ON capsters(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_capster_id 
ON user_profiles(capster_id);

-- 2. Optional: Remove orphaned capsters (yang tidak punya user_id dan tidak punya booking)
-- Uncomment jika ingin menghapus capster yang tidak digunakan
/*
DELETE FROM capsters 
WHERE user_id IS NULL 
AND id NOT IN (
  SELECT DISTINCT capster_id 
  FROM bookings 
  WHERE capster_id IS NOT NULL
);
*/

-- 3. Create function untuk auto-assign first available capster jika tidak dipilih
CREATE OR REPLACE FUNCTION get_default_capster_id()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  default_capster_id UUID;
BEGIN
  -- Get first available capster
  SELECT id INTO default_capster_id
  FROM capsters
  WHERE is_available = TRUE
  ORDER BY created_at
  LIMIT 1;
  
  RETURN default_capster_id;
END;
$$;

-- 4. Add trigger untuk set default capster jika NULL (optional - hanya jika diperlukan)
-- Uncomment jika ingin auto-assign capster ketika tidak dipilih
/*
CREATE OR REPLACE FUNCTION trg_set_default_capster()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.capster_id IS NULL THEN
    NEW.capster_id := get_default_capster_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_default_capster_on_booking ON bookings;
CREATE TRIGGER set_default_capster_on_booking
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_set_default_capster();
*/

-- 5. Update existing NULL capster_id dengan default capster (optional)
-- Uncomment jika ada booking lama tanpa capster_id
/*
UPDATE bookings
SET capster_id = get_default_capster_id()
WHERE capster_id IS NULL;
*/

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check index creation
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('bookings', 'capsters', 'user_profiles')
  AND indexname LIKE '%idx_%'
ORDER BY tablename, indexname;

-- Check capsters without user_id
SELECT 
  id,
  capster_name,
  user_id,
  is_available,
  (SELECT COUNT(*) FROM bookings WHERE capster_id = capsters.id) as booking_count
FROM capsters
WHERE user_id IS NULL;

-- Check bookings without capster_id
SELECT COUNT(*) as bookings_without_capster
FROM bookings
WHERE capster_id IS NULL;

-- Performance check: Average query time
EXPLAIN ANALYZE
SELECT *
FROM bookings
WHERE capster_id = '159e6af1-0f0b-47b8-8111-06b713a5ab64'
  AND booking_date >= CURRENT_DATE
  AND booking_date < CURRENT_DATE + INTERVAL '1 day'
  AND status IN ('pending', 'confirmed', 'in-progress', 'completed');

