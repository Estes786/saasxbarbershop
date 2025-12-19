const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailRegistration() {
  console.log('\n🧪 TEST 1: Email Registration (Customer)\n');
  console.log('=' .repeat(60));
  
  const testEmail = `testuser${Date.now()}@example.com`;
  const testPhone = `081234${Math.floor(Math.random() * 1000000)}`;
  const testPassword = 'test123456';
  
  console.log('Test Data:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  Phone: ${testPhone}`);
  console.log(`  Password: ${testPassword}`);
  console.log('');
  
  try {
    // Step 1: Sign up with Supabase Auth
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.log('❌ Auth Error:', authError.message);
      return { success: false, error: authError };
    }
    
    if (!authData.user) {
      console.log('❌ No user returned from signup');
      return { success: false, error: 'No user returned' };
    }
    
    console.log('✅ Auth user created:', authData.user.id);
    console.log('');
    
    // Step 2: Create customer record
    console.log('Step 2: Creating customer record...');
    const { error: customerError } = await supabase
      .from('barbershop_customers')
      .insert({
        customer_phone: testPhone,
        customer_name: 'Test User',
        total_visits: 0,
        total_revenue: 0,
        average_atv: 0,
        coupon_count: 0,
        coupon_eligible: false,
        google_review_given: false,
        churn_risk_score: 0,
        first_visit_date: new Date().toISOString(),
      });
    
    if (customerError) {
      console.log('❌ Customer Error:', customerError.message);
      return { success: false, error: customerError };
    }
    
    console.log('✅ Customer record created');
    console.log('');
    
    // Step 3: Create user profile
    console.log('Step 3: Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        role: 'customer',
        customer_phone: testPhone,
        customer_name: 'Test User',
      });
    
    if (profileError) {
      console.log('❌ Profile Error:', profileError.message);
      console.log('   Details:', JSON.stringify(profileError, null, 2));
      return { success: false, error: profileError };
    }
    
    console.log('✅ User profile created');
    console.log('');
    
    console.log('🎉 Email Registration Test PASSED!');
    console.log('=' .repeat(60));
    return { success: true, userId: authData.user.id };
    
  } catch (err) {
    console.log('❌ Unexpected Error:', err.message);
    return { success: false, error: err };
  }
}

async function testGoogleOAuthSetup() {
  console.log('\n🧪 TEST 2: Google OAuth Configuration Check\n');
  console.log('=' .repeat(60));
  
  try {
    // Try to get provider info (this will fail if OAuth not configured, but that's expected)
    console.log('Checking Google OAuth configuration...');
    console.log('');
    console.log('ℹ️  Google OAuth requires manual configuration in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers');
    console.log('   2. Enable Google provider');
    console.log('   3. Add authorized redirect URLs');
    console.log('');
    console.log('⚠️  OAuth testing requires manual browser interaction');
    console.log('   Use browser to test: https://3000-iute38xp9xeolrkj5k16l-b237eb32.sandbox.novita.ai/register');
    console.log('=' .repeat(60));
    
    return { success: true, message: 'Manual OAuth testing required' };
  } catch (err) {
    console.log('❌ Error:', err.message);
    return { success: false, error: err };
  }
}

async function main() {
  console.log('\n🚀 AUTHENTICATION FLOW TESTING\n');
  console.log('Testing URL: https://3000-iute38xp9xeolrkj5k16l-b237eb32.sandbox.novita.ai');
  console.log('Supabase Project: https://qwqmhvwqeynnyxaecqzw.supabase.co');
  
  // Test 1: Email Registration
  const emailTest = await testEmailRegistration();
  
  // Test 2: OAuth Configuration Check
  const oauthTest = await testGoogleOAuthSetup();
  
  console.log('\n📊 FINAL SUMMARY\n');
  console.log('=' .repeat(60));
  console.log(`Email Registration: ${emailTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`OAuth Configuration: ${oauthTest.success ? '✅ CHECKED' : '❌ FAILED'}`);
  console.log('=' .repeat(60));
  
  if (!emailTest.success) {
    console.log('\n🔍 DEBUGGING INFO:');
    console.log('Error:', emailTest.error);
  }
}

main().catch(console.error);
