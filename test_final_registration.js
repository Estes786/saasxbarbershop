const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullAuthFlow() {
  console.log('\n🧪 TESTING COMPLETE AUTHENTICATION FLOW\n');
  console.log('='.repeat(60));
  
  // Test 1: Customer Registration
  console.log('\n📋 TEST 1: CUSTOMER REGISTRATION');
  console.log('-'.repeat(60));
  
  const customerEmail = `customer${Date.now()}@example.com`;
  const customerPassword = 'Customer123!';
  const customerName = 'Jane Customer';
  
  console.log('📧 Email:', customerEmail);
  console.log('👤 Name:', customerName);
  console.log('🎭 Role: customer');
  
  const { data: custAuth, error: custAuthError } = await supabase.auth.signUp({
    email: customerEmail,
    password: customerPassword,
    options: {
      data: {
        full_name: customerName,
        user_role: 'customer'
      }
    }
  });
  
  if (custAuthError) {
    console.error('❌ Customer registration failed:', custAuthError.message);
  } else {
    console.log('✅ Customer registered successfully');
    console.log('   User ID:', custAuth.user.id);
    
    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check profile
    const { data: custProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', custAuth.user.id)
      .single();
    
    if (custProfile) {
      console.log('✅ Profile created automatically');
      console.log('   full_name:', custProfile.full_name);
      console.log('   user_role:', custProfile.user_role);
    } else {
      console.log('⚠️  Profile not found');
    }
    
    // Logout
    await supabase.auth.signOut();
  }
  
  // Test 2: Admin Registration
  console.log('\n📋 TEST 2: ADMIN REGISTRATION');
  console.log('-'.repeat(60));
  
  const adminEmail = `admin${Date.now()}@example.com`;
  const adminPassword = 'Admin123!';
  const adminName = 'John Admin';
  
  console.log('📧 Email:', adminEmail);
  console.log('👤 Name:', adminName);
  console.log('🎭 Role: admin');
  
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        full_name: adminName,
        user_role: 'admin'
      }
    }
  });
  
  if (adminAuthError) {
    console.error('❌ Admin registration failed:', adminAuthError.message);
  } else {
    console.log('✅ Admin registered successfully');
    console.log('   User ID:', adminAuth.user.id);
    
    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check profile
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', adminAuth.user.id)
      .single();
    
    if (adminProfile) {
      console.log('✅ Profile created automatically');
      console.log('   full_name:', adminProfile.full_name);
      console.log('   user_role:', adminProfile.user_role);
    } else {
      console.log('⚠️  Profile not found');
    }
    
    // Logout
    await supabase.auth.signOut();
  }
  
  // Test 3: Customer Login
  console.log('\n📋 TEST 3: CUSTOMER LOGIN');
  console.log('-'.repeat(60));
  
  console.log('📧 Email:', customerEmail);
  
  const { data: custLogin, error: custLoginError } = await supabase.auth.signInWithPassword({
    email: customerEmail,
    password: customerPassword
  });
  
  if (custLoginError) {
    console.error('❌ Customer login failed:', custLoginError.message);
  } else {
    console.log('✅ Customer login successful');
    console.log('   Session:', custLogin.session ? 'Active' : 'None');
    console.log('   Access Token:', custLogin.session?.access_token ? 'Present' : 'Missing');
    
    // Logout
    await supabase.auth.signOut();
  }
  
  // Test 4: Admin Login
  console.log('\n📋 TEST 4: ADMIN LOGIN');
  console.log('-'.repeat(60));
  
  console.log('📧 Email:', adminEmail);
  
  const { data: adminLogin, error: adminLoginError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });
  
  if (adminLoginError) {
    console.error('❌ Admin login failed:', adminLoginError.message);
  } else {
    console.log('✅ Admin login successful');
    console.log('   Session:', adminLogin.session ? 'Active' : 'None');
    console.log('   Access Token:', adminLogin.session?.access_token ? 'Present' : 'Missing');
    
    // Logout
    await supabase.auth.signOut();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL AUTHENTICATION TESTS COMPLETED');
  console.log('='.repeat(60) + '\n');
}

testFullAuthFlow().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
