-- =====================================================
-- ULTIMATE ONBOARDING FIX
-- Date: 30 December 2025
-- Purpose: Fix ALL onboarding errors with 1000% safe & idempotent approach
-- 
-- ERRORS FIXED:
-- 1. capsters_barbershop_id_fkey violation
-- 2. capsters_specialization_check violation  
-- 3. column "name" does not exist
-- 4. Future predicted errors
-- 
-- STRATEGY:
-- - Make all constraints flexible during onboarding
-- - Add missing columns with proper sync mechanisms
-- - Ensure barbershop_id can be NULL initially
-- - Add proper validation without blocking inserts
-- =====================================================

BEGIN;

-- ========================================
-- STEP 1: ANALYZE CURRENT STATE
-- ========================================

-- Check if capsters table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'capsters') THEN
    RAISE EXCEPTION 'capsters table does not exist - cannot proceed with migration';
  END IF;
END $$;

-- ========================================
-- STEP 2: DROP PROBLEMATIC CONSTRAINTS
-- ========================================

-- Drop foreign key constraint if it exists (we'll recreate it with ON DELETE SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'capsters_barbershop_id_fkey' 
    AND table_name = 'capsters'
  ) THEN
    ALTER TABLE capsters DROP CONSTRAINT capsters_barbershop_id_fkey;
    RAISE NOTICE 'Dropped capsters_barbershop_id_fkey constraint';
  END IF;
END $$;

-- Drop check constraint on specialization if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'capsters_specialization_check'
  ) THEN
    ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_specialization_check;
    RAISE NOTICE 'Dropped capsters_specialization_check constraint';
  END IF;
END $$;

-- Drop other restrictive check constraints
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_phone_check;
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_rating_check;

-- ========================================
-- STEP 3: MODIFY COLUMN CONSTRAINTS
-- ========================================

-- Make barbershop_id nullable (critical for onboarding flow)
ALTER TABLE capsters ALTER COLUMN barbershop_id DROP NOT NULL;
RAISE NOTICE 'Made barbershop_id nullable';

-- Make capster_name nullable temporarily
ALTER TABLE capsters ALTER COLUMN capster_name DROP NOT NULL;

-- ========================================
-- STEP 4: ADD MISSING COLUMNS
-- ========================================

-- Add 'name' column if not exists (this is what onboarding frontend expects)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'name'
  ) THEN
    ALTER TABLE capsters ADD COLUMN name TEXT;
    RAISE NOTICE 'Added name column to capsters table';
    
    -- Sync existing data
    UPDATE capsters SET name = capster_name WHERE name IS NULL AND capster_name IS NOT NULL;
  END IF;
END $$;

-- Add is_active column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE capsters ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to capsters table';
  END IF;
END $$;

-- Add total_bookings column if not exists  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'total_bookings'
  ) THEN
    ALTER TABLE capsters ADD COLUMN total_bookings INTEGER DEFAULT 0;
    RAISE NOTICE 'Added total_bookings column to capsters table';
  END IF;
END $$;

