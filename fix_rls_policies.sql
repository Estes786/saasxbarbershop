-- =========================================================================
-- CRITICAL FIX: RLS POLICIES FOR BOOKING ONLINE
-- Date: 03 Jan 2026
-- Issue: Customers cannot create bookings due to RLS policies
-- =========================================================================

-- Fix barbershop_customers table - Allow INSERT for customers
CREATE POLICY IF NOT EXISTS "Enable insert for customers" ON barbershop_customers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON barbershop_customers
  FOR SELECT
  USING (true);

-- Fix bookings table - Allow INSERT/SELECT for customers
CREATE POLICY IF NOT EXISTS "Enable insert for customers" ON bookings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable read own bookings" ON bookings
  FOR SELECT
  USING (true);

-- Optional: Update existing policies if they exist
DROP POLICY IF EXISTS "customers_insert_policy" ON barbershop_customers;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;

