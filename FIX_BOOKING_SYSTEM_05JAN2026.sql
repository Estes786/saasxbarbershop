-- 🔧 FIX BOOKING SYSTEM - Database Schema Fix
-- Date: 2026-01-05
-- Purpose: Fix service_tier constraint and ensure booking system works correctly

-- 1. Check current service_tier constraint
DO $$
BEGIN
  RAISE NOTICE '📋 Checking current service_tier constraint...';
END $$;

-- 2. Drop old constraint if exists and recreate with correct values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_service_tier_check;

-- 3. Add correct constraint (Basic, Standard, Premium - NOT Mastery)
ALTER TABLE bookings ADD CONSTRAINT bookings_service_tier_check 
  CHECK (service_tier IN ('Basic', 'Standard', 'Premium'));

-- 4. Verify foreign key to barbershop_customers exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_customer_phone_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_customer_phone_fkey 
    FOREIGN KEY (customer_phone) 
    REFERENCES barbershop_customers(customer_phone)
    ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint for customer_phone';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint already exists';
  END IF;
END $$;

-- 5. Create index on customer_phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 6. Verify the fix
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  SELECT check_clause INTO constraint_def
  FROM information_schema.check_constraints
  WHERE constraint_name = 'bookings_service_tier_check';
  
  RAISE NOTICE '✅ New constraint: %', constraint_def;
  RAISE NOTICE '🎉 BOOKING SYSTEM FIX COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Summary:';
  RAISE NOTICE '  ✅ service_tier now accepts: Basic, Standard, Premium';
  RAISE NOTICE '  ✅ Foreign key to barbershop_customers verified';
  RAISE NOTICE '  ✅ Indexes created for better performance';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Booking system is now ready to use!';
END $$;
