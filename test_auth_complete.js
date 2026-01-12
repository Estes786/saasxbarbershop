require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testAuthenticationFlow() {
  console.log('\n🧪 TESTING AUTHENTICATION FLOWS\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Customer Registration
  console.log('1️⃣ TEST: Customer Registration\n');
  
  const customerEmail = `customer_test_${Date.now()}@example.com`;
  const customerPassword = 'TestPassword123!';
  const customerName = 'Test Customer';
  
  console.log(`   📧 Email: ${customerEmail}`);
  console.log(`   🔒 Password: ${customerPassword}`);
  console.log(`   👤 Name: ${customerName}\n`);
  
  const supabaseCustomer = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: signUpData, error: signUpError } = await supabaseCustomer.auth.signUp({
      email: customerEmail,
      password: customerPassword,
      options: {
        data: {
          full_name: customerName,
          role: 'customer'
        }
      }
    });

    if (signUpError) {
      console.log('   ❌ Registration Error:', signUpError.message);
    } else {
      console.log('   ✅ Registration successful!');
      console.log(`   🆔 User ID: ${signUpData.user?.id}`);
      console.log(`   📧 Email: ${signUpData.user?.email}`);
      console.log(`   ⚠️ Email confirmation: ${signUpData.user?.email_confirmed_at ? 'Confirmed' : 'Pending'}`);
      
      // Wait a bit for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check user_profiles with service role
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', customerEmail)
        .single();
      
      if (profileError) {
        console.log('   ⚠️ Profile check error:', profileError.message);
      } else if (profile) {
        console.log('\n   ✅ User Profile Created:');
        console.log(`      - Email: ${profile.email}`);
        console.log(`      - Role: ${profile.user_role}`);
        console.log(`      - Full Name: ${profile.full_name}`);
      } else {
        console.log('   ⚠️ Profile not found yet (trigger may be delayed)');
      }
    }
  } catch (error) {
    console.log('   ❌ Fatal error:', error.message);
  }

  // Test 2: Customer Login
  console.log('\n\n2️⃣ TEST: Customer Login\n');
  console.log(`   📧 Email: ${customerEmail}`);
  console.log(`   🔒 Password: ${customerPassword}\n`);
  
  try {
    const { data: loginData, error: loginError } = await supabaseCustomer.auth.signInWithPassword({
      email: customerEmail,
      password: customerPassword
    });

    if (loginError) {
      console.log('   ❌ Login Error:', loginError.message);
      
      // If email not confirmed, let's confirm it manually
      if (loginError.message.includes('Email not confirmed')) {
        console.log('\n   ℹ️ Attempting to confirm email manually...');
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: confirmData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          loginData?.user?.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.log('   ❌ Cannot confirm email:', confirmError.message);
        } else {
          console.log('   ✅ Email confirmed! Try login again...');
        }
      }
    } else {
      console.log('   ✅ Login successful!');
      console.log(`   🆔 User ID: ${loginData.user?.id}`);
      console.log(`   📧 Email: ${loginData.user?.email}`);
      console.log(`   🎫 Access Token: ${loginData.session?.access_token.substring(0, 20)}...`);
      
      // Check if can access own profile
      const { data: ownProfile, error: profileError } = await supabaseCustomer
        .from('user_profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();
      
      if (profileError) {
        console.log('   ❌ Cannot access own profile:', profileError.message);
        console.log('   ⚠️ This indicates RLS policy issue!');
      } else {
        console.log('\n   ✅ Can Access Own Profile:');
        console.log(`      - Email: ${ownProfile.email}`);
        console.log(`      - Role: ${ownProfile.user_role}`);
      }
      
      // Try to access barbershop_customers (should fail for customer)
      const { data: customers, error: customersError } = await supabaseCustomer
        .from('barbershop_customers')
        .select('*')
        .limit(1);
      
      if (customersError) {
        console.log('\n   ✅ Correctly DENIED access to barbershop_customers');
        console.log(`      Error: ${customersError.message}`);
      } else {
        console.log('\n   ⚠️ WARNING: Customer can access barbershop_customers (should be denied!)');
      }
      
      // Logout
      await supabaseCustomer.auth.signOut();
      console.log('\n   🚪 Logged out');
    }
  } catch (error) {
    console.log('   ❌ Fatal error:', error.message);
  }

  // Test 3: Admin Registration Setup
  console.log('\n\n3️⃣ TEST: Admin Registration Setup\n');
  
  const adminEmail = `admin_test_${Date.now()}@example.com`;
  const adminPassword = 'AdminPassword123!';
  const adminName = 'Test Admin';
  
  console.log(`   📧 Email: ${adminEmail}`);
  console.log(`   🔒 Password: ${adminPassword}`);
  console.log(`   👤 Name: ${adminName}\n`);
  
  // First, add admin email to barbershop_admins table
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('   ➡️ Adding email to barbershop_admins table...');
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('barbershop_admins')
    .insert({
      admin_email: adminEmail,
      admin_name: adminName,
      admin_role: 'admin',
      is_verified: true
    })
    .select()
    .single();
  
  if (insertError) {
    console.log('   ❌ Insert Error:', insertError.message);
  } else {
    console.log('   ✅ Admin email added to whitelist');
    console.log(`      - Email: ${insertData.admin_email}`);
    console.log(`      - Name: ${insertData.admin_name}`);
    console.log(`      - Role: ${insertData.admin_role}`);
  }
  
  // Now register as admin
  console.log('\n   ➡️ Registering admin account...');
  const supabaseAdminClient = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: adminSignUpData, error: adminSignUpError } = await supabaseAdminClient.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName,
          role: 'admin'
        }
      }
    });

    if (adminSignUpError) {
      console.log('   ❌ Admin Registration Error:', adminSignUpError.message);
    } else {
      console.log('   ✅ Admin registration successful!');
      console.log(`   🆔 User ID: ${adminSignUpData.user?.id}`);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check user_profiles
      const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', adminEmail)
        .single();
      
      if (adminProfileError) {
        console.log('   ⚠️ Admin profile check error:', adminProfileError.message);
      } else if (adminProfile) {
        console.log('\n   ✅ Admin Profile Created:');
        console.log(`      - Email: ${adminProfile.email}`);
        console.log(`      - Role: ${adminProfile.user_role} ${adminProfile.user_role === 'admin' ? '✅' : '❌ Should be admin!'}`);
        console.log(`      - Full Name: ${adminProfile.full_name}`);
      }
    }
  } catch (error) {
    console.log('   ❌ Fatal error:', error.message);
  }

  // Test 4: Admin Login and Access
  console.log('\n\n4️⃣ TEST: Admin Login and Permissions\n');
  console.log(`   📧 Email: ${adminEmail}`);
  console.log(`   🔒 Password: ${adminPassword}\n`);
  
  try {
    const { data: adminLoginData, error: adminLoginError } = await supabaseAdminClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (adminLoginError) {
      console.log('   ❌ Admin Login Error:', adminLoginError.message);
    } else {
      console.log('   ✅ Admin login successful!');
      console.log(`   🆔 User ID: ${adminLoginData.user?.id}`);
      
      // Try to access barbershop_customers (should succeed for admin)
      const { data: customersForAdmin, error: customersForAdminError } = await supabaseAdminClient
        .from('barbershop_customers')
        .select('*')
        .limit(1);
      
      if (customersForAdminError) {
        console.log('\n   ❌ Admin CANNOT access barbershop_customers:');
        console.log(`      Error: ${customersForAdminError.message}`);
        console.log('      ⚠️ This is a problem - admins should have access!');
      } else {
        console.log('\n   ✅ Admin CAN access barbershop_customers');
        console.log(`      Records: ${customersForAdmin?.length || 0}`);
      }
      
      // Logout
      await supabaseAdminClient.auth.signOut();
      console.log('\n   🚪 Logged out');
    }
  } catch (error) {
    console.log('   ❌ Fatal error:', error.message);
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ AUTHENTICATION FLOW TESTING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testAuthenticationFlow().catch(console.error);
