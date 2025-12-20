require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRlsPermissions() {
  console.log('\n🔐 TESTING RLS PERMISSIONS\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get test users
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get a customer user
  const { data: customerProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_role', 'customer')
    .eq('email', 'customer_test_1766244879070@example.com')
    .single();
  
  // Get an admin user
  const { data: adminProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_role', 'admin')
    .eq('email', 'admin_test_1766244884284@example.com')
    .single();

  if (!customerProfile || !adminProfile) {
    console.log('❌ Test users not found. Please run test_auth_complete.js first');
    return;
  }

  console.log('👥 Test Users:');
  console.log(`   Customer: ${customerProfile.email}`);
  console.log(`   Admin: ${adminProfile.email}\n`);

  // Test 1: Customer tries to access barbershop_customers
  console.log('1️⃣ TEST: Customer Access to barbershop_customers\n');
  
  const customerClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Login as customer
  const { data: customerLogin } = await customerClient.auth.signInWithPassword({
    email: 'customer_test_1766244879070@example.com',
    password: 'TestPassword123!'
  });

  if (customerLogin.user) {
    console.log(`   ✅ Logged in as: ${customerLogin.user.email}\n`);
    
    // Try to read barbershop_customers
    const { data: customersData, error: customersError } = await customerClient
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.log('   ✅ CORRECT: Customer CANNOT access barbershop_customers');
      console.log(`   📝 Error: ${customersError.message}\n`);
    } else {
      console.log('   ❌ PROBLEM: Customer CAN access barbershop_customers');
      console.log(`   📊 Records returned: ${customersData?.length || 0}\n`);
      console.log('   ⚠️ RLS policy is NOT working correctly!\n');
    }
    
    await customerClient.auth.signOut();
  }

  // Test 2: Admin tries to access barbershop_customers
  console.log('2️⃣ TEST: Admin Access to barbershop_customers\n');
  
  const adminClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Login as admin
  const { data: adminLogin } = await adminClient.auth.signInWithPassword({
    email: 'admin_test_1766244884284@example.com',
    password: 'AdminPassword123!'
  });

  if (adminLogin.user) {
    console.log(`   ✅ Logged in as: ${adminLogin.user.email}\n`);
    
    // Try to read barbershop_customers
    const { data: customersData, error: customersError } = await adminClient
      .from('barbershop_customers')
      .select('*')
      .limit(3);
    
    if (customersError) {
      console.log('   ❌ PROBLEM: Admin CANNOT access barbershop_customers');
      console.log(`   📝 Error: ${customersError.message}\n`);
      console.log('   ⚠️ RLS policy is TOO restrictive!\n');
    } else {
      console.log('   ✅ CORRECT: Admin CAN access barbershop_customers');
      console.log(`   📊 Records returned: ${customersData?.length || 0}\n`);
    }
    
    // Try to insert (admin should be able to)
    const testCustomer = {
      customer_phone: `081234567${Date.now().toString().slice(-3)}`,
      customer_name: 'Test RLS Customer',
      customer_area: 'Test Area',
      total_visits: 0,
      total_revenue: 0
    };
    
    const { data: insertData, error: insertError } = await adminClient
      .from('barbershop_customers')
      .insert(testCustomer)
      .select()
      .single();
    
    if (insertError) {
      console.log('   ❌ Admin CANNOT insert into barbershop_customers');
      console.log(`   📝 Error: ${insertError.message}\n`);
    } else {
      console.log('   ✅ Admin CAN insert into barbershop_customers');
      console.log(`   📝 New record: ${insertData.customer_name}\n`);
    }
    
    await adminClient.auth.signOut();
  }

  // Test 3: Test user_profiles access
  console.log('3️⃣ TEST: User Profile Access\n');
  
  // Login as customer again
  const customerClient2 = createClient(supabaseUrl, supabaseAnonKey);
  await customerClient2.auth.signInWithPassword({
    email: 'customer_test_1766244879070@example.com',
    password: 'TestPassword123!'
  });

  // Can customer read their own profile?
  const { data: ownProfile, error: ownProfileError } = await customerClient2
    .from('user_profiles')
    .select('*')
    .eq('id', customerProfile.id)
    .single();

  if (ownProfileError) {
    console.log('   ❌ Customer CANNOT read own profile');
    console.log(`   📝 Error: ${ownProfileError.message}\n`);
  } else {
    console.log('   ✅ Customer CAN read own profile');
    console.log(`   📝 Email: ${ownProfile.email}, Role: ${ownProfile.user_role}\n`);
  }

  // Can customer read other profiles?
  const { data: otherProfiles, error: otherProfilesError } = await customerClient2
    .from('user_profiles')
    .select('*')
    .neq('id', customerProfile.id)
    .limit(1);

  if (otherProfilesError || (otherProfiles && otherProfiles.length === 0)) {
    console.log('   ✅ Customer CANNOT read other profiles (correct)\n');
  } else {
    console.log('   ⚠️ Customer CAN read other profiles');
    console.log(`   📊 Records: ${otherProfiles?.length || 0}\n`);
  }

  await customerClient2.auth.signOut();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ RLS PERMISSIONS TESTING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 SUMMARY:');
  console.log('   - Customer should NOT access barbershop_customers');
  console.log('   - Admin should access barbershop_customers');
  console.log('   - Users should access only their own profile');
  console.log('   - Check results above for any ❌ issues\n');
}

testRlsPermissions().catch(console.error);
