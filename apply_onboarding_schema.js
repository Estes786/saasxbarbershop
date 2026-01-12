const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQLScript() {
  console.log('🚀 Starting to apply onboarding schema to Supabase...\n');

  const sqlScript = `
-- =====================================================
-- 🚀 BALIK.LAGI ONBOARDING ENHANCEMENT (SAFE & IDEMPOTENT)
-- =====================================================
-- Date: 30 December 2025
-- Purpose: Fix "barbershop_id does not exist" error
-- Strategy: Create ALL required tables in correct order
-- Compatibility: Works with existing BALIK.LAGI schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- STEP 1: CREATE barbershop_profiles TABLE (MASTER TABLE)
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'barbershop_profiles') THEN
    CREATE TABLE barbershop_profiles (
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
    
    CREATE INDEX idx_barbershop_profiles_owner ON barbershop_profiles(owner_id);
    CREATE INDEX idx_barbershop_profiles_active ON barbershop_profiles(is_active);
    
    ALTER TABLE barbershop_profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own barbershop profile" ON barbershop_profiles
      FOR SELECT USING (auth.uid() = owner_id);
      
    CREATE POLICY "Users can create their own barbershop profile" ON barbershop_profiles
      FOR INSERT WITH CHECK (auth.uid() = owner_id);
      
    CREATE POLICY "Users can update their own barbershop profile" ON barbershop_profiles
      FOR UPDATE USING (auth.uid() = owner_id);
      
    CREATE POLICY "Public can view active barbershops" ON barbershop_profiles
      FOR SELECT USING (is_active = TRUE);
    
    RAISE NOTICE '✅ Table barbershop_profiles created successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Table barbershop_profiles already exists, skipping...';
  END IF;
END $$;

-- ========================================
-- STEP 2: CREATE capsters TABLE
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'capsters') THEN
    CREATE TABLE capsters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL DEFAULT 'Classic Haircut',
      phone TEXT,
      avatar_url TEXT,
      bio TEXT,
      rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
      total_bookings INTEGER DEFAULT 0 CHECK (total_bookings >= 0),
      total_revenue NUMERIC(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_capsters_barbershop ON capsters(barbershop_id);
    CREATE INDEX idx_capsters_user ON capsters(user_id);
    CREATE INDEX idx_capsters_active ON capsters(is_active);
    
    ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Public can view active capsters" ON capsters
      FOR SELECT USING (is_active = TRUE);
      
    CREATE POLICY "Barbershop owner can manage capsters" ON capsters
      FOR ALL USING (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
        )
      );
    
    RAISE NOTICE '✅ Table capsters created successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Table capsters already exists, checking for barbershop_id column...';
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'capsters' AND column_name = 'barbershop_id'
    ) THEN
      ALTER TABLE capsters ADD COLUMN barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ Added barbershop_id column to existing capsters table';
    END IF;
  END IF;
END $$;

-- ========================================
-- STEP 3: CREATE service_catalog TABLE
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_catalog') THEN
    CREATE TABLE service_catalog (
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
    
    CREATE INDEX idx_service_catalog_barbershop ON service_catalog(barbershop_id);
    CREATE INDEX idx_service_catalog_active ON service_catalog(is_active);
    
    ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Public can view active services" ON service_catalog
      FOR SELECT USING (is_active = TRUE);
      
    CREATE POLICY "Barbershop owner can manage services" ON service_catalog
      FOR ALL USING (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
        )
      );
    
    RAISE NOTICE '✅ Table service_catalog created successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Table service_catalog already exists, skipping...';
  END IF;
END $$;

-- ========================================
-- STEP 4: CREATE access_keys TABLE
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_keys') THEN
    CREATE TABLE access_keys (
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
    
    CREATE INDEX idx_access_keys_barbershop ON access_keys(barbershop_id);
    CREATE INDEX idx_access_keys_value ON access_keys(key_value);
    
    ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Public can validate access keys" ON access_keys
      FOR SELECT USING (is_active = TRUE);
      
    CREATE POLICY "Barbershop owner can manage access keys" ON access_keys
      FOR ALL USING (
        barbershop_id IN (
          SELECT id FROM barbershop_profiles WHERE owner_id = auth.uid()
        )
      );
    
    RAISE NOTICE '✅ Table access_keys created successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Table access_keys already exists, skipping...';
  END IF;
END $$;

-- ========================================
-- STEP 5: CREATE onboarding_progress TABLE
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_progress') THEN
    CREATE TABLE onboarding_progress (
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
    
    CREATE INDEX idx_onboarding_progress_user ON onboarding_progress(user_id);
    
    ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can manage their own onboarding progress" ON onboarding_progress
      FOR ALL USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Table onboarding_progress created successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Table onboarding_progress already exists, skipping...';
  END IF;
END $$;

-- ========================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_barbershop_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_barbershop_profiles_updated_at
      BEFORE UPDATE ON barbershop_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_capsters_updated_at'
  ) THEN
    CREATE TRIGGER update_capsters_updated_at
      BEFORE UPDATE ON capsters
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_service_catalog_updated_at'
  ) THEN
    CREATE TRIGGER update_service_catalog_updated_at
      BEFORE UPDATE ON service_catalog
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_access_keys_updated_at'
  ) THEN
    CREATE TRIGGER update_access_keys_updated_at
      BEFORE UPDATE ON access_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_onboarding_progress_updated_at'
  ) THEN
    CREATE TRIGGER update_onboarding_progress_updated_at
      BEFORE UPDATE ON onboarding_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO barbershop_profiles (
    owner_id, name, address, phone, open_time, close_time, days_open
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
    )
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO v_barbershop_id;

  IF p_capsters IS NOT NULL THEN
    FOREACH v_capster IN ARRAY p_capsters
    LOOP
      INSERT INTO capsters (barbershop_id, name, specialization, phone)
      VALUES (
        v_barbershop_id,
        (v_capster->>'name'),
        COALESCE((v_capster->>'specialization'), 'Classic Haircut'),
        (v_capster->>'phone')
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  IF p_services IS NOT NULL THEN
    FOREACH v_service IN ARRAY p_services
    LOOP
      INSERT INTO service_catalog (barbershop_id, service_name, base_price, duration_minutes)
      VALUES (
        v_barbershop_id,
        (v_service->>'service_name'),
        (v_service->>'price')::NUMERIC,
        COALESCE((v_service->>'duration_minutes')::INTEGER, 30)
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  INSERT INTO onboarding_progress (user_id, barbershop_id, step_completed, is_completed, completed_at)
  VALUES (v_user_id, v_barbershop_id, 5, TRUE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    is_completed = TRUE,
    completed_at = NOW();

  v_result := jsonb_build_object(
    'success', TRUE,
    'barbershop_id', v_barbershop_id,
    'message', 'Onboarding completed successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION get_onboarding_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_progress RECORD;
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
  ELSE
    RETURN jsonb_build_object(
      'authenticated', TRUE,
      'onboarding_started', TRUE,
      'onboarding_completed', v_progress.is_completed,
      'current_step', v_progress.step_completed,
      'barbershop_id', v_progress.barbershop_id
    );
  END IF;
END;
$$;
`;

  try {
    console.log('📝 Executing SQL script via Supabase REST API...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlScript
    });

    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('\n✅ ========================================');
    console.log('✅ ONBOARDING SCHEMA APPLIED SUCCESSFULLY!');
    console.log('✅ ========================================');
    console.log('✅ All tables created: barbershop_profiles, capsters, service_catalog, access_keys, onboarding_progress');
    console.log('✅ All RLS policies applied');
    console.log('✅ All functions created: complete_onboarding(), get_onboarding_status()');
    console.log('✅ Database ready for onboarding flow!\n');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applySQLScript();
