// Analyze current database state for ACCESS KEY implementation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('🔍 Analyzing Supabase Database State...\n');

  try {
    // 1. Check if access_keys table exists
    console.log('1️⃣  Checking access_keys table...');
    const { data: accessKeysTable, error: accessKeysError } = await supabase
      .from('access_keys')
      .select('*')
      .limit(5);
    
    if (accessKeysError) {
      console.log('❌ access_keys table DOES NOT EXIST');
      console.log('   Error:', accessKeysError.message);
    } else {
      console.log('✅ access_keys table EXISTS');
      console.log('   Records count:', accessKeysTable.length);
      if (accessKeysTable.length > 0) {
        console.log('   Sample data:', JSON.stringify(accessKeysTable[0], null, 2));
      }
    }

    // 2. Check user_profiles table
    console.log('\n2️⃣  Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role, created_at')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ user_profiles table error:', profilesError.message);
    } else {
      console.log('✅ user_profiles table EXISTS');
      console.log('   Total profiles:', profiles.length);
      
      // Count by role
      const { data: roleCount } = await supabase
        .from('user_profiles')
        .select('role');
      
      if (roleCount) {
        const roleCounts = roleCount.reduce((acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        }, {});
        console.log('   Role distribution:', roleCounts);
      }
    }

    // 3. Check auth.users
    console.log('\n3️⃣  Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth.users:', authError.message);
    } else {
      console.log('✅ auth.users accessible');
      console.log('   Total auth users:', authUsers.users.length);
    }

    // 4. Check RLS policies
    console.log('\n4️⃣  Checking RLS policies...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'access_keys' })
      .catch(() => null);
    
    if (rlsError || !rlsPolicies) {
      console.log('⚠️  Cannot check RLS policies (function might not exist)');
    } else {
      console.log('✅ RLS policies check available');
    }

    // 5. Check for functions
    console.log('\n5️⃣  Checking database functions...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('validate_access_key', { p_key: 'TEST', p_role: 'customer' })
      .catch(() => null);
    
    if (functionsError || !functions) {
      console.log('❌ validate_access_key function DOES NOT EXIST');
    } else {
      console.log('✅ validate_access_key function EXISTS');
    }

    console.log('\n📊 ANALYSIS COMPLETE\n');
    console.log('='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('1. Create access_keys table if not exists');
    console.log('2. Create validate_access_key function');
    console.log('3. Insert seed data for 3 roles');
    console.log('4. Update registration pages to require ACCESS KEY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeDatabase();
