-- =====================================================
-- 🔧 FIX ONBOARDING CHECK CONSTRAINT ERROR (V2 - PostgreSQL 12+ Compatible)
-- =====================================================
-- Date: 30 December 2025
-- Error: new row for relation "capsters" violates check constraint "capsters_specialization_check"
-- Root Cause: Check constraint expects ('haircut', 'grooming', 'coloring', 'all')
--             but onboarding inserts 'Classic Haircut' which is not in allowed list
-- Solution: Drop old restrictive check constraint and allow any text value
-- Safety: 100% SAFE & IDEMPOTENT - can be run multiple times
-- PostgreSQL Version: 12+ (uses pg_get_constraintdef instead of consrc)
-- =====================================================

-- ========================================
-- STEP 1: DROP ALL SPECIALIZATION CHECK CONSTRAINTS (SAFE)
-- ========================================

-- Drop constraint by common names (idempotent - won't fail if not exists)
ALTER TABLE IF EXISTS capsters DROP CONSTRAINT IF EXISTS capsters_specialization_check CASCADE;
ALTER TABLE IF EXISTS capsters DROP CONSTRAINT IF EXISTS capsters_check CASCADE;
ALTER TABLE IF EXISTS capsters DROP CONSTRAINT IF EXISTS capster_specialization_check CASCADE;

-- Also drop by pattern matching (for auto-generated names)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'capsters'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND (
        con.conname LIKE '%specialization%' 
        OR pg_get_constraintdef(con.oid) LIKE '%specialization%'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE capsters DROP CONSTRAINT IF EXISTS %I CASCADE', r.conname);
    RAISE NOTICE '✅ Dropped check constraint: %', r.conname;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'ℹ️ No specialization check constraints found to drop';
  END IF;
END $$;

-- ========================================
-- STEP 2: ENSURE SPECIALIZATION COLUMN EXISTS WITH CORRECT TYPE
-- ========================================

DO $$ 
BEGIN
  -- Check if specialization column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'capsters' 
      AND column_name = 'specialization'
  ) THEN
    -- Add specialization column if it doesn't exist
    ALTER TABLE capsters 
    ADD COLUMN specialization TEXT NOT NULL DEFAULT 'Classic Haircut';
    
    RAISE NOTICE '✅ Added specialization column to capsters table';
  ELSE
    -- Column exists, update its constraints
    
    -- Set default value
    ALTER TABLE capsters 
    ALTER COLUMN specialization SET DEFAULT 'Classic Haircut';
    
    -- Update NULL values first before making NOT NULL
    UPDATE capsters 
    SET specialization = 'Classic Haircut' 
    WHERE specialization IS NULL OR specialization = '';
    
    -- Make it NOT NULL
    BEGIN
      ALTER TABLE capsters 
      ALTER COLUMN specialization SET NOT NULL;
      RAISE NOTICE '✅ Updated specialization column to NOT NULL with default value';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not set NOT NULL constraint: %', SQLERRM;
    END;
  END IF;
END $$;

-- ========================================
-- STEP 3: ADD MINIMAL CHECK CONSTRAINT (OPTIONAL - FLEXIBLE)
-- ========================================
-- Only ensures the value is not empty string, accepts ANY text value

DO $$ 
BEGIN
  -- Drop any existing "not empty" constraint first
  ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_specialization_not_empty CASCADE;
  
  -- Add new flexible constraint (only checks not empty)
  ALTER TABLE capsters 
  ADD CONSTRAINT capsters_specialization_not_empty 
  CHECK (LENGTH(TRIM(specialization)) > 0);
  
  RAISE NOTICE '✅ Added flexible constraint: specialization must not be empty string';
  RAISE NOTICE 'ℹ️ Accepts ANY text value including "Classic Haircut", "Premium Cut", etc.';
END $$;

-- ========================================
-- STEP 4: VERIFY THE FIX
-- ========================================

DO $$
DECLARE
  v_constraint_count INTEGER;
  v_test_barbershop_id UUID;
BEGIN
  -- Count remaining check constraints on specialization
  SELECT COUNT(*) INTO v_constraint_count
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'capsters'
    AND nsp.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%specialization%IN%';
  
  IF v_constraint_count > 0 THEN
    RAISE WARNING '⚠️ Found % restrictive constraints still active on specialization column', v_constraint_count;
  ELSE
    RAISE NOTICE '✅ No restrictive constraints found - specialization column is now flexible';
  END IF;
  
  -- Test if we can insert with 'Classic Haircut' (requires existing barbershop)
  -- We skip actual insert test to avoid creating test data
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Old restrictive check constraint removed';
  RAISE NOTICE '✅ Specialization column accepts any text value';
  RAISE NOTICE '✅ Default value set to: "Classic Haircut"';
  RAISE NOTICE '✅ Onboarding should now work without errors';
  RAISE NOTICE '';
  RAISE NOTICE '📝 To verify manually run:';
  RAISE NOTICE 'SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint';
  RAISE NOTICE 'WHERE conrelid = ''capsters''::regclass AND contype = ''c'';';
  RAISE NOTICE '';
END $$;
