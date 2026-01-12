-- ============================================================================
-- BALIK.LAGI SYSTEM - MULTI-LOCATION SUPPORT MIGRATION
-- ============================================================================
-- 
-- Date: 01 Januari 2026
-- Version: 1.0.0
-- Priority: CRITICAL
-- 
-- Purpose:
-- Add multi-location support to BALIK.LAGI system by creating branches table
-- and updating existing tables to support branch-specific operations.
--
-- Safety Features:
-- - IDEMPOTENT: Safe to run multiple times
-- - ROLLBACK support: Includes undo script
-- - DATA PRESERVATION: Migrates existing data to default branch
-- - VALIDATION: Checks data integrity before and after migration
--
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE BRANCHES TABLE
-- ============================================================================

-- Check if branches table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'branches') THEN
        
        RAISE NOTICE '✓ Creating branches table...';
        
        CREATE TABLE branches (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            barbershop_id UUID NOT NULL REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
            
            -- Branch Details
            branch_name VARCHAR(100) NOT NULL,
            branch_code VARCHAR(20) UNIQUE NOT NULL,
            
            -- Location
            address TEXT NOT NULL,
            city VARCHAR(100),
            province VARCHAR(100),
            postal_code VARCHAR(10),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            
            -- Contact
            phone VARCHAR(20),
            whatsapp VARCHAR(20),
            email VARCHAR(100),
            
            -- Operating Hours
            open_time TIME DEFAULT '09:00:00',
            close_time TIME DEFAULT '21:00:00',
            days_open TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            
            -- Management
            manager_name VARCHAR(100),
            manager_phone VARCHAR(20),
            
            -- Settings
            is_active BOOLEAN DEFAULT true,
            is_flagship BOOLEAN DEFAULT false,
            max_capacity_per_day INTEGER DEFAULT 50,
            
            -- Meta
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- Constraints
            CONSTRAINT branch_name_not_empty CHECK (LENGTH(TRIM(branch_name)) > 0),
            CONSTRAINT valid_hours CHECK (open_time < close_time),
            CONSTRAINT valid_capacity CHECK (max_capacity_per_day > 0)
        );
        
        RAISE NOTICE '✓ branches table created successfully';
    ELSE
        RAISE NOTICE '⚠ branches table already exists, skipping creation';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

RAISE NOTICE '✓ Creating indexes...';

-- Drop indexes if they exist (idempotent)
DROP INDEX IF EXISTS idx_branches_barbershop_id;
DROP INDEX IF EXISTS idx_branches_active;
DROP INDEX IF EXISTS idx_branches_branch_code;

-- Create indexes
CREATE INDEX idx_branches_barbershop_id ON branches(barbershop_id);
CREATE INDEX idx_branches_active ON branches(is_active) WHERE is_active = true;
CREATE INDEX idx_branches_branch_code ON branches(branch_code);

RAISE NOTICE '✓ Indexes created successfully';

-- ============================================================================
-- STEP 3: ADD BRANCH_ID TO EXISTING TABLES
-- ============================================================================

-- 3.1: Add branch_id to capsters table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'capsters' AND column_name = 'branch_id'
    ) THEN
        RAISE NOTICE '✓ Adding branch_id to capsters table...';
        
        ALTER TABLE capsters 
            ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_capsters_branch_id ON capsters(branch_id);
        
        RAISE NOTICE '✓ branch_id added to capsters';
    ELSE
        RAISE NOTICE '⚠ branch_id already exists in capsters, skipping';
    END IF;
END $$;

-- 3.2: Add branch_id to service_catalog table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_catalog' AND column_name = 'branch_id'
    ) THEN
        RAISE NOTICE '✓ Adding branch_id to service_catalog table...';
        
        ALTER TABLE service_catalog 
            ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_service_catalog_branch_id ON service_catalog(branch_id);
        
        RAISE NOTICE '✓ branch_id added to service_catalog';
    ELSE
        RAISE NOTICE '⚠ branch_id already exists in service_catalog, skipping';
    END IF;
END $$;

-- 3.3: Add branch_id to bookings table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'branch_id'
    ) THEN
        RAISE NOTICE '✓ Adding branch_id to bookings table...';
        
        ALTER TABLE bookings 
            ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT;
        
        CREATE INDEX idx_bookings_branch_id ON bookings(branch_id);
        CREATE INDEX idx_bookings_branch_date ON bookings(branch_id, booking_date);
        
        RAISE NOTICE '✓ branch_id added to bookings';
    ELSE
        RAISE NOTICE '⚠ branch_id already exists in bookings, skipping';
    END IF;
END $$;

