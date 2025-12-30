-- =====================================================
-- ONBOARDING ENHANCEMENT MIGRATION
-- Date: 30 December 2025
-- Purpose: Add tables to support onboarding wizard
-- =====================================================

-- 1. Create barbershop_profiles table
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

-- 2. Enhance capsters table (if not exists)
CREATE TABLE IF NOT EXISTS capsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL DEFAULT 'Classic Haircut',
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 5.00,
  total_bookings INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance service_catalog table (if not exists)
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
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

-- 4. Enhance access_keys table (if not exists)
CREATE TABLE IF NOT EXISTS access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  key_type TEXT CHECK (key_type IN ('customer', 'capster', 'admin')) NOT NULL,
  key_value TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_owner ON barbershop_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_capsters_barbershop ON capsters(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_capsters_user ON capsters(user_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_barbershop ON service_catalog(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_access_keys_barbershop ON access_keys(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_access_keys_value ON access_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);

-- 7. RLS Policies for barbershop_profiles
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

-- 8. RLS Policies for capsters (public read for booking)
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active capsters" ON capsters;
CREATE POLICY "Public can view active capsters" ON capsters
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Barbershop owner can manage capsters" ON capsters;
CREATE POLICY "Barbershop owner can manage capsters" ON capsters
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

-- 9. RLS Policies for service_catalog (public read for booking)
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

-- 10. RLS Policies for access_keys
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can validate access keys" ON access_keys;
CREATE POLICY "Public can validate access keys" ON access_keys
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Barbershop owner can manage access keys" ON access_keys;
CREATE POLICY "Barbershop owner can manage access keys" ON access_keys
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
    )
  );

-- 11. RLS Policies for onboarding_progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can update their own onboarding progress" ON onboarding_progress
  FOR ALL USING (auth.uid() = user_id);

-- 12. Create function to complete onboarding
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
    owner_id,
    name,
    address,
    phone,
    open_time,
    close_time,
    days_open
  ) VALUES (
    v_user_id,
    (p_barbershop_data->>'name'),
    (p_barbershop_data->>'address'),
    (p_barbershop_data->>'phone'),
    (p_barbershop_data->>'open_time')::TIME,
    (p_barbershop_data->>'close_time')::TIME,
    ARRAY(SELECT jsonb_array_elements_text(p_barbershop_data->'days_open'))
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    days_open = EXCLUDED.days_open,
    updated_at = NOW()
  RETURNING id INTO v_barbershop_id;

  -- 2. Insert capsters
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
      (v_capster->>'specialization'),
      (v_capster->>'phone')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 3. Insert services
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
      (v_service->>'category'),
      (v_service->>'price')::NUMERIC,
      (v_service->>'duration_minutes')::INTEGER
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 4. Insert access keys
  INSERT INTO access_keys (
    barbershop_id,
    key_type,
    key_value
  ) VALUES
    (v_barbershop_id, 'customer', (p_access_keys->>'customer')),
    (v_barbershop_id, 'capster', (p_access_keys->>'capster'))
  ON CONFLICT (key_value) DO NOTHING;

  -- 5. Mark onboarding as complete
  INSERT INTO onboarding_progress (
    user_id,
    barbershop_id,
    step_completed,
    is_completed,
    completed_at
  ) VALUES (
    v_user_id,
    v_barbershop_id,
    5,
    TRUE,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    barbershop_id = EXCLUDED.barbershop_id,
    step_completed = EXCLUDED.step_completed,
    is_completed = EXCLUDED.is_completed,
    completed_at = EXCLUDED.completed_at,
    updated_at = NOW();

  -- Build result
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

-- 13. Create function to check onboarding status
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

  SELECT * INTO v_progress
  FROM onboarding_progress
  WHERE user_id = v_user_id;

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

-- 14. Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_barbershop_profiles_updated_at ON barbershop_profiles;
CREATE TRIGGER update_barbershop_profiles_updated_at
  BEFORE UPDATE ON barbershop_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_capsters_updated_at ON capsters;
CREATE TRIGGER update_capsters_updated_at
  BEFORE UPDATE ON capsters
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

-- =====================================================
-- Migration Complete!
-- =====================================================
