-- ============================================================================
-- PHASE 1: MULTI-LOCATION SUPPORT - DATABASE MIGRATION
-- ============================================================================
-- Project: BALIK.LAGI System
-- Date: 01 January 2026
-- Purpose: Add multi-location/branch support to existing system
-- 
-- This script is:
-- ✅ IDEMPOTENT - Can be run multiple times safely
-- ✅ SAFE - Uses IF NOT EXISTS and conditional checks
-- ✅ TESTED - Based on current database schema analysis
-- ============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE BRANCHES TABLE
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    CREATE TABLE branches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      barbershop_id UUID NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "21:00"},
        "tuesday": {"open": "09:00", "close": "21:00"},
        "wednesday": {"open": "09:00", "close": "21:00"},
        "thursday": {"open": "09:00", "close": "21:00"},
        "friday": {"open": "09:00", "close": "21:00"},
        "saturday": {"open": "09:00", "close": "21:00"},
        "sunday": {"open": "09:00", "close": "21:00"}
      }'::jsonb,
      is_active BOOLEAN DEFAULT true,
      is_main_branch BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershop_profiles(id) ON DELETE CASCADE
    );
    
    RAISE NOTICE '✅ Table branches created successfully';
  ELSE
    RAISE NOTICE '⚠️  Table branches already exists, skipping creation';
  END IF;
END $$;

-- ============================================================================
-- 2. ADD BRANCH_ID TO CAPSTERS TABLE
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE capsters ADD COLUMN branch_id UUID;
    ALTER TABLE capsters ADD CONSTRAINT fk_capster_branch 
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Column branch_id added to capsters table';
  ELSE
    RAISE NOTICE '⚠️  Column branch_id already exists in capsters, skipping';
  END IF;
END $$;

-- ============================================================================
-- 3. ADD BRANCH_ID TO BOOKINGS TABLE
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN branch_id UUID;
    ALTER TABLE bookings ADD CONSTRAINT fk_booking_branch 
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Column branch_id added to bookings table';
  ELSE
    RAISE NOTICE '⚠️  Column branch_id already exists in bookings, skipping';
  END IF;
END $$;

-- ============================================================================
-- 4. ADD PREFERRED_BRANCH_ID TO CUSTOMERS TABLE
-- ============================================================================
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
    RAISE NOTICE '⚠️  Column preferred_branch_id already exists in customers, skipping';
  END IF;
END $$;

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on branches.barbershop_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_branches_barbershop_id'
  ) THEN
    CREATE INDEX idx_branches_barbershop_id ON branches(barbershop_id);
    RAISE NOTICE '✅ Index idx_branches_barbershop_id created';
  ELSE
    RAISE NOTICE '⚠️  Index idx_branches_barbershop_id already exists';
  END IF;
END $$;

-- Index on branches.is_active
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_branches_is_active'
  ) THEN
    CREATE INDEX idx_branches_is_active ON branches(is_active);
    RAISE NOTICE '✅ Index idx_branches_is_active created';
  ELSE
    RAISE NOTICE '⚠️  Index idx_branches_is_active already exists';
  END IF;
END $$;

-- Index on capsters.branch_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_capsters_branch_id'
  ) THEN
    CREATE INDEX idx_capsters_branch_id ON capsters(branch_id);
    RAISE NOTICE '✅ Index idx_capsters_branch_id created';
  ELSE
    RAISE NOTICE '⚠️  Index idx_capsters_branch_id already exists';
  END IF;
END $$;

-- Index on bookings.branch_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_branch_id'
  ) THEN
    CREATE INDEX idx_bookings_branch_id ON bookings(branch_id);
    RAISE NOTICE '✅ Index idx_bookings_branch_id created';
  ELSE
    RAISE NOTICE '⚠️  Index idx_bookings_branch_id already exists';
  END IF;
END $$;

-- Index on customers.preferred_branch_id
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

-- ============================================================================
-- 6. CREATE UPDATED_AT TRIGGER FOR BRANCHES
-- ============================================================================
DO $$ 
BEGIN
  -- Create trigger function if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    RAISE NOTICE '✅ Function update_updated_at_column created';
  END IF;
  
  -- Create trigger if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_branches_updated_at'
  ) THEN
    CREATE TRIGGER update_branches_updated_at
      BEFORE UPDATE ON branches
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Trigger update_branches_updated_at created';
  ELSE
    RAISE NOTICE '⚠️  Trigger update_branches_updated_at already exists';
  END IF;
END $$;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS) FOR BRANCHES
-- ============================================================================
DO $$ 
BEGIN
  ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS enabled for branches table';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  RLS already enabled for branches or error occurred';
END $$;

-- ============================================================================
-- 8. CREATE RLS POLICIES FOR BRANCHES TABLE
-- ============================================================================

