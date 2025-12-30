-- ====================================================================
-- ONBOARDING FIX - CAPSTERS TABLE
-- ====================================================================
-- Purpose: Add trigger to auto-sync capster_name and name columns
-- Root Cause: Code uses 'capster_name', table might have NOT NULL on 'name'
-- Solution: Trigger ensures both columns are always synced
-- Date: 2025-12-30
-- Status: SAFE, TESTED, IDEMPOTENT
-- ====================================================================

-- Function to sync both name columns before insert/update
CREATE OR REPLACE FUNCTION sync_capster_name_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If capster_name is provided, sync to name
    IF NEW.capster_name IS NOT NULL AND NEW.capster_name != '' THEN
        NEW.name := NEW.capster_name;
    END IF;
    
    -- If name is provided, sync to capster_name
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        NEW.capster_name := NEW.name;
    END IF;
    
    -- If both are NULL or empty, use email as fallback
    IF (NEW.name IS NULL OR NEW.name = '') AND (NEW.capster_name IS NULL OR NEW.capster_name = '') THEN
        -- Get user email from user_profiles
        SELECT COALESCE(customer_name, email) INTO NEW.name
        FROM user_profiles
        WHERE id = NEW.user_id
        LIMIT 1;
        
        NEW.capster_name := COALESCE(NEW.name, 'Capster');
        NEW.name := COALESCE(NEW.name, 'Capster');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trigger_sync_capster_name ON capsters;

-- Create trigger
CREATE TRIGGER trigger_sync_capster_name
    BEFORE INSERT OR UPDATE ON capsters
    FOR EACH ROW
    EXECUTE FUNCTION sync_capster_name_columns();

-- Verify trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_capster_name'
AND event_object_table = 'capsters';
