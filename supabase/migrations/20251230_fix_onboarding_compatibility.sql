-- =====================================================
-- ONBOARDING FIX: Make existing schema compatible with onboarding flow
-- Date: 30 December 2025  
-- Purpose: Add missing tables and ensure capsters table has correct columns
-- =====================================================

-- ========================================
-- 1. CREATE barbershop_profiles TABLE (if not exists)
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '21:00',
  days_open TEXT[] NOT NULL DEFAULT ARRAY['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  logo_url TEXT,
  description TEXT,
  instagram TEXT,
  whatsapp TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_owner ON barbershop_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_active ON barbershop_profiles(is_active);

ALTER TABLE barbershop_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own barbershop profile" ON barbershop_profiles;
CREATE POLICY "Users can view their own barbershop profile" ON barbershop_profiles
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create their own barbershop profile" ON barbershop_profiles;
CREATE POLICY "Users can create their own barbershop profile" ON barbershop_profiles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own barbershop profile" ON barbershop_profiles;
CREATE POLICY "Users can update their own barbershop profile" ON barbershop_profiles
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public can view active barbershops" ON barbershop_profiles;
CREATE POLICY "Public can view active barbershops" ON barbershop_profiles
  FOR SELECT USING (is_active = TRUE);

-- ========================================
-- 2. FIX capsters TABLE - Add 'name' column as alias
-- ========================================
-- The existing table uses 'capster_name', but onboarding expects 'name'
-- We'll add a generated column or view to make both work

-- Option 1: Add 'name' column that syncs with 'capster_name'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'capsters' AND column_name = 'name') THEN
    -- Add 'name' column as computed from 'capster_name'
    ALTER TABLE capsters ADD COLUMN name TEXT;
    
    -- Copy existing capster_name values to name
    UPDATE capsters SET name = capster_name WHERE name IS NULL;
    
    -- Make sure future inserts/updates keep them in sync via trigger
    CREATE OR REPLACE FUNCTION sync_capster_name()
    RETURNS TRIGGER AS $func$
    BEGIN
      -- If name is provided, sync to capster_name
      IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        NEW.capster_name := NEW.name;
      END IF;
      
      -- If capster_name is provided, sync to name  
      IF NEW.capster_name IS NOT NULL AND NEW.capster_name != '' THEN
        NEW.name := NEW.capster_name;
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS sync_capster_name_trigger ON capsters;
    CREATE TRIGGER sync_capster_name_trigger
      BEFORE INSERT OR UPDATE ON capsters
      FOR EACH ROW
      EXECUTE FUNCTION sync_capster_name();
  END IF;
END $$;

-- Ensure capsters table has required columns
ALTER TABLE capsters 
  ALTER COLUMN barbershop_id DROP NOT NULL; -- Make optional during transition

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'capsters' AND column_name = 'is_active') THEN
    ALTER TABLE capsters ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'capsters' AND column_name = 'total_bookings') THEN
    ALTER TABLE capsters ADD COLUMN total_bookings INTEGER DEFAULT 0 CHECK (total_bookings >= 0);
  END IF;
