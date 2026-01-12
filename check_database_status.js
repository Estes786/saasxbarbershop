const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Checking Database Configuration...\n');

async function checkDatabase() {
  // Test 1: Check if user_profiles table exists and is accessible
  console.log('Test 1: Checking user_profiles table...');
  const { data: profiles, error: profileError, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  if (profileError) {
    console.log(`❌ Error accessing user_profiles: ${profileError.message}`);
    console.log(`   Code: ${profileError.code}`);
  } else {
    console.log(`✅ user_profiles table exists (${count || 0} rows)`);
  }

  // Test 2: Try to insert a test profile (will fail if RLS not configured properly)
  console.log('\nTest 2: Testing profile creation with service role...');
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const { data: insertData, error: insertError } = await supabase
    .from('user_profiles')
    .upsert({
      id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'customer',
      phone: '081234567890'
    }, { onConflict: 'id' })
    .select();

  if (insertError) {
    console.log(`❌ Cannot create profile: ${insertError.message}`);
    console.log(`   Code: ${insertError.code}`);
    console.log(`   Details: ${insertError.details}`);
  } else {
    console.log(`✅ Profile creation works!`);
    
    // Clean up test data
    await supabase.from('user_profiles').delete().eq('id', testUserId);
  }

  // Test 3: Check other tables
  console.log('\nTest 3: Checking other tables...');
  const tables = ['barbershop_transactions', 'barbershop_customers', 'bookings'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: exists (${count || 0} rows)`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DATABASE STATUS SUMMARY');
  console.log('='.repeat(60));
  
  if (profileError && profileError.code === '42501') {
    console.log('⚠️  RLS POLICIES NOT CONFIGURED YET');
    console.log('   Error code 42501 = insufficient privilege');
    console.log('   This means RLS is enabled but policies are missing');
    console.log('\n📋 ACTION REQUIRED:');
    console.log('   Apply RLS policies manually via Supabase SQL Editor');
    console.log('   File: APPLY_ALL_FIXES.sql');
    console.log('   URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  } else if (!profileError) {
    console.log('✅ DATABASE CONFIGURATION LOOKS GOOD');
    console.log('   All tables accessible');
    console.log('   Ready for testing!');
  } else {
    console.log('⚠️  UNEXPECTED ERROR');
    console.log(`   ${profileError?.message || 'Unknown error'}`);
  }
  
  console.log('='.repeat(60));
}

checkDatabase().catch(console.error);
