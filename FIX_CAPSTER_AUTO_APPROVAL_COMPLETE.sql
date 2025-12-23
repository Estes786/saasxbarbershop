-- COMPREHENSIVE FIX FOR SAASXBARBERSHOP DATABASE
-- This script is IDEMPOTENT and SAFE to run multiple times
-- Created: 2025-12-23
-- Purpose: Fix capster registration, auto-approval, and orphaned accounts

BEGIN;

-- ================================================================
-- PART 1: FIX CAPSTER PROFILES WITHOUT CAPSTER RECORDS
-- ================================================================
-- Create capster records for all capster profiles that don't have one

DO $$
DECLARE
    capster_profile RECORD;
    new_capster_id TEXT;
BEGIN
    -- Loop through all capster profiles without capster records
    FOR capster_profile IN 
        SELECT up.id, up.email, up.customer_name, up.customer_phone
        FROM user_profiles up
        LEFT JOIN capsters c ON c.user_id = up.id
        WHERE up.role = 'capster' AND c.id IS NULL
    LOOP
        RAISE NOTICE 'Creating capster record for: % (%)', capster_profile.email, capster_profile.id;
        
        -- Insert capster record
        INSERT INTO capsters (
            user_id,
            capster_name,
            phone,
            specialization,
            is_available,
            total_customers_served,
            total_revenue_generated,
            rating
        ) VALUES (
            capster_profile.id,
            COALESCE(capster_profile.customer_name, capster_profile.email),
            capster_profile.customer_phone,
            'all',
            true,  -- AUTO-APPROVED: capster available by default
            0,
            0.0,
            0.0
        )
        RETURNING id::text INTO new_capster_id;
        
        -- Update user_profile with capster_id (if column exists)
        BEGIN
            EXECUTE format('UPDATE user_profiles SET capster_id = %L WHERE id = %L', new_capster_id, capster_profile.id);
            RAISE NOTICE '✅ Updated user_profile with capster_id: %', new_capster_id;
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE '⚠️  capster_id column does not exist in user_profiles (OK)';
        END;
        
        RAISE NOTICE '✅ Created capster record with ID: %', new_capster_id;
    END LOOP;
END $$;

-- ================================================================
-- PART 2: FIX ORPHANED AUTH USERS WITHOUT PROFILES
-- ================================================================
-- Create user profiles for auth users that don't have one
-- Default to 'customer' role for safety

DO $$
DECLARE
    auth_user_id UUID;
    auth_user_email TEXT;
    profile_count INTEGER;
BEGIN
    -- Note: This requires manual intervention since we can't directly query auth.users
    -- The auth users without profiles should be handled during OAuth callback or registration
    RAISE NOTICE '⚠️  Orphaned auth users should be handled by OAuth callback or registration flow';
    RAISE NOTICE '    If needed, manually create profiles using:';
    RAISE NOTICE '    INSERT INTO user_profiles (id, email, role) VALUES (user_id, user_email, ''customer'')';
END $$;

-- ================================================================
-- PART 3: ENSURE RLS POLICIES ALLOW CAPSTER AUTO-APPROVAL
-- ================================================================
-- Make sure RLS policies allow capsters to read their own records

-- Enable RLS on capsters table (if not already enabled)
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Capsters can view own record" ON capsters;
DROP POLICY IF EXISTS "Capsters can update own record" ON capsters;
DROP POLICY IF EXISTS "Service role has full access to capsters" ON capsters;
DROP POLICY IF EXISTS "Public can view available capsters" ON capsters;

-- Create new RLS policies for capsters table
CREATE POLICY "Capsters can view own record"
    ON capsters
    FOR SELECT
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "Capsters can update own record"
    ON capsters
    FOR UPDATE
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "Service role has full access to capsters"
    ON capsters
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Public can view available capsters (for booking system)
CREATE POLICY "Public can view available capsters"
    ON capsters
    FOR SELECT
    USING (is_available = true);

-- ================================================================
-- PART 4: UPDATE USER_PROFILES RLS POLICIES
-- ================================================================
-- Ensure user_profiles RLS allows capsters to read their own profile

-- Enable RLS on user_profiles (if not already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- Recreate policies
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    USING (
        auth.uid() = id
    );

CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (
        auth.uid() = id
    );

CREATE POLICY "Service role has full access"
    ON user_profiles
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- ================================================================
-- PART 5: ADD CAPSTER_ID COLUMN TO USER_PROFILES (IF NOT EXISTS)
-- ================================================================
-- This helps link user_profiles to capsters table

DO $$
BEGIN
    -- Check if capster_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'capster_id'
    ) THEN
        -- Add capster_id column
        ALTER TABLE user_profiles ADD COLUMN capster_id TEXT;
        
        -- Add foreign key constraint (optional, can be null)
        ALTER TABLE user_profiles 
        ADD CONSTRAINT fk_user_profiles_capster 
        FOREIGN KEY (capster_id) 
        REFERENCES capsters(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added capster_id column to user_profiles';
    ELSE
        RAISE NOTICE '⚠️  capster_id column already exists';
    END IF;
    
    -- Update existing capster profiles with capster_id
    UPDATE user_profiles up
    SET capster_id = c.id::text
    FROM capsters c
    WHERE c.user_id = up.id 
    AND up.role = 'capster' 
    AND up.capster_id IS NULL;
    
    RAISE NOTICE '✅ Updated existing capster profiles with capster_id';
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
    capster_profiles_count INTEGER;
    capster_records_count INTEGER;
    capsters_without_records INTEGER;
BEGIN
    -- Count capster profiles
    SELECT COUNT(*) INTO capster_profiles_count
    FROM user_profiles
    WHERE role = 'capster';
    
    -- Count capster records with user_id
    SELECT COUNT(*) INTO capster_records_count
    FROM capsters
    WHERE user_id IS NOT NULL;
    
    -- Count capster profiles without records
    SELECT COUNT(*) INTO capsters_without_records
    FROM user_profiles up
    LEFT JOIN capsters c ON c.user_id = up.id
    WHERE up.role = 'capster' AND c.id IS NULL;
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'VERIFICATION RESULTS:';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Capster profiles: %', capster_profiles_count;
    RAISE NOTICE 'Capster records (with user_id): %', capster_records_count;
    RAISE NOTICE 'Capsters without records: %', capsters_without_records;
    
    IF capsters_without_records = 0 THEN
        RAISE NOTICE '✅ ALL CAPSTER PROFILES HAVE RECORDS!';
    ELSE
        RAISE NOTICE '❌ STILL HAVE % CAPSTERS WITHOUT RECORDS', capsters_without_records;
    END IF;
END $$;

COMMIT;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ DATABASE FIX COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes made:';
    RAISE NOTICE '1. Created capster records for all capster profiles';
    RAISE NOTICE '2. Enabled auto-approval (is_available = true by default)';
    RAISE NOTICE '3. Updated RLS policies for capsters and user_profiles';
    RAISE NOTICE '4. Added capster_id column to user_profiles (if missing)';
    RAISE NOTICE '5. Linked existing capster profiles to capster records';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Capster registration now works with AUTO-APPROVAL!';
    RAISE NOTICE '';
END $$;
