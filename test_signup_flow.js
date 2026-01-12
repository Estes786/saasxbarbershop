const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupFlow() {
  console.log('🧪 TESTING EMAIL SIGNUP FLOW (Simulated)');
  console.log('=' .repeat(70));
  
  const testEmail = `testuser${Date.now()}@gmail.com`;
  const testPassword = 'testpass123';
  const testPhone = '08123456789';
  const testName = 'Test User';
  
  console.log('\n📧 Test Credentials:');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  console.log('   Phone:', testPhone);
  console.log('   Name:', testName);
  console.log('\n');
  
  try {
    // Step 1: Sign up user
    console.log('STEP 1: Creating user account...');
    console.log('-'.repeat(70));
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.log('❌ Signup failed:', authError.message);
      console.log('   Code:', authError.code);
      return;
    }
    
    if (!authData.user) {
      console.log('❌ No user created');
      return;
    }
    
    console.log('✅ User created successfully');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    console.log('\n');
    
    // Step 2: Create customer record FIRST (due to foreign key constraint)
    console.log('STEP 2: Creating customer record...');
    console.log('-'.repeat(70));
    
    const { data: customerData, error: customerError } = await supabase
      .from('barbershop_customers')
      .insert({
        customer_phone: testPhone,
        customer_name: testName,
        total_visits: 0,
        total_revenue: 0,
        average_atv: 0,
        coupon_count: 0,
        coupon_eligible: false,
        google_review_given: false,
        churn_risk_score: 0,
        first_visit_date: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (customerError) {
      console.log('⚠️  Customer record creation failed:', customerError.message);
      console.log('   (This is non-critical if customer already exists)');
    } else {
      console.log('✅ Customer record created successfully');
    }
    console.log('\n');
    
    // Step 3: Create user profile (after customer record)
    console.log('STEP 3: Creating user profile...');
    console.log('-'.repeat(70));
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        role: 'customer',
        customer_phone: testPhone,
        customer_name: testName,
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      console.log('   Code:', profileError.code);
      console.log('   Details:', profileError.details);
      console.log('\n🔍 DIAGNOSIS:');
      
      if (profileError.code === 'PGRST301') {
        console.log('   ⚠️  This error means infinite recursion in RLS policies!');
        console.log('   ✅ SOLUTION: Apply FIX_RLS_INFINITE_RECURSION.sql');
      } else if (profileError.code === '23505') {
        console.log('   ⚠️  Profile already exists for this user');
      } else if (profileError.code === '23503') {
        console.log('   ⚠️  Foreign key constraint violation');
        console.log('   ✅ Customer record should be created first');
      }
      return;
    }
    
    console.log('✅ Profile created successfully');
    console.log('   Profile:', JSON.stringify(profileData, null, 2));
    console.log('\n');
    
    // Step 4: Verify profile can be read
    console.log('STEP 4: Verifying profile read access...');
    console.log('-'.repeat(70));
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (verifyError) {
      console.log('❌ Profile read failed:', verifyError.message);
    } else {
      console.log('✅ Profile can be read successfully');
      console.log('   Data:', JSON.stringify(verifyData, null, 2));
    }
    console.log('\n');
    
    console.log('=' .repeat(70));
    console.log('✅ SIGNUP FLOW TEST COMPLETE');
    console.log('=' .repeat(70));
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Fix RLS policies using FIX_RLS_INFINITE_RECURSION.sql');
    console.log('   2. Test in browser: https://3000-ik9h8148qaxv2ewwceprc-2b54fc91.sandbox.novita.ai/register');
    console.log('   3. Configure Google OAuth in Supabase Dashboard');
    console.log('   4. Test Google login flow');
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    console.log('   Stack:', err.stack);
  }
}

testSignupFlow().catch(console.error);
