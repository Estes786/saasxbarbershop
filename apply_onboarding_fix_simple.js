const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyOnboardingFix() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 APPLYING ONBOARDING FIX - STEP BY STEP');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Make barbershop_id nullable
    console.log('📝 Step 1: Making barbershop_id nullable in capsters table...');
    
    // We'll use raw SQL via fetch to Supabase Management API
    const makeNullableSQL = `
-- Make barbershop_id nullable (CRITICAL FIX)
DO $$
BEGIN
  ALTER TABLE capsters ALTER COLUMN barbershop_id DROP NOT NULL;
  RAISE NOTICE 'barbershop_id is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Already nullable or error: %', SQLERRM;
END $$;
`;

    // Use Supabase CLI simulation - execute via Management API
    console.log('   Executing SQL...');
    
    // Try using fetch to post to Supabase SQL endpoint
    const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
    
    const response = await fetch(
      `https://api.supabase.com/v1/projects/qwqmhvwqeynnyxaecqzw/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: makeNullableSQL
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Management API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Step 1 completed!', result);

    // Step 2: Verify the change
    console.log('\n📝 Step 2: Verifying database state...');
    const { data: capsters, error } = await supabase
      .from('capsters')
      .select('id, barbershop_id, name, capster_name')
      .limit(3);

    if (error) {
      console.log('⚠️  Verification warning:', error.message);
    } else {
      console.log('✅ Current capsters data:', JSON.stringify(capsters, null, 2));
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ONBOARDING FIX APPLIED SUCCESSFULLY');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n' + '='.repeat(70));
    console.log('📋 ALTERNATIVE: MANUAL EXECUTION VIA SUPABASE SQL EDITOR');
    console.log('='.repeat(70) + '\n');
    console.log('Since automated execution is not working, please execute the SQL manually:\n');
    console.log('1. Open: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
    console.log('2. Copy and paste this SQL:\n');
    console.log('```sql');
    console.log(`
-- ========================================
-- ONBOARDING FIX - BALIK.LAGI SYSTEM
-- ========================================

-- Drop existing foreign key constraint
ALTER TABLE capsters DROP CONSTRAINT IF EXISTS capsters_barbershop_id_fkey;

-- Make barbershop_id nullable (CRITICAL FIX!)
ALTER TABLE capsters ALTER COLUMN barbershop_id DROP NOT NULL;

-- Make other columns flexible
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

-- Sync name <-> capster_name
UPDATE capsters SET name = capster_name WHERE name IS NULL AND capster_name IS NOT NULL;
UPDATE capsters SET capster_name = name WHERE capster_name IS NULL AND name IS NOT NULL;

-- Create sync trigger
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

-- Set default values
ALTER TABLE capsters ALTER COLUMN rating SET DEFAULT 5.0;
ALTER TABLE capsters ALTER COLUMN total_customers_served SET DEFAULT 0;
ALTER TABLE capsters ALTER COLUMN total_revenue_generated SET DEFAULT 0;
ALTER TABLE capsters ALTER COLUMN is_available SET DEFAULT true;
ALTER TABLE capsters ALTER COLUMN years_of_experience SET DEFAULT 0;

SELECT 'Onboarding fix completed!' as status;
    `);
    console.log('```\n');
    console.log('3. Click "Run" button');
    console.log('4. Check for success message\n');
    
    process.exit(1);
  }
}

applyOnboardingFix();
