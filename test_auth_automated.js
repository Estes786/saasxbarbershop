const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Authentication Flows...\n');
console.log('=' .repeat(60));

// Test data
const testCustomer = {
  email: `testcustomer_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  full_name: 'Test Customer',
  phone: '081234567890'
};

const testAdmin = {
  email: `testadmin_${Date.now()}@example.com`,
  password: 'AdminPassword123!',
  full_name: 'Test Admin',
  phone: '082345678901',
  admin_secret: 'BOZQ_BARBERSHOP_ADMIN_2025_SECRET'
};

async function testCustomerRegistration() {
  console.log('\n📝 TEST 1: Customer Registration');
  console.log('-' .repeat(60));
  
  try {
    // Step 1: Sign up with Supabase Auth
    console.log('⏳ Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testCustomer.email,
      password: testCustomer.password,
      options: {
        data: {
          full_name: testCustomer.full_name,
          phone: testCustomer.phone
        }
      }
    });
    
    if (authError) {
      console.log(`   ❌ Auth Error: ${authError.message}`);
      return { success: false, error: authError.message };
    }
    
    console.log(`   ✅ Auth user created: ${authData.user.id}`);
    
    // Step 2: Check if profile was created
    console.log('⏳ Step 2: Checking profile creation...');
    
    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log(`   ❌ Profile Error: ${profileError.message}`);
      return { success: false, error: profileError.message };
    }
    
    if (profile) {
      console.log(`   ✅ Profile created automatically`);
      console.log(`      - Role: ${profile.role}`);
      console.log(`      - Name: ${profile.full_name}`);
      console.log(`      - Phone: ${profile.phone}`);
    } else {
      console.log(`   ⚠️  Profile NOT created - may need manual creation`);
    }
    
    // Step 3: Sign out
    await supabase.auth.signOut();
    console.log('   ✅ Signed out successfully');
    
    return { success: true, user: authData.user, profile };
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testCustomerLogin() {
  console.log('\n🔐 TEST 2: Customer Login');
  console.log('-' .repeat(60));
  
  try {
    console.log('⏳ Attempting login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testCustomer.email,
      password: testCustomer.password
    });
    
    if (error) {
      console.log(`   ❌ Login Error: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`   ✅ Login successful: ${data.user.email}`);
    
    // Check profile access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.log(`   ❌ Profile Access Error: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile accessible - Role: ${profile.role}`);
    }
    
    await supabase.auth.signOut();
    
    return { success: true, user: data.user, profile };
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAdminRegistration() {
  console.log('\n👑 TEST 3: Admin Registration (requires API call)');
  console.log('-' .repeat(60));
  console.log('   ⚠️  Admin registration requires verification endpoint');
  console.log('   This test requires the /api/auth/verify-admin-key endpoint');
  console.log('   Skipping automated test - needs manual browser testing');
  return { success: true, skipped: true };
}

async function testGoogleOAuth() {
  console.log('\n🔑 TEST 4: Google OAuth');
  console.log('-' .repeat(60));
  console.log('   ⚠️  Google OAuth requires browser interaction');
  console.log('   Configuration needed:');
  console.log('   1. Enable Google provider in Supabase Dashboard');
  console.log('   2. Configure OAuth credentials');
  console.log('   3. Test in browser manually');
  console.log('   Skipping automated test - needs manual browser testing');
  return { success: true, skipped: true };
}

async function runAllTests() {
  const results = {
    customerRegistration: null,
    customerLogin: null,
    adminRegistration: null,
    googleOAuth: null
  };
  
  results.customerRegistration = await testCustomerRegistration();
  
  if (results.customerRegistration.success) {
    results.customerLogin = await testCustomerLogin();
  }
  
  results.adminRegistration = await testAdminRegistration();
  results.googleOAuth = await testGoogleOAuth();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60) + '\n');
  
  const tests = [
    { name: 'Customer Registration', result: results.customerRegistration },
    { name: 'Customer Login', result: results.customerLogin },
    { name: 'Admin Registration', result: results.adminRegistration },
    { name: 'Google OAuth', result: results.googleOAuth }
  ];
  
  tests.forEach(test => {
    if (!test.result) {
      console.log(`⏭️  ${test.name}: Skipped`);
    } else if (test.result.skipped) {
      console.log(`⚠️  ${test.name}: Skipped (requires manual testing)`);
    } else if (test.result.success) {
      console.log(`✅ ${test.name}: PASSED`);
    } else {
      console.log(`❌ ${test.name}: FAILED - ${test.result.error}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  
  const passed = tests.filter(t => t.result && t.result.success).length;
  const failed = tests.filter(t => t.result && !t.result.success && !t.result.skipped).length;
  const skipped = tests.filter(t => !t.result || t.result.skipped).length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log('\n' + '=' .repeat(60) + '\n');
  
  if (failed > 0) {
    console.log('⚠️  Some tests failed. Check error messages above.');
    console.log('   Common issues:');
    console.log('   1. RLS policies need manual apply in SQL Editor');
    console.log('   2. Profile creation trigger not working');
    console.log('   3. Email confirmation required\n');
  }
  
  return results;
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
