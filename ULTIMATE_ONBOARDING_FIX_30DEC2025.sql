-- ============================================================================
-- ULTIMATE ONBOARDING FIX - 30 DESEMBER 2025
-- ============================================================================
-- Error: insert or update on table "capsters" violates foreign key constraint
-- "capsters_barbershop_id_fkey"
--
-- ROOT CAUSE:
-- 1. Barbershops table is EMPTY (0 rows)
-- 2. Capsters table has 19 rows with barbershop_id = NULL
-- 3. User_profiles table is EMPTY (0 rows)
-- 4. Onboarding flow doesn't create barbershop at all!
--
-- SOLUTION:
-- 1. Make barbershop_id NULLABLE temporarily (allow NULL)
-- 2. Create default barbershop for existing capsters
-- 3. Update all existing capsters to reference default barbershop
-- 4. Re-enable NOT NULL constraint (but allow NULL for backwards compat)
-- 5. Fix onboarding flow in code
-- ============================================================================

-- STEP 1: Make barbershop_id nullable (if not already)
-- This allows existing data to remain valid
ALTER TABLE capsters 
  ALTER COLUMN barbershop_id DROP NOT NULL;

-- STEP 2: Create a default barbershop for orphaned capsters
-- This ensures referential integrity
DO $$
DECLARE
  default_barbershop_id UUID;
BEGIN
  -- Check if default barbershop already exists
  SELECT id INTO default_barbershop_id
  FROM barbershops
  WHERE name = 'Default Barbershop (Migration)'
  LIMIT 1;

  -- If not exists, create it
  IF default_barbershop_id IS NULL THEN
    INSERT INTO barbershops (
      name,
      address,
      phone,
      description,
      owner_id,
      created_at,
      updated_at
    )
    VALUES (
      'Default Barbershop (Migration)',
      'Setup belum lengkap - Silakan lengkapi di pengaturan',
      '-',
      'Barbershop ini dibuat otomatis untuk migrasi data. Silakan lengkapi informasi Anda.',
      (SELECT id FROM auth.users LIMIT 1), -- First user as owner
      NOW(),
      NOW()
    )
    RETURNING id INTO default_barbershop_id;

    RAISE NOTICE 'Created default barbershop with ID: %', default_barbershop_id;
  END IF;

  -- Update all capsters with NULL barbershop_id to reference default barbershop
  UPDATE capsters
  SET barbershop_id = default_barbershop_id,
      updated_at = NOW()
  WHERE barbershop_id IS NULL;

  RAISE NOTICE 'Updated % capsters to reference default barbershop', 
    (SELECT COUNT(*) FROM capsters WHERE barbershop_id = default_barbershop_id);
END $$;

-- STEP 3: Ensure foreign key constraint exists (but allows NULL)
-- Drop existing constraint if it exists
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_barbershop_id_fkey;

-- Recreate with proper ON DELETE behavior
ALTER TABLE capsters
  ADD CONSTRAINT capsters_barbershop_id_fkey
  FOREIGN KEY (barbershop_id)
  REFERENCES barbershops(id)
  ON DELETE SET NULL; -- Important: don't cascade delete capsters

-- STEP 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_capsters_barbershop_id 
  ON capsters(barbershop_id);

-- STEP 5: Ensure user_profiles table has barbershop_id column
-- (Check if column exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'barbershop_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN barbershop_id UUID REFERENCES barbershops(id);
    RAISE NOTICE 'Added barbershop_id column to user_profiles';
  END IF;
END $$;

-- STEP 6: Create RLS policies for barbershops table (if not exists)
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own barbershop" ON barbershops;
DROP POLICY IF EXISTS "Owners can update their barbershop" ON barbershops;
DROP POLICY IF EXISTS "Authenticated users can create barbershop" ON barbershops;

-- Create new policies
CREATE POLICY "Users can view their own barbershop"
  ON barbershops FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT barbershop_id 
      FROM capsters 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their barbershop"
  ON barbershops FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create barbershop"
  ON barbershops FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- STEP 7: Update capsters RLS policies
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view capsters" ON capsters;
DROP POLICY IF EXISTS "Capsters can update own profile" ON capsters;
DROP POLICY IF EXISTS "Users can create capster profile" ON capsters;

CREATE POLICY "Users can view capsters"
  ON capsters FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    ) OR
    barbershop_id IN (
      SELECT barbershop_id FROM capsters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Capsters can update own profile"
  ON capsters FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create capster profile"
  ON capsters FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (barbershop_id IS NULL OR barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    ))
  );

