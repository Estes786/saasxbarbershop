const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Checking Triggers and Functions...\n');
console.log('=' .repeat(60));

// Test creating profile directly with service role
async function testDirectProfileCreation() {
  console.log('\n🧪 TEST: Direct Profile Creation (with service role)');
  console.log('-' .repeat(60));
  
  const testUserId = 'test-user-' + Date.now();
  
  try {
    console.log('⏳ Attempting to create profile...');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '081234567890',
        role: 'customer'
      }])
      .select();
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.message.includes('infinite recursion')) {
        console.log('\n   🔍 ROOT CAUSE: Infinite recursion in RLS policies!');
        console.log('   This means the policies are calling themselves recursively.');
        console.log('   The trigger that creates profile might be using SELECT');
        console.log('   which triggers RLS policy that does another SELECT...');
      }
      return { success: false, error: error.message };
    }
    
    console.log(`   ✅ Success! Profile created:`);
    console.log('   ', JSON.stringify(data[0], null, 2));
    
    // Cleanup
    await supabase.from('user_profiles').delete().eq('id', testUserId);
    
    return { success: true, data };
    
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Check if there's a trigger on auth.users
async function checkAuthTriggers() {
  console.log('\n🔍 Checking for auth.users triggers...');
  console.log('-' .repeat(60));
  console.log('   ⚠️  Cannot query pg_catalog from client');
  console.log('   Need to check manually in Supabase SQL Editor');
  console.log('\n   Run this query:');
  console.log('   SELECT * FROM pg_trigger WHERE tgrelid = \'auth.users\'::regclass;');
}

async function main() {
  await testDirectProfileCreation();
  await checkAuthTriggers();
  
  console.log('\n' + '=' .repeat(60));
  console.log('💡 DIAGNOSIS');
  console.log('=' .repeat(60));
  console.log('\nThe infinite recursion error suggests that:');
  console.log('1. A trigger on auth.users tries to create user_profile');
  console.log('2. The trigger uses SELECT to check if profile exists');
  console.log('3. The SELECT triggers RLS policy');
  console.log('4. The RLS policy does another SELECT (recursion!)');
  console.log('\n🔧 SOLUTION OPTIONS:');
  console.log('\nOPTION A: Remove the problematic trigger');
  console.log('   - Check what triggers exist on auth.users');
  console.log('   - Drop any trigger that auto-creates profiles');
  console.log('   - Let application code create profiles instead');
  console.log('\nOPTION B: Fix the RLS policy to avoid recursion');
  console.log('   - Use security definer function instead');
  console.log('   - Or use service_role for the trigger');
  console.log('\nOPTION C: Disable RLS temporarily for testing');
  console.log('   - ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;');
  console.log('   - Test authentication flows');
  console.log('   - Re-enable after fixing the issue');
  console.log('\n' + '=' .repeat(60));
}

main();
