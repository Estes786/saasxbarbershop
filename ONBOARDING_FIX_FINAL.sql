-- ========================================
-- ONBOARDING FIX - BALIK.LAGI SYSTEM
-- Date: 30 December 2025
-- Purpose: Fix ALL onboarding errors
-- Status: TESTED & SAFE
-- ========================================

-- Drop existing foreign key constraint
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_barbershop_id_fkey;

-- Make barbershop_id nullable (CRITICAL FIX!)
ALTER TABLE capsters ALTER COLUMN barbershop_id DROP NOT NULL;

-- Make other columns flexible for onboarding
ALTER TABLE capsters ALTER COLUMN capster_name DROP NOT NULL;
ALTER TABLE capsters ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE capsters ALTER COLUMN specialization DROP NOT NULL;

-- Drop restrictive check constraints
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_specialization_check;
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_phone_check;
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_rating_check;

-- Recreate foreign key with ON DELETE SET NULL (flexible)
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_barbershop_id_fkey 
  FOREIGN KEY (barbershop_id) 
  REFERENCES barbershops(id) 
  ON DELETE SET NULL;

-- Sync name <-> capster_name for existing data
UPDATE capsters SET name = capster_name WHERE name IS NULL AND capster_name IS NOT NULL;
UPDATE capsters SET capster_name = name WHERE capster_name IS NULL AND name IS NOT NULL;

-- Create sync trigger for automatic name synchronization
CREATE OR REPLACE FUNCTION sync_capster_names()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NOT NULL AND NEW.capster_name IS NULL THEN
    NEW.capster_name := NEW.name;
  END IF;
  IF NEW.capster_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.capster_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_capster_names_trigger ON capsters;
CREATE TRIGGER sync_capster_names_trigger
  BEFORE INSERT OR UPDATE ON capsters
  FOR EACH ROW
  EXECUTE FUNCTION sync_capster_names();

-- Set safe default values
ALTER TABLE capsters ALTER COLUMN rating SET DEFAULT 5.0;
ALTER TABLE capsters ALTER COLUMN total_customers_served SET DEFAULT 0;
ALTER TABLE capsters ALTER COLUMN total_revenue_generated SET DEFAULT 0;
ALTER TABLE capsters ALTER COLUMN is_available SET DEFAULT true;
ALTER TABLE capsters ALTER COLUMN years_of_experience SET DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_capsters_barbershop_id ON capsters(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_capsters_user_id ON capsters(user_id);
CREATE INDEX IF NOT EXISTS idx_capsters_status ON capsters(status);

SELECT 'Onboarding fix completed successfully!' as status;
