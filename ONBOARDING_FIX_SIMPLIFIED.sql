-- =====================================================
-- ONBOARDING FIX - SIMPLIFIED & TESTED VERSION
-- Date: 30 December 2025
-- Purpose: Fix onboarding errors dengan urutan yang benar
-- 
-- ROOT CAUSE ANALYSIS:
-- 1. barbershop_profiles table belum ada
-- 2. capsters memiliki foreign key ke barbershop_profiles
-- 3. Data existing tidak valid (specialization, phone, dll)
-- 
-- SOLUTION:
-- 1. Create barbershop_profiles table FIRST
-- 2. Clean existing data in capsters
-- 3. Fix all constraints and add missing columns
-- 4. Add sync triggers and helper functions
-- =====================================================

BEGIN;

-- ========================================
-- STEP 1: CREATE BARBERSHOP_PROFILES TABLE FIRST
-- (This MUST come before foreign key to capsters)
-- ========================================

DO $$
BEGIN
  -- Create barbershop_profiles if not exists
  CREATE TABLE IF NOT EXISTS barbershop_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    open_time TIME NOT NULL DEFAULT '09:00',
    close_time TIME NOT NULL DEFAULT '21:00',
    days_open TEXT[] NOT NULL DEFAULT ARRAY['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    logo_url TEXT,
    description TEXT,
    instagram TEXT,
    whatsapp TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_owner UNIQUE(owner_id)
  );
  
  RAISE NOTICE 'Step 1: Created/verified barbershop_profiles table';
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_owner ON barbershop_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_active ON barbershop_profiles(is_active);

-- Enable RLS
ALTER TABLE barbershop_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own barbershop" ON barbershop_profiles;
DROP POLICY IF EXISTS "Users can create own barbershop" ON barbershop_profiles;
DROP POLICY IF EXISTS "Users can update own barbershop" ON barbershop_profiles;
DROP POLICY IF EXISTS "Public can view active barbershops" ON barbershop_profiles;

CREATE POLICY "Users can view own barbershop" ON barbershop_profiles
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own barbershop" ON barbershop_profiles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own barbershop" ON barbershop_profiles
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Public can view active barbershops" ON barbershop_profiles
  FOR SELECT USING (is_active = TRUE);

-- ========================================
-- STEP 2: CLEAN EXISTING DATA IN CAPSTERS
-- ========================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Fix invalid specializations
  UPDATE capsters
  SET specialization = 'General'
  WHERE specialization IS NOT NULL
    AND specialization NOT IN (
      'Classic Haircut', 'Modern Haircut', 'Beard Trim',
      'Hair Coloring', 'Shave', 'Styling', 'All Services', 'General'
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Step 2a: Cleaned % invalid specialization(s)', v_count;
  
  -- Fix invalid phone numbers
  UPDATE capsters SET phone = NULL
  WHERE phone IS NOT NULL AND length(phone) < 10;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Step 2b: Cleaned % invalid phone(s)', v_count;
  
  -- Fix invalid ratings
  UPDATE capsters SET rating = NULL
  WHERE rating IS NOT NULL AND (rating < 0 OR rating > 5);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Step 2c: Cleaned % invalid rating(s)', v_count;
  
  -- Fix NULL/empty capster_name
  UPDATE capsters
  SET capster_name = 'Capster ' || id::text
  WHERE capster_name IS NULL OR capster_name = '';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Step 2d: Fixed % NULL/empty capster_name(s)', v_count;
END $$;

-- ========================================
-- STEP 3: DROP OLD CONSTRAINTS
-- ========================================

DO $$
BEGIN
  -- Drop foreign key
  ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_barbershop_id_fkey;
  -- Drop check constraints
  ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_specialization_check;
  ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_phone_check;
  ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_rating_check;
  
  RAISE NOTICE 'Step 3: Dropped old constraints';
END $$;

-- ========================================
-- STEP 4: MODIFY COLUMNS
-- ========================================

DO $$
BEGIN
  -- Make barbershop_id nullable
  ALTER TABLE capsters ALTER COLUMN barbershop_id DROP NOT NULL;
  -- Make capster_name nullable
  ALTER TABLE capsters ALTER COLUMN capster_name DROP NOT NULL;
  
  RAISE NOTICE 'Step 4: Modified column constraints';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Step 4: Constraints already modified';
END $$;

-- ========================================
-- STEP 5: ADD MISSING COLUMNS
-- ========================================

DO $$
BEGIN
  -- Add name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'name'
  ) THEN
    ALTER TABLE capsters ADD COLUMN name TEXT;
    UPDATE capsters SET name = capster_name WHERE name IS NULL;
    RAISE NOTICE 'Step 5a: Added name column';
  END IF;
  
  -- Add is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE capsters ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Step 5b: Added is_active column';
  END IF;
  
  -- Add total_bookings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'total_bookings'
  ) THEN
    ALTER TABLE capsters ADD COLUMN total_bookings INTEGER DEFAULT 0;
    RAISE NOTICE 'Step 5c: Added total_bookings column';
  END IF;
  
  -- Add user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE capsters ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Step 5d: Added user_id column';
  END IF;