END $$;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_capsters_barbershop ON capsters(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_capsters_user ON capsters(user_id);
CREATE INDEX IF NOT EXISTS idx_capsters_active ON capsters(is_active) WHERE is_active IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capsters_rating ON capsters(rating DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Public can view active capsters" ON capsters;
CREATE POLICY "Public can view active capsters" ON capsters
  FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE);

DROP POLICY IF EXISTS "Barbershop owner can manage capsters" ON capsters;
CREATE POLICY "Barbershop owner can manage capsters" ON capsters
  FOR ALL USING (
    barbershop_id IS NULL OR
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- 3. CREATE service_catalog TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_category TEXT CHECK (service_category IN ('haircut', 'grooming', 'coloring', 'package', 'other')) DEFAULT 'haircut',
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
CREATE POLICY "Public can view active services" ON service_catalog
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Barbershop owner can manage services" ON service_catalog;
CREATE POLICY "Barbershop owner can manage services" ON service_catalog
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- 4. CREATE access_keys TABLE
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
CREATE POLICY "Public can validate access keys" ON access_keys
  FOR SELECT USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "Barbershop owner can manage access keys" ON access_keys;
CREATE POLICY "Barbershop owner can manage access keys" ON access_keys
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- 5. CREATE onboarding_progress TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0 CHECK (step_completed >= 0 AND step_completed <= 5),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_barbershop ON onboarding_progress(barbershop_id);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can manage their own onboarding progress" ON onboarding_progress
  FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 6. CREATE OR REPLACE HELPER FUNCTIONS
-- ========================================

-- Reuse existing function or create if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_barbershop_profiles_updated_at ON barbershop_profiles;
CREATE TRIGGER update_barbershop_profiles_updated_at
  BEFORE UPDATE ON barbershop_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER update_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_keys_updated_at ON access_keys;
CREATE TRIGGER update_access_keys_updated_at
  BEFORE UPDATE ON access_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(
  p_barbershop_data JSONB,
  p_capsters JSONB[],
  p_services JSONB[],
  p_access_keys JSONB
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
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create or update barbershop profile
  INSERT INTO barbershop_profiles (
    owner_id, name, address, phone, open_time, close_time, days_open, description, instagram, whatsapp
  ) VALUES (
    v_user_id,
    (p_barbershop_data->>'name'),
    (p_barbershop_data->>'address'),
    (p_barbershop_data->>'phone'),
    COALESCE((p_barbershop_data->>'open_time')::TIME, '09:00'::TIME),
    COALESCE((p_barbershop_data->>'close_time')::TIME, '21:00'::TIME),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_barbershop_data->'days_open')),
      ARRAY['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
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

  -- 2. Insert capsters (using 'name' column which will sync to 'capster_name')
  IF p_capsters IS NOT NULL THEN
    FOREACH v_capster IN ARRAY p_capsters
    LOOP
      INSERT INTO capsters (
        barbershop_id,
        name,
        specialization,
        phone
      ) VALUES (
        v_barbershop_id,
        (v_capster->>'name'),
        COALESCE((v_capster->>'specialization'), 'Classic Haircut'),
        (v_capster->>'phone')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 3. Insert services
  IF p_services IS NOT NULL THEN
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
        (v_service->>'price')::NUMERIC,
        COALESCE((v_service->>'duration_minutes')::INTEGER, 30)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 4. Insert access keys
  IF p_access_keys IS NOT NULL THEN
    INSERT INTO access_keys (barbershop_id, key_type, key_value)
    VALUES
      (v_barbershop_id, 'customer', (p_access_keys->>'customer')),
      (v_barbershop_id, 'capster', (p_access_keys->>'capster'))
    ON CONFLICT (key_value) DO NOTHING;
  END IF;

  -- 5. Mark onboarding as complete
  INSERT INTO onboarding_progress (user_id, barbershop_id, step_completed, is_completed, completed_at)
  VALUES (v_user_id, v_barbershop_id, 5, TRUE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    barbershop_id = EXCLUDED.barbershop_id,
    step_completed = EXCLUDED.step_completed,
    is_completed = EXCLUDED.is_completed,
    completed_at = EXCLUDED.completed_at,
    updated_at = NOW();

  v_result := jsonb_build_object(
    'success', TRUE,
    'barbershop_id', v_barbershop_id,
    'message', 'Onboarding completed successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to check onboarding status
CREATE OR REPLACE FUNCTION get_onboarding_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_progress RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', FALSE);
  END IF;

  SELECT * INTO v_progress FROM onboarding_progress WHERE user_id = v_user_id;

  IF v_progress IS NULL THEN
    v_result := jsonb_build_object(
      'authenticated', TRUE,
      'onboarding_started', FALSE,
      'onboarding_completed', FALSE,
      'current_step', 0
    );
  ELSE
    v_result := jsonb_build_object(
      'authenticated', TRUE,
      'onboarding_started', TRUE,
      'onboarding_completed', v_progress.is_completed,
      'current_step', v_progress.step_completed,
      'barbershop_id', v_progress.barbershop_id
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Function to generate unique access key
CREATE OR REPLACE FUNCTION generate_access_key(p_prefix TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_key TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_key := p_prefix || '_' || upper(substring(md5(random()::text) from 1 for 12));
    SELECT EXISTS(SELECT 1 FROM access_keys WHERE key_value = v_key) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_key;
END;
$$;

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON barbershop_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON capsters TO authenticated;
GRANT SELECT, INSERT, UPDATE ON service_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE ON access_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_progress TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- MIGRATION COMPLETE!
-- ========================================

COMMENT ON TABLE barbershop_profiles IS 'Barbershop master data - one per owner';
COMMENT ON TABLE capsters IS 'Barbers working at barbershops - has both name and capster_name columns synced';
COMMENT ON TABLE service_catalog IS 'Services offered by barbershops';
COMMENT ON TABLE access_keys IS 'Access keys for customers and capsters to join barbershop';
COMMENT ON TABLE onboarding_progress IS 'Track onboarding wizard progress for new barbershop owners';

COMMENT ON FUNCTION complete_onboarding IS 'Complete the 5-step onboarding process';
COMMENT ON FUNCTION get_onboarding_status IS 'Check user onboarding status';
COMMENT ON FUNCTION generate_access_key IS 'Generate unique access key with optional prefix';
