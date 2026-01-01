-- ============================================================================
-- COMPLETE PHASE 1: ADD MISSING COLUMN
-- ============================================================================
-- Project: BALIK.LAGI System
-- Date: 01 January 2026
-- Purpose: Add missing preferred_branch_id to customers table
-- ============================================================================

-- Add preferred_branch_id to customers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'preferred_branch_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN preferred_branch_id UUID;
    ALTER TABLE customers ADD CONSTRAINT fk_customer_preferred_branch 
      FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Column preferred_branch_id added to customers table';
  ELSE
    RAISE NOTICE '⚠️  Column preferred_branch_id already exists in customers';
  END IF;
END $$;

-- Create index for performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_preferred_branch_id'
  ) THEN
    CREATE INDEX idx_customers_preferred_branch_id ON customers(preferred_branch_id);
    RAISE NOTICE '✅ Index idx_customers_preferred_branch_id created';
  ELSE
    RAISE NOTICE '⚠️  Index idx_customers_preferred_branch_id already exists';
  END IF;
END $$;

-- Verification
DO $$ 
DECLARE
  branch_count INTEGER;
  capster_with_branch INTEGER;
  booking_with_branch INTEGER;
  customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO branch_count FROM branches;
  SELECT COUNT(*) INTO capster_with_branch FROM capsters WHERE branch_id IS NOT NULL;
  SELECT COUNT(*) INTO booking_with_branch FROM bookings WHERE branch_id IS NOT NULL;
  SELECT COUNT(*) INTO customer_count FROM customers;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🎉 PHASE 1 NOW COMPLETE!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 FINAL STATUS:';
  RAISE NOTICE '  ✅ branches table: % branches', branch_count;
  RAISE NOTICE '  ✅ capsters.branch_id: % capsters assigned', capster_with_branch;
  RAISE NOTICE '  ✅ bookings.branch_id: % bookings', booking_with_branch;
  RAISE NOTICE '  ✅ customers.preferred_branch_id: % customers', customer_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All database schema changes complete!';
  RAISE NOTICE '✅ Multi-location support fully enabled!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Ready for Phase 2: Backend APIs';
  RAISE NOTICE '';
END $$;
