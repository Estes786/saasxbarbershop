const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFixes() {
  console.log('🚀 Applying RLS Fixes to Supabase...\n');
  console.log('=' .repeat(60));
  
  const sql = `
-- STEP 1: Enable RLS on user_profiles
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Public users can view roles" ON user_profiles;

-- STEP 3: Create RLS Policies

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (untuk registration)
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Service role has full access (CRITICAL untuk OAuth callback)
CREATE POLICY "Service role has full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 4: Fix SQL Function (IMMUTABLE error fix)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- STEP 5: Recreate Triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON barbershop_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON barbershop_customers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`;

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing:`);
    console.log(stmt.substring(0, 80) + '...');

    try {
      const { data, error } = await supabase.rpc('exec', { sql: stmt + ';' });
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      errorCount++;
    }

    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${statements.length}`);
  console.log('\n' + '=' .repeat(60));
}

applyRLSFixes().catch(console.error);