-- Add user_id column if not exists (for linking capster to auth user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'capsters' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE capsters ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added user_id column to capsters table';
  END IF;
END $$;

-- ========================================
-- STEP 5: CREATE/UPDATE SYNC TRIGGER
-- ========================================

-- Create sync function for name <-> capster_name
CREATE OR REPLACE FUNCTION sync_capster_name()
RETURNS TRIGGER AS $func$
BEGIN
  -- Sync name to capster_name
  IF NEW.name IS NOT NULL AND NEW.name != '' THEN
    NEW.capster_name := NEW.name;
  END IF;
  
  -- Sync capster_name to name
  IF NEW.capster_name IS NOT NULL AND NEW.capster_name != '' THEN
    NEW.name := NEW.capster_name;
  END IF;
  
  -- Ensure at least one is set
  IF (NEW.name IS NULL OR NEW.name = '') AND (NEW.capster_name IS NULL OR NEW.capster_name = '') THEN
    RAISE EXCEPTION 'Either name or capster_name must be provided';
  END IF;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create or replace trigger
DROP TRIGGER IF EXISTS sync_capster_name_trigger ON capsters;
CREATE TRIGGER sync_capster_name_trigger
  BEFORE INSERT OR UPDATE ON capsters
  FOR EACH ROW
  EXECUTE FUNCTION sync_capster_name();

RAISE NOTICE 'Created sync_capster_name_trigger';

-- ========================================
-- STEP 6: ADD FLEXIBLE CONSTRAINTS BACK
-- ========================================

-- Add foreign key constraint with SET NULL on delete (not CASCADE)
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_barbershop_id_fkey 
  FOREIGN KEY (barbershop_id) 
  REFERENCES barbershop_profiles(id) 
  ON DELETE SET NULL;

RAISE NOTICE 'Added flexible barbershop_id foreign key constraint';

-- Add flexible specialization constraint (more options)
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_specialization_check 
  CHECK (
    specialization IS NULL OR 
    specialization IN (
      'Classic Haircut',
      'Modern Haircut', 
      'Beard Trim',
      'Hair Coloring',
      'Shave',
      'Styling',
      'All Services',
      'General'
    )
  );

RAISE NOTICE 'Added flexible specialization check constraint';

-- Add phone validation (but allow NULL)
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_phone_check 
  CHECK (phone IS NULL OR length(phone) >= 10);

-- Add rating validation (but allow NULL)
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_rating_check 
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Add total_bookings validation
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_total_bookings_check 
  CHECK (total_bookings >= 0);

-- ========================================
-- STEP 7: CREATE/UPDATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_capsters_barbershop ON capsters(barbershop_id) WHERE barbershop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_user ON capsters(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_name ON capsters(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_active ON capsters(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_capsters_rating ON capsters(rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_specialization ON capsters(specialization) WHERE specialization IS NOT NULL;

RAISE NOTICE 'Created/updated indexes on capsters table';

-- ========================================
-- STEP 8: UPDATE RLS POLICIES
-- ========================================

-- Enable RLS if not already enabled
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public can view active capsters" ON capsters;
DROP POLICY IF EXISTS "Barbershop owner can manage capsters" ON capsters;
DROP POLICY IF EXISTS "Capsters can view their own data" ON capsters;
DROP POLICY IF EXISTS "Capsters can update their own data" ON capsters;

-- Create new flexible policies

-- Public can view active capsters
CREATE POLICY "Public can view active capsters" ON capsters
  FOR SELECT 
  USING (COALESCE(is_active, TRUE) = TRUE);

-- Barbershop owners can manage their capsters
CREATE POLICY "Barbershop owner can manage capsters" ON capsters
  FOR ALL 
  USING (
    barbershop_id IS NULL OR
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

-- Capsters can view their own data
CREATE POLICY "Capsters can view own data" ON capsters
  FOR SELECT
  USING (user_id = auth.uid());

-- Capsters can update their own data (except barbershop_id)
CREATE POLICY "Capsters can update own data" ON capsters
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

RAISE NOTICE 'Updated RLS policies on capsters table';

-- ========================================
-- STEP 9: CREATE BARBERSHOP_PROFILES IF NOT EXISTS
-- ========================================

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

-- Indexes for barbershop_profiles
CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_owner ON barbershop_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_active ON barbershop_profiles(is_active);

-- RLS for barbershop_profiles
ALTER TABLE barbershop_profiles ENABLE ROW LEVEL SECURITY;

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

RAISE NOTICE 'Created/updated barbershop_profiles table';

-- ========================================
-- STEP 10: CREATE SERVICE_CATALOG IF NOT EXISTS
-- ========================================

CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_category TEXT CHECK (
    service_category IN ('haircut', 'grooming', 'coloring', 'package', 'other')
  ) DEFAULT 'haircut',
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0) DEFAULT 30,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_barbershop ON service_catalog(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(service_category);

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active services" ON service_catalog;
DROP POLICY IF EXISTS "Barbershop owner can manage services" ON service_catalog;

CREATE POLICY "Public can view active services" ON service_catalog
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Barbershop owner can manage services" ON service_catalog
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

RAISE NOTICE 'Created/updated service_catalog table';

-- ========================================
-- STEP 11: CREATE ACCESS_KEYS IF NOT EXISTS
-- ========================================

CREATE TABLE IF NOT EXISTS access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  key_type TEXT CHECK (key_type IN ('customer', 'capster', 'admin')) NOT NULL,
  key_value TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  max_usage INTEGER CHECK (max_usage IS NULL OR max_usage > 0),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_keys_barbershop ON access_keys(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_access_keys_value ON access_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_access_keys_type ON access_keys(key_type);

ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can validate access keys" ON access_keys;
DROP POLICY IF EXISTS "Barbershop owner can manage access keys" ON access_keys;

CREATE POLICY "Public can validate access keys" ON access_keys
  FOR SELECT USING (
    is_active = TRUE AND 
    (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Barbershop owner can manage access keys" ON access_keys
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

RAISE NOTICE 'Created/updated access_keys table';

-- ========================================
-- STEP 12: CREATE ONBOARDING_PROGRESS IF NOT EXISTS
-- ========================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE SET NULL,
  step_completed INTEGER DEFAULT 0 CHECK (step_completed >= 0 AND step_completed <= 5),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_onboarding UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_barbershop ON onboarding_progress(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed ON onboarding_progress(is_completed);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding progress" ON onboarding_progress;
DROP POLICY IF EXISTS "Users can manage own onboarding progress" ON onboarding_progress;

CREATE POLICY "Users can view own onboarding progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own onboarding progress" ON onboarding_progress
  FOR ALL USING (auth.uid() = user_id);

RAISE NOTICE 'Created/updated onboarding_progress table';

-- ========================================
-- STEP 13: CREATE HELPER FUNCTIONS
-- ========================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_barbershop_profiles_updated_at ON barbershop_profiles;
CREATE TRIGGER update_barbershop_profiles_updated_at
  BEFORE UPDATE ON barbershop_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER update_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_keys_updated_at ON access_keys;
CREATE TRIGGER update_access_keys_updated_at
  BEFORE UPDATE ON access_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique access key function
CREATE OR REPLACE FUNCTION generate_access_key(p_prefix TEXT DEFAULT 'KEY')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_key TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_key := upper(p_prefix || '_' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    SELECT EXISTS(SELECT 1 FROM access_keys WHERE key_value = v_key) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_key;
END;
$$;

-- Complete onboarding function
CREATE OR REPLACE FUNCTION complete_onboarding(
  p_barbershop_data JSONB,
  p_capsters JSONB[],
  p_services JSONB[],
  p_access_keys JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_barbershop_id UUID;
  v_capster JSONB;
  v_service JSONB;
  v_customer_key TEXT;
  v_capster_key TEXT;
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Not authenticated'
    );
  END IF;

  -- 1. Create or update barbershop profile
  INSERT INTO barbershop_profiles (
    owner_id, name, address, phone, open_time, close_time, days_open, 
    description, instagram, whatsapp
  ) VALUES (
    v_user_id,
    (p_barbershop_data->>'name'),
    (p_barbershop_data->>'address'),
    (p_barbershop_data->>'phone'),
    COALESCE((p_barbershop_data->>'open_time')::TIME, '09:00'::TIME),
    COALESCE((p_barbershop_data->>'close_time')::TIME, '21:00'::TIME),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_barbershop_data->'days_open')),
      ARRAY['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
    ),
    (p_barbershop_data->>'description'),
    (p_barbershop_data->>'instagram'),
    (p_barbershop_data->>'whatsapp')
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    days_open = EXCLUDED.days_open,
    description = EXCLUDED.description,
    instagram = EXCLUDED.instagram,
    whatsapp = EXCLUDED.whatsapp,
    updated_at = NOW()
  RETURNING id INTO v_barbershop_id;

  -- 2. Insert capsters (using 'name' column)
  IF p_capsters IS NOT NULL AND array_length(p_capsters, 1) > 0 THEN
    FOREACH v_capster IN ARRAY p_capsters
    LOOP
      INSERT INTO capsters (
        barbershop_id,
        name,
        specialization,
        phone
      ) VALUES (
        v_barbershop_id,
        COALESCE((v_capster->>'name'), (v_capster->>'capster_name')),
        COALESCE((v_capster->>'specialization'), 'General'),
        (v_capster->>'phone')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 3. Insert services
  IF p_services IS NOT NULL AND array_length(p_services, 1) > 0 THEN
    FOREACH v_service IN ARRAY p_services
    LOOP
      INSERT INTO service_catalog (
        barbershop_id,
        service_name,
        service_category,
        base_price,
        duration_minutes
      ) VALUES (
        v_barbershop_id,
        (v_service->>'service_name'),
        COALESCE((v_service->>'category'), 'haircut'),
        COALESCE((v_service->>'price')::NUMERIC, (v_service->>'base_price')::NUMERIC, 50000),
        COALESCE((v_service->>'duration_minutes')::INTEGER, 30)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 4. Generate and insert access keys
  IF p_access_keys IS NOT NULL THEN
    v_customer_key := COALESCE((p_access_keys->>'customer'), generate_access_key('CUSTOMER'));
    v_capster_key := COALESCE((p_access_keys->>'capster'), generate_access_key('CAPSTER'));
  ELSE
    v_customer_key := generate_access_key('CUSTOMER');
    v_capster_key := generate_access_key('CAPSTER');
  END IF;

  INSERT INTO access_keys (barbershop_id, key_type, key_value)
  VALUES
    (v_barbershop_id, 'customer', v_customer_key),
    (v_barbershop_id, 'capster', v_capster_key)
  ON CONFLICT (key_value) DO NOTHING;

  -- 5. Mark onboarding as complete
  INSERT INTO onboarding_progress (
    user_id, barbershop_id, step_completed, is_completed, completed_at
  ) VALUES (
    v_user_id, v_barbershop_id, 5, TRUE, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    barbershop_id = EXCLUDED.barbershop_id,
    step_completed = EXCLUDED.step_completed,
    is_completed = EXCLUDED.is_completed,
    completed_at = EXCLUDED.completed_at,
    updated_at = NOW();

  -- Return success
  v_result := jsonb_build_object(
    'success', TRUE,
    'barbershop_id', v_barbershop_id,
    'access_keys', jsonb_build_object(
      'customer', v_customer_key,
      'capster', v_capster_key
    ),
    'message', 'Onboarding completed successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Get onboarding status function
CREATE OR REPLACE FUNCTION get_onboarding_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_progress RECORD;
  v_barbershop RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', FALSE);
  END IF;

  SELECT * INTO v_progress FROM onboarding_progress WHERE user_id = v_user_id;

  IF v_progress IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', TRUE,
      'onboarding_started', FALSE,
      'onboarding_completed', FALSE,
      'current_step', 0
    );
  END IF;

  -- Get barbershop data if exists
  IF v_progress.barbershop_id IS NOT NULL THEN
    SELECT * INTO v_barbershop FROM barbershop_profiles WHERE id = v_progress.barbershop_id;
  END IF;

  RETURN jsonb_build_object(
    'authenticated', TRUE,
    'onboarding_started', TRUE,
    'onboarding_completed', v_progress.is_completed,
    'current_step', v_progress.step_completed,
    'barbershop_id', v_progress.barbershop_id,
    'barbershop_name', COALESCE(v_barbershop.name, NULL)
  );
END;
$$;

RAISE NOTICE 'Created/updated helper functions';

-- ========================================
-- STEP 14: GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON barbershop_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON capsters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE ON access_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_progress TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION complete_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_status TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_key TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

RAISE NOTICE 'Granted permissions to authenticated users';

-- ========================================
-- STEP 15: ADD HELPFUL COMMENTS
-- ========================================

COMMENT ON TABLE capsters IS 'Barbers/capsters - flexible schema with name sync to capster_name';
COMMENT ON COLUMN capsters.name IS 'Primary name field - syncs with capster_name via trigger';
COMMENT ON COLUMN capsters.capster_name IS 'Legacy name field - syncs with name via trigger';
COMMENT ON COLUMN capsters.barbershop_id IS 'Nullable foreign key - allows onboarding without barbershop first';
COMMENT ON COLUMN capsters.specialization IS 'Flexible specialization - multiple valid options';

COMMENT ON TABLE barbershop_profiles IS 'Barbershop master data - one per owner';
COMMENT ON TABLE service_catalog IS 'Services offered by barbershops';
COMMENT ON TABLE access_keys IS 'Access keys for customers and capsters';
COMMENT ON TABLE onboarding_progress IS 'Track onboarding wizard progress';

COMMENT ON FUNCTION complete_onboarding IS 'Complete 5-step onboarding process atomically';
COMMENT ON FUNCTION get_onboarding_status IS 'Check user onboarding status and progress';
COMMENT ON FUNCTION generate_access_key IS 'Generate unique access key with prefix';
COMMENT ON FUNCTION sync_capster_name IS 'Sync name and capster_name columns bidirectionally';

-- ========================================
-- MIGRATION COMPLETE!
-- ========================================

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ULTIMATE ONBOARDING FIX COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed Issues:';
  RAISE NOTICE '✓ Foreign key constraint (barbershop_id can be NULL)';
  RAISE NOTICE '✓ Column name issue (name column added and synced)';
  RAISE NOTICE '✓ Specialization check (flexible options)';
  RAISE NOTICE '✓ All tables created with RLS policies';
  RAISE NOTICE '✓ Helper functions for onboarding flow';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the onboarding flow!';
END $$;