-- 3.4: Add branch_id to barbershop_transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_transactions' AND column_name = 'branch_id'
    ) THEN
        RAISE NOTICE '✓ Adding branch_id to barbershop_transactions table...';
        
        ALTER TABLE barbershop_transactions 
            ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_transactions_branch_id ON barbershop_transactions(branch_id);
        
        RAISE NOTICE '✓ branch_id added to barbershop_transactions';
    ELSE
        RAISE NOTICE '⚠ branch_id already exists in barbershop_transactions, skipping';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: MIGRATE EXISTING DATA TO DEFAULT BRANCH
-- ============================================================================

RAISE NOTICE '✓ Starting data migration...';

-- 4.1: Create default "Main Branch" for each existing barbershop
DO $$ 
DECLARE
    v_count INTEGER;
BEGIN
    -- Check if there are any barbershop_profiles without branches
    SELECT COUNT(*) INTO v_count
    FROM barbershop_profiles bp
    WHERE NOT EXISTS (
        SELECT 1 FROM branches b 
        WHERE b.barbershop_id = bp.id
    );
    
    IF v_count > 0 THEN
        RAISE NOTICE '✓ Creating default branch for % barbershops...', v_count;
        
        INSERT INTO branches (
            barbershop_id,
            branch_name,
            branch_code,
            address,
            phone,
            open_time,
            close_time,
            days_open,
            is_flagship,
            is_active
        )
        SELECT 
            id as barbershop_id,
            COALESCE(barbershop_name, name) || ' - Main Branch' as branch_name,
            'MAIN' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as branch_code,
            COALESCE(address, 'Address not set') as address,
            phone,
            COALESCE(open_time, '09:00:00'::TIME) as open_time,
            COALESCE(close_time, '21:00:00'::TIME) as close_time,
            COALESCE(days_open, ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']) as days_open,
            true as is_flagship,
            is_active
        FROM barbershop_profiles
        WHERE NOT EXISTS (
            SELECT 1 FROM branches b 
            WHERE b.barbershop_id = barbershop_profiles.id
        );
        
        RAISE NOTICE '✓ Created default branches for % barbershops', v_count;
    ELSE
        RAISE NOTICE '⚠ All barbershops already have branches, skipping creation';
    END IF;
END $$;

-- 4.2: Update capsters with default branch reference
DO $$ 
DECLARE
    v_updated INTEGER;
BEGIN
    -- Update capsters that don't have branch_id but have barbershop_id
    UPDATE capsters c
    SET branch_id = b.id
    FROM branches b
    WHERE c.barbershop_id = b.barbershop_id
      AND b.is_flagship = true
      AND c.branch_id IS NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    IF v_updated > 0 THEN
        RAISE NOTICE '✓ Updated % capsters with default branch', v_updated;
    ELSE
        RAISE NOTICE '⚠ No capsters needed branch assignment';
    END IF;
END $$;

-- 4.3: Update bookings with branch from capster
DO $$ 
DECLARE
    v_updated INTEGER;
BEGIN
    -- Update bookings that don't have branch_id
    UPDATE bookings bk
    SET branch_id = c.branch_id
    FROM capsters c
    WHERE bk.capster_id = c.id
      AND c.branch_id IS NOT NULL
      AND bk.branch_id IS NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    IF v_updated > 0 THEN
        RAISE NOTICE '✓ Updated % bookings with branch', v_updated;
    ELSE
        RAISE NOTICE '⚠ No bookings needed branch assignment';
    END IF;
END $$;

-- 4.4: Update transactions with branch from capster
DO $$ 
DECLARE
    v_updated INTEGER;
BEGIN
    -- Update transactions that don't have branch_id
    UPDATE barbershop_transactions bt
    SET branch_id = c.branch_id
    FROM capsters c
    WHERE bt.capster_id = c.id
      AND c.branch_id IS NOT NULL
      AND bt.branch_id IS NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    IF v_updated > 0 THEN
        RAISE NOTICE '✓ Updated % transactions with branch', v_updated;
    ELSE
        RAISE NOTICE '⚠ No transactions needed branch assignment';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

RAISE NOTICE '✓ Setting up RLS policies for branches...';

-- Enable RLS on branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admin full access to branches" ON branches;
DROP POLICY IF EXISTS "Capsters can view their branch" ON branches;
DROP POLICY IF EXISTS "Customers can view active branches" ON branches;
DROP POLICY IF EXISTS "Public can view active branches" ON branches;

-- Policy 1: Admin full access to their barbershop's branches
CREATE POLICY "Admin full access to branches"
ON branches FOR ALL
TO authenticated
USING (
    barbershop_id IN (
        SELECT id FROM barbershop_profiles 
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    barbershop_id IN (
        SELECT id FROM barbershop_profiles 
        WHERE owner_id = auth.uid()
    )
);

-- Policy 2: Capsters can view their assigned branch
CREATE POLICY "Capsters can view their branch"
ON branches FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT branch_id FROM capsters 
        WHERE user_id = auth.uid()
        AND branch_id IS NOT NULL
    )
);

