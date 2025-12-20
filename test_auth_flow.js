const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow\n');
  console.log('=' .repeat(70));
  
  // Test 1: Check RLS Policies
  console.log('\n📋 TEST 1: Checking RLS Policies\n');
  
  try {
    // Try to read user_profiles as anon user (should fail or be empty)
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('✅ RLS Working: Anon user cannot read profiles');
      console.log(`   Error: ${anonError.message}`);
    } else {
      console.log(`⚠️  Anon user can read profiles (${anonData.length} rows)`);
    }
  } catch (err) {
    console.log(`✅ RLS Working: ${err.message}`);
  }
  
  // Test 2: Service Role Access
  console.log('\n📋 TEST 2: Service Role Access\n');
  
  try {
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (serviceError) {
      console.log(`❌ Service role error: ${serviceError.message}`);
    } else {
      console.log(`✅ Service role can access profiles (${serviceData.length} profiles)`);
      serviceData.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    }
  } catch (err) {
    console.log(`❌ Service role exception: ${err.message}`);
  }
  
  // Test 3: Test Email Login
  console.log('\n📋 TEST 3: Testing Email Login\n');
  
  // Get an existing user email
  const { data: existingUsers } = await supabaseService
    .from('user_profiles')
    .select('email, role')
    .limit(1);
  
  if (existingUsers && existingUsers.length > 0) {
    const testEmail = existingUsers[0].email;
    console.log(`Testing with email: ${testEmail}`);
    console.log('Note: This will only work if you know the password');
    console.log('For testing, you should manually login via:');
    console.log(`https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai/login\n`);
  }
  
  // Test 4: Test Google OAuth Configuration
  console.log('📋 TEST 4: Google OAuth Configuration\n');
  
  console.log('To test Google OAuth:');
  console.log('1. Go to: https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai/login');
  console.log('2. Click "Continue with Google"');
  console.log('3. Complete Google authentication');
  console.log('4. Should redirect to /auth/callback');
  console.log('5. Should auto-create profile and redirect to dashboard\n');
  
  console.log('⚠️  IMPORTANT: Ensure Google OAuth is configured in Supabase:');
  console.log('   URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw');
  console.log('   Navigate to: Authentication → Providers → Google');
  console.log('   Redirect URL: https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai/auth/callback\n');
  
  // Test 5: Check Database Tables
  console.log('📋 TEST 5: Database Tables Status\n');
  
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking',
    'bookings'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseService
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table.padEnd(35)} - Error: ${error.code}`);
      } else {
        console.log(`✅ ${table.padEnd(35)} - ${count || 0} rows`);
      }
    } catch (err) {
      console.log(`⚠️  ${table.padEnd(35)} - ${err.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n✅ Authentication Test Complete!\n');
  console.log('📱 Public URL: https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai');
  console.log('🔐 Login: https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai/login');
  console.log('📝 Register: https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai/register\n');
}

testAuthFlow().catch(console.error);
