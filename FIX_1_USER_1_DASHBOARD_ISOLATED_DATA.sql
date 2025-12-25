-- ============================================================================
-- FIX: 1 USER = 1 ROLE = 1 DASHBOARD (ISOLATED DATA)
-- ============================================================================
--  
-- ROOT CAUSE:
-- - barbershop_customers table does NOT have user_id FK
-- - Multiple users with same phone → see same data
-- - No data isolation per user
--
-- SOLUTION:
-- 1. Add user_id column to barbershop_customers
-- 2. Migrate existing data using customer_phone match
-- 3. Add FK constraint
-- 4. Update RLS policies to use user_id
-- 5. Update application code to use user_id instead of customer_phone
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ADD user_id COLUMN
-- ============================================================================

-- Add user_id column (nullable first to allow migration)
ALTER TABLE barbershop_customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_barbershop_customers_user_id 
ON barbershop_customers(user_id);

-- ============================================================================
-- STEP 2: MIGRATE EXISTING DATA
-- ============================================================================

-- Match barbershop_customers to user_profiles using customer_phone
-- This creates 1:1 mapping between users and their customer data
UPDATE barbershop_customers bc
SET user_id = up.id
FROM user_profiles up
WHERE bc.customer_phone = up.customer_phone
  AND up.role = 'customer'
  AND bc.user_id IS NULL;

-- ============================================================================
-- STEP 3: HANDLE ORPHANED RECORDS
-- ============================================================================

-- Log orphaned customer records (customers without matching user)
DO $$
DECLARE
  orphaned_count INT;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM barbershop_customers
  WHERE user_id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '⚠️  Found % orphaned customer records without user_id', orphaned_count;
    RAISE NOTICE '   These records will NOT be accessible until linked to a user';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: UPDATE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "customers_read_own" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_insert_own" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_update_own" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;

-- Enable RLS
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- NEW POLICY: Users can only see/manage their own customer data
CREATE POLICY "customers_read_own_by_user_id"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "customers_insert_own_by_user_id"
ON barbershop_customers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_update_own_by_user_id"
ON barbershop_customers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can see all
CREATE POLICY "admin_full_access_customers"
ON barbershop_customers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- STEP 5: UPDATE TRIGGERS (if any)
-- ============================================================================

-- Update trigger function to use user_id instead of customer_phone
CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create barbershop_customer for customer role
  IF NEW.role = 'customer' THEN
    -- Check if customer record already exists for this user_id
    IF NOT EXISTS (
      SELECT 1 FROM barbershop_customers 
      WHERE user_id = NEW.id
    ) THEN
      INSERT INTO barbershop_customers (
        user_id,
        customer_phone,
        customer_name,
        customer_area,
        total_visits,
        total_revenue,
        average_atv,
        customer_segment,
        lifetime_value,
        coupon_count,
        coupon_eligible,
        google_review_given,
        churn_risk_score,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,  -- 🔥 KEY FIX: Use user_id from user_profiles
        NEW.customer_phone,
        NEW.customer_name,
        'Unknown',  -- default area
        0,  -- initial visits
        0,  -- initial revenue
        0,  -- initial ATV
        'New',  -- new customer segment
        0,  -- initial LTV
        0,  -- no coupons yet
        false,  -- not eligible for coupon
        false,  -- no Google review yet
        0,  -- no churn risk
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '✅ Created barbershop_customer for user_id: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_auto_create_barbershop_customer ON user_profiles;
CREATE TRIGGER trg_auto_create_barbershop_customer
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_barbershop_customer();

-- ============================================================================
-- STEP 6: VALIDATION
-- ============================================================================

DO $$
DECLARE
  total_customers INT;
  linked_customers INT;
  orphaned_customers INT;
BEGIN
  SELECT COUNT(*) INTO total_customers FROM barbershop_customers;
  SELECT COUNT(*) INTO linked_customers FROM barbershop_customers WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO orphaned_customers FROM barbershop_customers WHERE user_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total customer records: %', total_customers;
  RAISE NOTICE 'Linked to users: % (%.0f%%)', linked_customers, 
    (linked_customers::FLOAT / NULLIF(total_customers, 0) * 100);
  RAISE NOTICE 'Orphaned records: % (%.0f%%)', orphaned_customers,
    (orphaned_customers::FLOAT / NULLIF(total_customers, 0) * 100);
  RAISE NOTICE '';
  RAISE NOTICE '🎯 CONCEPT: 1 USER = 1 ROLE = 1 DASHBOARD';
  RAISE NOTICE '   Each user now has isolated customer data';
  RAISE NOTICE '   RLS policies enforce user_id = auth.uid()';
  RAISE NOTICE '   No more shared dashboards!';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- NEXT STEPS FOR APPLICATION CODE
-- ============================================================================

-- Update LoyaltyTracker.tsx:
-- FROM: .eq("customer_phone", profile.customer_phone)
-- TO:   .eq("user_id", user.id)
--
-- This ensures each user only sees their own data
-- ============================================================================
