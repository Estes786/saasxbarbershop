const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLS() {
  console.log('🔐 Applying RLS Policies to Supabase...\n');
  
  const sql = `
-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role has full access"
ON user_profiles FOR ALL TO service_role
USING (true) WITH CHECK (true);
  `;
  
  console.log('⚠️  NOTE: Supabase JS Client does not support raw SQL execution.');
  console.log('📋 You need to manually apply this SQL in Supabase SQL Editor:');
  console.log('🔗 https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
  console.log('=' .repeat(60));
  console.log(sql);
  console.log('=' .repeat(60));
  
  // Test connection
  console.log('\n✅ Testing Supabase connection...');
  const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.log('❌ Error:', error.message);
    if (error.code === '42P01') {
      console.log('⚠️  Table user_profiles does not exist yet!');
    } else if (error.code === '42501') {
      console.log('⚠️  RLS is blocking access - policies need to be applied!');
    }
  } else {
    console.log('✅ Connection successful!');
  }
}

applyRLS().catch(console.error);