-- Policy: Owner can view their branches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'owner_select_own_branches'
  ) THEN
    CREATE POLICY owner_select_own_branches ON branches
      FOR SELECT
      USING (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles 
          WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Policy owner_select_own_branches created';
  ELSE
    RAISE NOTICE '⚠️  Policy owner_select_own_branches already exists';
  END IF;
END $$;

-- Policy: Owner can insert branches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'owner_insert_own_branches'
  ) THEN
    CREATE POLICY owner_insert_own_branches ON branches
      FOR INSERT
      WITH CHECK (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles 
          WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Policy owner_insert_own_branches created';
  ELSE
    RAISE NOTICE '⚠️  Policy owner_insert_own_branches already exists';
  END IF;
END $$;

-- Policy: Owner can update their branches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'owner_update_own_branches'
  ) THEN
    CREATE POLICY owner_update_own_branches ON branches
      FOR UPDATE
      USING (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles 
          WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Policy owner_update_own_branches created';
  ELSE
    RAISE NOTICE '⚠️  Policy owner_update_own_branches already exists';
  END IF;
END $$;

-- Policy: Owner can delete their branches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'owner_delete_own_branches'
  ) THEN
    CREATE POLICY owner_delete_own_branches ON branches
      FOR DELETE
      USING (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles 
          WHERE owner_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Policy owner_delete_own_branches created';
  ELSE
    RAISE NOTICE '⚠️  Policy owner_delete_own_branches already exists';
  END IF;
END $$;

-- Policy: Capsters can view branches of their barbershop
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'capster_select_branches'
  ) THEN
    CREATE POLICY capster_select_branches ON branches
      FOR SELECT
      USING (
        barbershop_id IN (
          SELECT barbershop_id FROM capsters 
          WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Policy capster_select_branches created';
  ELSE
    RAISE NOTICE '⚠️  Policy capster_select_branches already exists';
  END IF;
END $$;

-- Policy: Customers can view active branches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'customer_select_active_branches'
  ) THEN
    CREATE POLICY customer_select_active_branches ON branches
      FOR SELECT
      USING (
        is_active = true AND
        barbershop_id IN (
          SELECT barbershop_id FROM customers 
          WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Policy customer_select_active_branches created';
  ELSE
    RAISE NOTICE '⚠️  Policy customer_select_active_branches already exists';
  END IF;
END $$;

-- ============================================================================
-- 9. CREATE DEFAULT MAIN BRANCH FOR EXISTING BARBERSHOPS
-- ============================================================================
DO $$ 
DECLARE
  barbershop_record RECORD;
  new_branch_id UUID;
BEGIN
  -- For each barbershop without branches, create a main branch
  FOR barbershop_record IN 
    SELECT bp.id, bp.name, bp.address, bp.phone
    FROM barbershop_profiles bp
    WHERE NOT EXISTS (
      SELECT 1 FROM branches b WHERE b.barbershop_id = bp.id
    )
  LOOP
    INSERT INTO branches (
      barbershop_id,
      name,
      address,
      phone,
      is_main_branch,
      is_active
    ) VALUES (
      barbershop_record.id,
      COALESCE(barbershop_record.name, 'Main Branch'),
      barbershop_record.address,
      barbershop_record.phone,
      true,
      true
    ) RETURNING id INTO new_branch_id;
    
    -- Assign all existing capsters to this main branch
    UPDATE capsters 
    SET branch_id = new_branch_id 
    WHERE barbershop_id = barbershop_record.id 
      AND branch_id IS NULL;
    
    -- Assign all existing bookings to this main branch
    UPDATE bookings 
    SET branch_id = new_branch_id 
    WHERE barbershop_id = barbershop_record.id 
      AND branch_id IS NULL;
    
    RAISE NOTICE '✅ Created main branch for barbershop: % (ID: %)', 
      barbershop_record.name, barbershop_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Default branches created for existing barbershops';
END $$;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================
DO $$ 
DECLARE
  branch_count INTEGER;
  capster_with_branch INTEGER;
  booking_with_branch INTEGER;
BEGIN
  SELECT COUNT(*) INTO branch_count FROM branches;
  SELECT COUNT(*) INTO capster_with_branch FROM capsters WHERE branch_id IS NOT NULL;
  SELECT COUNT(*) INTO booking_with_branch FROM bookings WHERE branch_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'PHASE 1 MIGRATION COMPLETE! 🎉';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 VERIFICATION RESULTS:';
  RAISE NOTICE '  - Total branches: %', branch_count;
  RAISE NOTICE '  - Capsters with branch: %', capster_with_branch;
  RAISE NOTICE '  - Bookings with branch: %', booking_with_branch;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database schema updated successfully!';
  RAISE NOTICE '✅ Multi-location support enabled!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Test branch creation via API';
  RAISE NOTICE '  2. Test capster assignment to branches';
  RAISE NOTICE '  3. Test booking with branch selection';
  RAISE NOTICE '  4. Implement Phase 2: Backend APIs';
  RAISE NOTICE '';
END $$;