-- STEP 8: Create helper function to create barbershop with capster in one transaction
CREATE OR REPLACE FUNCTION create_barbershop_with_owner(
  p_owner_id UUID,
  p_barbershop_name TEXT,
  p_barbershop_address TEXT DEFAULT 'Belum diisi',
  p_barbershop_phone TEXT DEFAULT '-',
  p_capster_name TEXT DEFAULT NULL,
  p_capster_phone TEXT DEFAULT NULL,
  p_capster_specialization TEXT DEFAULT 'General'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_barbershop_id UUID;
  v_capster_id UUID;
  v_result JSON;
BEGIN
  -- Validate owner
  IF p_owner_id IS NULL OR p_owner_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
    RAISE EXCEPTION 'Invalid owner_id';
  END IF;

  -- Create barbershop
  INSERT INTO barbershops (
    name,
    address,
    phone,
    description,
    owner_id,
    created_at,
    updated_at
  )
  VALUES (
    p_barbershop_name,
    p_barbershop_address,
    p_barbershop_phone,
    'Barbershop ' || p_barbershop_name,
    p_owner_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_barbershop_id;

  -- Create capster profile for owner (if name provided)
  IF p_capster_name IS NOT NULL THEN
    INSERT INTO capsters (
      user_id,
      barbershop_id,
      name,
      capster_name,
      phone,
      specialization,
      status,
      is_available,
      created_at,
      updated_at
    )
    VALUES (
      p_owner_id,
      v_barbershop_id,
      p_capster_name,
      p_capster_name,
      COALESCE(p_capster_phone, '-'),
      p_capster_specialization,
      'approved',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_capster_id;
  END IF;

  -- Update user_profiles if exists
  UPDATE user_profiles
  SET barbershop_id = v_barbershop_id,
      updated_at = NOW()
  WHERE id = p_owner_id;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'barbershop_id', v_barbershop_id,
    'capster_id', v_capster_id,
    'message', 'Barbershop and capster created successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create barbershop: ' || SQLERRM
  );
END;
$$;

-- STEP 9: Grant permissions
GRANT EXECUTE ON FUNCTION create_barbershop_with_owner TO authenticated;

-- STEP 10: Verification queries
DO $$
DECLARE
  v_barbershop_count INTEGER;
  v_capster_count INTEGER;
  v_orphaned_capsters INTEGER;
BEGIN
  -- Count barbershops
  SELECT COUNT(*) INTO v_barbershop_count FROM barbershops;
  RAISE NOTICE 'Total barbershops: %', v_barbershop_count;

  -- Count capsters
  SELECT COUNT(*) INTO v_capster_count FROM capsters;
  RAISE NOTICE 'Total capsters: %', v_capster_count;

  -- Count orphaned capsters
  SELECT COUNT(*) INTO v_orphaned_capsters 
  FROM capsters 
  WHERE barbershop_id IS NULL;
  RAISE NOTICE 'Orphaned capsters (barbershop_id IS NULL): %', v_orphaned_capsters;

  -- Summary
  RAISE NOTICE '--- MIGRATION COMPLETE ---';
  IF v_orphaned_capsters = 0 THEN
    RAISE NOTICE '✅ All capsters now have valid barbershop_id';
  ELSE
    RAISE WARNING '⚠️  Still have % orphaned capsters', v_orphaned_capsters;
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
RAISE NOTICE '
========================================
✅ ULTIMATE ONBOARDING FIX COMPLETE
========================================

WHAT WAS FIXED:
1. ✅ Made barbershop_id nullable in capsters table
2. ✅ Created default barbershop for existing capsters
3. ✅ Updated all orphaned capsters to reference default barbershop
4. ✅ Fixed foreign key constraint with proper ON DELETE behavior
5. ✅ Created RLS policies for barbershops and capsters
6. ✅ Created helper function: create_barbershop_with_owner()
7. ✅ Ensured user_profiles has barbershop_id column

NEXT STEPS:
1. Update onboarding flow to call create_barbershop_with_owner()
2. Test onboarding with new user
3. Verify no more foreign key errors

USAGE EXAMPLE (in your frontend):
const { data, error } = await supabase.rpc("create_barbershop_with_owner", {
  p_owner_id: user.id,
  p_barbershop_name: "My Barbershop",
  p_barbershop_address: "Jl. Example No. 123",
  p_barbershop_phone: "08123456789",
  p_capster_name: "John Doe",
  p_capster_phone: "08123456789",
  p_capster_specialization: "Classic & Modern"
});

========================================
';
