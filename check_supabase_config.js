const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConfiguration() {
  console.log('🔍 Checking Supabase Configuration...\n');
  
  // Check 1: user_profiles table existence and structure
  console.log('1️⃣ Checking user_profiles table...');
  const { data: profiles, error: profilesError, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  if (profilesError && profilesError.code === '42P01') {
    console.log('❌ user_profiles table does NOT exist');
  } else if (profilesError) {
    console.log('⚠️  Error:', profilesError.message);
  } else {
    console.log(`✅ user_profiles table exists (${count || 0} rows)`);
  }
  
  // Check 2: barbershop_customers table
  console.log('\n2️⃣ Checking barbershop_customers table...');
  const { data: customers, error: customersError, count: customerCount } = await supabase
    .from('barbershop_customers')
    .select('*', { count: 'exact', head: true });
  
  if (customersError && customersError.code === '42P01') {
    console.log('❌ barbershop_customers table does NOT exist');
  } else if (customersError) {
    console.log('⚠️  Error:', customersError.message);
  } else {
    console.log(`✅ barbershop_customers table exists (${customerCount || 0} rows)`);
  }
  
  // Check 3: Test RLS on user_profiles (should work with service_role)
  console.log('\n3️⃣ Testing RLS with service_role...');
  const { data: testData, error: testError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (testError) {
    console.log('❌ RLS test failed:', testError.message);
    if (testError.message.includes('permission denied')) {
      console.log('   → RLS is enabled but service_role policy might be missing');
    }
  } else {
    console.log('✅ RLS test passed (service_role can access user_profiles)');
  }
  
  // Check 4: List all users
  console.log('\n4️⃣ Listing auth users...');
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.log('❌ Error listing users:', usersError.message);
  } else {
    console.log(`✅ Found ${users.length} auth users`);
    if (users.length > 0) {
      console.log('   Sample users:');
      users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Configuration Summary:');
  console.log('='.repeat(60));
  console.log('Application URL: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai');
  console.log('Supabase URL: https://qwqmhvwqeynnyxaecqzw.supabase.co');
  console.log('\n📋 Next Steps:');
  console.log('1. Apply RLS policies: Copy content from APPLY_RLS_POLICIES.sql to Supabase SQL Editor');
  console.log('2. Configure Google OAuth in Supabase Dashboard');
  console.log('3. Test authentication flows');
}

checkConfiguration().catch(console.error);