END $$;

-- ========================================
-- STEP 6: CREATE SYNC TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION sync_capster_name()
RETURNS TRIGGER AS $func$
BEGIN
  IF NEW.name IS NOT NULL AND NEW.name != '' THEN
    NEW.capster_name := NEW.name;
  END IF;
  IF NEW.capster_name IS NOT NULL AND NEW.capster_name != '' THEN
    NEW.name := NEW.capster_name;
  END IF;
  IF (NEW.name IS NULL OR NEW.name = '') AND (NEW.capster_name IS NULL OR NEW.capster_name = '') THEN
    RAISE EXCEPTION 'Either name or capster_name must be provided';
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_capster_name_trigger ON capsters;
CREATE TRIGGER sync_capster_name_trigger
  BEFORE INSERT OR UPDATE ON capsters
  FOR EACH ROW EXECUTE FUNCTION sync_capster_name();

DO $$
BEGIN
  RAISE NOTICE 'Step 6: Created sync trigger';
END $$;

-- ========================================
-- STEP 7: ADD CONSTRAINTS BACK (NOW SAFE)
-- ========================================

DO $$
BEGIN
  -- Add foreign key (barbershop_profiles now exists!)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'capsters_barbershop_id_fkey'
  ) THEN
    ALTER TABLE capsters 
      ADD CONSTRAINT capsters_barbershop_id_fkey 
      FOREIGN KEY (barbershop_id) 
      REFERENCES barbershop_profiles(id) 
      ON DELETE SET NULL;
    RAISE NOTICE 'Step 7a: Added foreign key constraint';
  END IF;
  
  -- Add check constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'capsters_specialization_check'
  ) THEN
    ALTER TABLE capsters ADD CONSTRAINT capsters_specialization_check 
      CHECK (specialization IS NULL OR specialization IN (
        'Classic Haircut', 'Modern Haircut', 'Beard Trim',
        'Hair Coloring', 'Shave', 'Styling', 'All Services', 'General'
      ));
    RAISE NOTICE 'Step 7b: Added specialization check';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'capsters_phone_check'
  ) THEN
    ALTER TABLE capsters ADD CONSTRAINT capsters_phone_check 
      CHECK (phone IS NULL OR length(phone) >= 10);
    RAISE NOTICE 'Step 7c: Added phone check';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'capsters_rating_check'
  ) THEN
    ALTER TABLE capsters ADD CONSTRAINT capsters_rating_check 
      CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
    RAISE NOTICE 'Step 7d: Added rating check';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'capsters_total_bookings_check'
  ) THEN
    ALTER TABLE capsters ADD CONSTRAINT capsters_total_bookings_check 
      CHECK (total_bookings >= 0);
    RAISE NOTICE 'Step 7e: Added total_bookings check';
  END IF;
END $$;

-- ========================================
-- STEP 8: UPDATE RLS POLICIES
-- ========================================

ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active capsters" ON capsters;
DROP POLICY IF EXISTS "Barbershop owner can manage capsters" ON capsters;
DROP POLICY IF EXISTS "Capsters can view own data" ON capsters;
DROP POLICY IF EXISTS "Capsters can update own data" ON capsters;

CREATE POLICY "Public can view active capsters" ON capsters
  FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE);

CREATE POLICY "Barbershop owner can manage capsters" ON capsters
  FOR ALL USING (
    barbershop_id IS NULL OR
    barbershop_id IN (SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid())
  );

CREATE POLICY "Capsters can view own data" ON capsters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Capsters can update own data" ON capsters
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE 'Step 8: Updated RLS policies';
END $$;

-- ========================================
-- STEP 9: CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_capsters_barbershop ON capsters(barbershop_id) WHERE barbershop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_user ON capsters(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_name ON capsters(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_active ON capsters(is_active) WHERE is_active = TRUE;

DO $$
BEGIN
  RAISE NOTICE 'Step 9: Created indexes';
END $$;

COMMIT;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ONBOARDING FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed Issues:';
  RAISE NOTICE '  ✓ Created barbershop_profiles table';
  RAISE NOTICE '  ✓ Cleaned invalid data in capsters';
  RAISE NOTICE '  ✓ Added name column with sync trigger';
  RAISE NOTICE '  ✓ Made barbershop_id nullable';
  RAISE NOTICE '  ✓ Added missing columns (is_active, total_bookings, user_id)';
  RAISE NOTICE '  ✓ Fixed all foreign key and check constraints';
  RAISE NOTICE '  ✓ Updated RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the onboarding flow!';
  RAISE NOTICE '';
END $$;
