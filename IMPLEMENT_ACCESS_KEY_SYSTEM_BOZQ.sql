-- ============================================================================
-- 🔐 ACCESS KEY SYSTEM IMPLEMENTATION - SAAS X BARBERSHOP
-- ============================================================================
-- Version: 1.0.0
-- Date: December 24, 2024
-- Purpose: Implement SECRET ACCESS KEY system for registration control
-- Brand: BOZQ (Exclusive Access Keys)
-- 
-- Features:
-- ✅ Idempotent (Safe to run multiple times)
-- ✅ 3 Role Support (Customer, Capster, Admin)
-- ✅ Usage Tracking
-- ✅ Expiration Support
-- ✅ RLS Policies
-- ✅ Validation Functions
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE access_keys TABLE
-- ============================================================================
DO $$
BEGIN
  -- Create table if not exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'access_keys') THEN
    CREATE TABLE public.access_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key_name TEXT NOT NULL UNIQUE,
      access_key TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin')),
      description TEXT,
      max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
      current_uses INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID DEFAULT NULL
    );

    RAISE NOTICE '✅ Table access_keys created successfully';
  ELSE
    RAISE NOTICE '⏭️  Table access_keys already exists, skipping creation';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================
DO $$
BEGIN
  -- Index on access_key for fast lookup
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'access_keys' AND indexname = 'idx_access_keys_key') THEN
    CREATE INDEX idx_access_keys_key ON public.access_keys(access_key);
    RAISE NOTICE '✅ Index idx_access_keys_key created';
  END IF;

  -- Index on role for filtering
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'access_keys' AND indexname = 'idx_access_keys_role') THEN
    CREATE INDEX idx_access_keys_role ON public.access_keys(role);
    RAISE NOTICE '✅ Index idx_access_keys_role created';
  END IF;

  -- Index on is_active for active keys lookup
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'access_keys' AND indexname = 'idx_access_keys_active') THEN
    CREATE INDEX idx_access_keys_active ON public.access_keys(is_active) WHERE is_active = TRUE;
    RAISE NOTICE '✅ Index idx_access_keys_active created';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: ENABLE RLS
-- ============================================================================
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: DROP EXISTING POLICIES (for idempotency)
-- ============================================================================
DROP POLICY IF EXISTS "access_keys_read_all" ON public.access_keys;
DROP POLICY IF EXISTS "access_keys_admin_all" ON public.access_keys;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: Allow public read for validation (anyone can check if key is valid)
CREATE POLICY "access_keys_read_all" ON public.access_keys
  FOR SELECT
  USING (is_active = TRUE);