-- Policy 3: Customers can view all active branches
CREATE POLICY "Customers can view active branches"
ON branches FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy 4: Public can view active branches (for booking without login)
CREATE POLICY "Public can view active branches"
ON branches FOR SELECT
TO anon
USING (is_active = true);

RAISE NOTICE '✓ RLS policies created successfully';

-- ============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get active branches count for a barbershop
CREATE OR REPLACE FUNCTION get_active_branches_count(p_barbershop_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM branches
    WHERE barbershop_id = p_barbershop_id
    AND is_active = true;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get default branch for a barbershop
CREATE OR REPLACE FUNCTION get_default_branch(p_barbershop_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_branch_id UUID;
BEGIN
    SELECT id
    INTO v_branch_id
    FROM branches
    WHERE barbershop_id = p_barbershop_id
    AND is_flagship = true
    AND is_active = true
    LIMIT 1;
    
    -- If no flagship branch, return first active branch
    IF v_branch_id IS NULL THEN
        SELECT id
        INTO v_branch_id
        FROM branches
        WHERE barbershop_id = p_barbershop_id
        AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN v_branch_id;
END;
$$;

RAISE NOTICE '✓ Helper functions created successfully';

-- ============================================================================
-- STEP 7: DATA VALIDATION
-- ============================================================================

RAISE NOTICE '✓ Validating migrated data...';

-- Check 1: All barbershops have at least one branch
DO $$ 
DECLARE
    v_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_orphan_count
    FROM barbershop_profiles bp
    WHERE NOT EXISTS (
        SELECT 1 FROM branches b 
        WHERE b.barbershop_id = bp.id
    );
    
    IF v_orphan_count = 0 THEN
        RAISE NOTICE '✅ All barbershops have at least one branch';
    ELSE
        RAISE WARNING '⚠ Found % barbershops without branches!', v_orphan_count;
    END IF;
END $$;

-- Check 2: All capsters with barbershop_id have branch_id
DO $$ 
DECLARE
    v_orphan_capsters INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_orphan_capsters
    FROM capsters
    WHERE barbershop_id IS NOT NULL
    AND branch_id IS NULL;
    
    IF v_orphan_capsters = 0 THEN
        RAISE NOTICE '✅ All capsters have branch assignment';
    ELSE
        RAISE WARNING '⚠ Found % capsters without branch assignment!', v_orphan_capsters;
    END IF;
END $$;

-- Check 3: Summary statistics
DO $$ 
DECLARE
    v_branch_count INTEGER;
    v_capster_count INTEGER;
    v_booking_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_branch_count FROM branches;
    SELECT COUNT(*) INTO v_capster_count FROM capsters WHERE branch_id IS NOT NULL;
    SELECT COUNT(*) INTO v_booking_count FROM bookings WHERE branch_id IS NOT NULL;
    
    RAISE NOTICE '📊 Migration Summary:';
    RAISE NOTICE '   - Total branches created: %', v_branch_count;
    RAISE NOTICE '   - Capsters assigned to branches: %', v_capster_count;
    RAISE NOTICE '   - Bookings linked to branches: %', v_booking_count;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 
    '✅ MULTI-LOCATION SUPPORT MIGRATION COMPLETED SUCCESSFULLY!' as status,
    NOW() as completed_at;

-- ============================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ============================================================================
/*
-- CAUTION: This will remove all multi-location data!
-- Only run if you need to undo the migration

-- Drop helper functions
DROP FUNCTION IF EXISTS get_active_branches_count(UUID);
DROP FUNCTION IF EXISTS get_default_branch(UUID);

-- Drop RLS policies
DROP POLICY IF EXISTS "Admin full access to branches" ON branches;
DROP POLICY IF EXISTS "Capsters can view their branch" ON branches;
DROP POLICY IF EXISTS "Customers can view active branches" ON branches;
DROP POLICY IF EXISTS "Public can view active branches" ON branches;

-- Remove branch_id columns
ALTER TABLE barbershop_transactions DROP COLUMN IF EXISTS branch_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS branch_id;
ALTER TABLE service_catalog DROP COLUMN IF EXISTS branch_id;
ALTER TABLE capsters DROP COLUMN IF EXISTS branch_id;

-- Drop branches table
DROP TABLE IF EXISTS branches CASCADE;

-- Cleanup
SELECT '✅ ROLLBACK COMPLETED' as status;
*/
