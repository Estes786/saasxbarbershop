-- ====================================================================
-- FIX CAPSTERS TABLE - SAFE & IDEMPOTENT
-- ====================================================================
-- Purpose: Sync capster_name and name columns
-- Root Cause: Code uses 'capster_name' but table has NOT NULL on 'name'
-- Solution: Ensure both columns exist and are synced
-- Date: 2025-12-30
-- ====================================================================

-- Step 1: Check current state
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CAPSTERS TABLE ANALYSIS';
    RAISE NOTICE '========================================';
    
    -- Log table existence
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'capsters'
    ) THEN
        RAISE NOTICE '✅ Table "capsters" exists';
    ELSE
        RAISE NOTICE '❌ Table "capsters" does not exist!';
        RETURN;
    END IF;
    
    -- Log column information
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'capsters' 
        AND column_name = 'capster_name'
    ) THEN
        RAISE NOTICE '✅ Column "capster_name" exists';
    ELSE
        RAISE NOTICE '⚠️  Column "capster_name" does NOT exist';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'capsters' 
        AND column_name = 'name'
    ) THEN
        RAISE NOTICE '✅ Column "name" exists';
    ELSE
        RAISE NOTICE '⚠️  Column "name" does NOT exist';
    END IF;
END $$;

-- Step 2: Ensure both columns exist (idempotent)
DO $$
BEGIN
    -- Add 'name' column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'capsters' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE capsters ADD COLUMN name TEXT;
        RAISE NOTICE '✅ Added column "name"';
    ELSE
        RAISE NOTICE '✅ Column "name" already exists';
    END IF;
    
    -- Add 'capster_name' column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'capsters' 
        AND column_name = 'capster_name'
    ) THEN
        ALTER TABLE capsters ADD COLUMN capster_name TEXT;
        RAISE NOTICE '✅ Added column "capster_name"';
    ELSE
        RAISE NOTICE '✅ Column "capster_name" already exists';
    END IF;
END $$;

-- Step 3: Remove NOT NULL constraints (make both nullable first)
DO $$
BEGIN
    -- Remove NOT NULL from 'name' if exists
    BEGIN
        ALTER TABLE capsters ALTER COLUMN name DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from "name"';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  "name" column already nullable or error: %', SQLERRM;
    END;
    
    -- Remove NOT NULL from 'capster_name' if exists
    BEGIN
        ALTER TABLE capsters ALTER COLUMN capster_name DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from "capster_name"';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  "capster_name" column already nullable or error: %', SQLERRM;
    END;
END $$;

-- Step 4: Sync data between columns
DO $$
DECLARE
    updated_count INT;
BEGIN
    -- Copy capster_name to name where name is NULL
    UPDATE capsters 
    SET name = capster_name 
    WHERE name IS NULL AND capster_name IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Synced % rows: capster_name -> name', updated_count;
    
    -- Copy name to capster_name where capster_name is NULL
    UPDATE capsters 
    SET capster_name = name 
    WHERE capster_name IS NULL AND name IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Synced % rows: name -> capster_name', updated_count;
END $$;

-- Step 5: Add trigger to keep both columns in sync (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_capster_name_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If capster_name is set, sync to name
    IF NEW.capster_name IS NOT NULL THEN
        NEW.name := NEW.capster_name;
    END IF;
    
    -- If name is set, sync to capster_name
    IF NEW.name IS NOT NULL THEN
        NEW.capster_name := NEW.name;
    END IF;
    
    -- If both are NULL, use email as fallback
    IF NEW.name IS NULL AND NEW.capster_name IS NULL THEN
        -- Get user email from user_profiles
        SELECT email INTO NEW.name
        FROM user_profiles
        WHERE id = NEW.user_id
        LIMIT 1;
        
        NEW.capster_name := NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_capster_name ON capsters;

-- Create trigger
CREATE TRIGGER trigger_sync_capster_name
    BEFORE INSERT OR UPDATE ON capsters
    FOR EACH ROW
    EXECUTE FUNCTION sync_capster_name_columns();

RAISE NOTICE '✅ Created trigger to sync capster_name and name columns';

-- Step 6: Verify final state
DO $$
DECLARE
    null_name_count INT;
    null_capster_name_count INT;
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO total_count FROM capsters;
    SELECT COUNT(*) INTO null_name_count FROM capsters WHERE name IS NULL;
    SELECT COUNT(*) INTO null_capster_name_count FROM capsters WHERE capster_name IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL STATE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total capsters: %', total_count;
    RAISE NOTICE 'NULL name: %', null_name_count;
    RAISE NOTICE 'NULL capster_name: %', null_capster_name_count;
    
    IF null_name_count = 0 AND null_capster_name_count = 0 THEN
        RAISE NOTICE '✅ ALL COLUMNS PROPERLY SYNCED!';
    ELSE
        RAISE NOTICE '⚠️  Some NULL values remain - this is OK if table is empty';
    END IF;
END $$;
