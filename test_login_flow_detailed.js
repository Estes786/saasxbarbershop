const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test with anon key (simulating user login)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test with service key (for debugging)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testLoginFlow() {
  console.log('\n========================================');
  console.log('🧪 TESTING LOGIN FLOW - DETAILED');
  console.log('========================================\n');

  // Test 1: Try to get a user profile using anon client (should fail due to RLS)
  console.log('TEST 1: Try to read user profile with anon client (no auth)');
  console.log('Expected: Should fail with RLS error or empty result\n');
  
  const testUserId = '0c4a8c6f-7e3a-4d8d-9f5b-2b1e4d7a8c6f'; // Random UUID
  const { data: profile1, error: error1 } = await supabaseAnon
    .from('user_profiles')
    .select('*')
    .eq('id', testUserId)
    .single();
  
  if (error1) {
    console.log('✅ RLS is working: anon client cannot read profiles');
    console.log(`   Error code: ${error1.code}`);
    console.log(`   Error message: ${error1.message}\n`);
  } else if (!profile1) {
    console.log('✅ RLS is working: anon client got empty result\n');
  } else {
    console.log('❌ SECURITY ISSUE: Anon client can read profiles!\n');
  }

  // Test 2: Try to sign in with existing email
  console.log('TEST 2: Try to sign in with existing capster email');
  console.log('Email: hyy1211@gmail.com');
  console.log('Password: (assuming Test123!)\n');
  
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: 'hyy1211@gmail.com',
    password: 'Test123!'
  });
  
  if (signInError) {
    console.log('❌ Sign-in failed:', signInError.message);
    console.log('   Code:', signInError.status);
    console.log('   This could be wrong password or user not confirmed\n');
  } else if (signInData.user) {
    console.log('✅ Sign-in successful!');
    console.log(`   User ID: ${signInData.user.id}`);
    console.log(`   Email: ${signInData.user.email}`);
    console.log(`   Email confirmed: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);
    
    // Test 3: Now try to get user profile with authenticated session
    console.log('TEST 3: Try to read own profile with authenticated session');
    
    const { data: profile3, error: error3 } = await supabaseAnon
      .from('user_profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();
    
    if (error3) {
      console.log('❌ Cannot read own profile even after login!');
      console.log(`   Error code: ${error3.code}`);
      console.log(`   Error message: ${error3.message}`);
      console.log('   ⚠️ THIS IS THE "User profile not found" ERROR!\n');
    } else if (profile3) {
      console.log('✅ Successfully read own profile after login');
      console.log(`   Email: ${profile3.email}`);
      console.log(`   Role: ${profile3.role}`);
      console.log(`   Phone: ${profile3.customer_phone || 'null'}\n`);
    } else {
      console.log('⚠️ Profile query returned no data\n');
    }
    
    // Sign out
    await supabaseAnon.auth.signOut();
    console.log('✅ Signed out\n');
  }

  // Test 4: Check profile with service role (should always work)
  console.log('TEST 4: Read profile with service role key');
  
  const { data: profile4, error: error4 } = await supabaseService
    .from('user_profiles')
    .select('*')
    .eq('email', 'hyy1211@gmail.com')
    .single();
  
  if (error4) {
    console.log('❌ Even service role cannot read profile!');
    console.log(`   Error: ${error4.message}\n`);
  } else if (profile4) {
    console.log('✅ Service role can read profile (correct)');
    console.log(`   ID: ${profile4.id}`);
    console.log(`   Email: ${profile4.email}`);
    console.log(`   Role: ${profile4.role}`);
    console.log(`   Phone: ${profile4.customer_phone || 'null'}`);
    console.log(`   Capster ID: ${profile4.capster_id || 'null'}\n`);
  }

  // Test 5: Check if RLS policies exist
  console.log('TEST 5: Summary and Recommendations');
  console.log('=====================================\n');
  
  if (error3 && error3.code === 'PGRST116') {
    console.log('🔴 PROBLEM IDENTIFIED: RLS Policy Blocking User Access');
    console.log('');
    console.log('   Diagnosis: User can sign in successfully, but RLS policies');
    console.log('   prevent them from reading their own profile.');
    console.log('');
    console.log('   Root Cause: RLS policies likely have subqueries or complex');
    console.log('   logic that causes infinite recursion or blocks legitimate access.');
    console.log('');
    console.log('   Solution: Apply the ULTIMATE_COMPREHENSIVE_FIX.sql script');
    console.log('   which simplifies RLS policies to use ONLY auth.uid() = id');
    console.log('   without any subqueries.\n');
  }

  console.log('========================================');
  console.log('✅ TEST COMPLETE');
  console.log('========================================\n');
}

testLoginFlow().catch(console.error);