-- Policy 2: Allow admin to manage all access keys
CREATE POLICY "access_keys_admin_all" ON public.access_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 6: CREATE VALIDATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_access_key(
  p_access_key TEXT,
  p_role TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  key_name TEXT,
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key RECORD;
  v_is_valid BOOLEAN := FALSE;
  v_message TEXT;
  v_key_name TEXT;
BEGIN
  -- Find the access key
  SELECT * INTO v_key
  FROM public.access_keys
  WHERE access_key = p_access_key
  AND role = p_role;

  -- Check if key exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invalid access key for this role'::TEXT;
    RETURN;
  END IF;

  -- Check if key is active
  IF NOT v_key.is_active THEN
    RETURN QUERY SELECT FALSE, v_key.key_name, 'This access key has been deactivated'::TEXT;
    RETURN;
  END IF;

  -- Check if key has expired
  IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, v_key.key_name, 'This access key has expired'::TEXT;
    RETURN;
  END IF;

  -- Check if max uses exceeded
  IF v_key.max_uses IS NOT NULL AND v_key.current_uses >= v_key.max_uses THEN
    RETURN QUERY SELECT FALSE, v_key.key_name, 'This access key has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, v_key.key_name, 'Access key is valid'::TEXT;
END;
$$;

-- ============================================================================
-- STEP 7: CREATE INCREMENT USAGE FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_access_key_usage(
  p_access_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.access_keys
  SET 
    current_uses = current_uses + 1,
    updated_at = NOW()
  WHERE access_key = p_access_key;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- STEP 8: CREATE TRIGGER FOR updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS set_access_keys_updated_at ON public.access_keys;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_access_keys_updated_at
  BEFORE UPDATE ON public.access_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- STEP 9: INSERT SEED DATA (ACCESS KEYS FOR 3 ROLES)
-- ============================================================================
-- Using BOZQ brand naming convention

-- Delete existing keys to ensure fresh data (idempotent)
DELETE FROM public.access_keys WHERE key_name IN (
  'CUSTOMER_BOZQ_ACCESS_2025',
  'CAPSTER_BOZQ_ACCESS_2025',
  'ADMIN_BOZQ_ACCESS_2025'
);

-- Insert Customer Access Key
INSERT INTO public.access_keys (
  key_name,
  access_key,
  role,
  description,
  max_uses,
  is_active
) VALUES (
  'CUSTOMER_BOZQ_ACCESS_2025',
  'CUSTOMER_BOZQ_ACCESS_1',
  'customer',
  'Access key untuk registrasi customer OASIS Barbershop. Diberikan saat customer pertama kali datang ke barbershop.',
  NULL, -- Unlimited uses
  TRUE
);

-- Insert Capster Access Key
INSERT INTO public.access_keys (
  key_name,
  access_key,
  role,
  description,
  max_uses,
  is_active
) VALUES (
  'CAPSTER_BOZQ_ACCESS_2025',
  'CAPSTER_BOZQ_ACCESS_1',
  'capster',
  'Access key untuk registrasi capster/barberman OASIS. Hanya diberikan kepada capster resmi yang bekerja di OASIS Barbershop.',
  NULL, -- Unlimited uses
  TRUE
);

-- Insert Admin Access Key
INSERT INTO public.access_keys (
  key_name,
  access_key,
  role,
  description,
  max_uses,
  is_active
) VALUES (
  'ADMIN_BOZQ_ACCESS_2025',
  'ADMIN_BOZQ_ACCESS_1',
  'admin',
  'Access key untuk registrasi admin OASIS. Exclusive access untuk founder dan management OASIS Barbershop saja.',
  10, -- Limited to 10 uses
  TRUE
);

-- ============================================================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.access_keys TO anon;
GRANT SELECT ON public.access_keys TO authenticated;
GRANT ALL ON public.access_keys TO service_role;

GRANT EXECUTE ON FUNCTION public.validate_access_key TO anon;
GRANT EXECUTE ON FUNCTION public.validate_access_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_access_key_usage TO anon;
GRANT EXECUTE ON FUNCTION public.increment_access_key_usage TO authenticated;

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.access_keys;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ ACCESS KEY SYSTEM DEPLOYMENT COMPLETE!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 SUMMARY:';
  RAISE NOTICE '  - Table created: access_keys';
  RAISE NOTICE '  - Indexes created: 3';
  RAISE NOTICE '  - RLS policies: 2';
  RAISE NOTICE '  - Functions: 2 (validate, increment_usage)';
  RAISE NOTICE '  - Access keys seeded: %', v_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 ACCESS KEYS (BOZQ Brand):';
  RAISE NOTICE '  1. CUSTOMER: CUSTOMER_BOZQ_ACCESS_1';
  RAISE NOTICE '  2. CAPSTER:  CAPSTER_BOZQ_ACCESS_1';
  RAISE NOTICE '  3. ADMIN:    ADMIN_BOZQ_ACCESS_1';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '  1. Update registration pages to require ACCESS KEY input';
  RAISE NOTICE '  2. Call validate_access_key() before user registration';
  RAISE NOTICE '  3. Call increment_access_key_usage() after successful registration';
  RAISE NOTICE '  4. Test registration flow for all 3 roles';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- TEST QUERY (Optional - uncomment to test)
-- ============================================================================
-- Test Customer Key
-- SELECT * FROM validate_access_key('CUSTOMER_BOZQ_ACCESS_1', 'customer');

-- Test Capster Key  
-- SELECT * FROM validate_access_key('CAPSTER_BOZQ_ACCESS_1', 'capster');

-- Test Admin Key
-- SELECT * FROM validate_access_key('ADMIN_BOZQ_ACCESS_1', 'admin');

-- View all access keys
-- SELECT key_name, access_key, role, current_uses, max_uses, is_active FROM access_keys;
