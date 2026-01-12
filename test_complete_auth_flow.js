const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthenticationFlow() {
  console.log('🧪 TESTING AUTHENTICATION FLOW\n');
  console.log('=' .repeat(70));
  
  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User Authentication';
  const testPhone = '081234567890';
  
  console.log('\n📋 TEST DATA:');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log(`Name: ${testName}`);
  console.log(`Phone: ${testPhone}`);
  
  // TEST 1: Check database tables
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 1: CHECK DATABASE TABLES');
  console.log('='.repeat(70));
  
  const tables = ['user_profiles', 'barbershop_transactions', 'barbershop_customers', 'bookings'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table '${table}' does NOT exist`);
        } else {
          console.log(`⚠️  Error checking '${table}': ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ Error with '${table}': ${err.message}`);
    }
  }
  
  // TEST 2: Check RLS status
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 2: CHECK RLS STATUS ON user_profiles');
  console.log('='.repeat(70));
  
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`⚠️  RLS might be blocking queries`);
    } else {
      console.log(`✅ Can query user_profiles (RLS configured correctly)`);
      console.log(`   Current rows: ${data?.length || 0}`);
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
  
  // TEST 3: Email Registration
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 3: EMAIL REGISTRATION (Customer)');
  console.log('='.repeat(70));
  
  let userId = null;
  
  try {
    console.log('🔐 Attempting to sign up with email...');
    
    const { data, error } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          phone: testPhone,
          role: 'customer'
        }
      }
    });
    
    if (error) {
      console.log(`❌ Sign up failed: ${error.message}`);
    } else {
      console.log(`✅ Sign up successful!`);
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`   Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      
      userId = data.user?.id;
      
      // Check if profile was created
      if (userId) {
        console.log('\n📝 Checking if user profile was created...');
        
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.log(`❌ Profile not found: ${profileError.message}`);
          console.log(`⚠️  This indicates RLS policies are NOT applied!`);
        } else {
          console.log(`✅ Profile created successfully!`);
          console.log(`   Name: ${profileData.full_name}`);
          console.log(`   Role: ${profileData.role}`);
          console.log(`   Phone: ${profileData.phone}`);
        }
      }
    }
  } catch (err) {
    console.log(`❌ Exception during sign up: ${err.message}`);
  }
  
  // TEST 4: Email Login
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 4: EMAIL LOGIN');
  console.log('='.repeat(70));
  
  try {
    console.log('🔐 Attempting to sign in...');
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log(`❌ Login failed: ${error.message}`);
    } else {
      console.log(`✅ Login successful!`);
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`   Session: ${data.session ? 'Valid' : 'Invalid'}`);
      
      // Try to access own profile
      console.log('\n📝 Trying to access own profile...');
      
      const { data: profileData, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log(`❌ Cannot access profile: ${profileError.message}`);
        console.log(`⚠️  RLS policy "Users can view their own profile" NOT working!`);
      } else {
        console.log(`✅ Can access own profile!`);
        console.log(`   Name: ${profileData.full_name}`);
        console.log(`   Role: ${profileData.role}`);
      }
      
      // Sign out
      await supabaseClient.auth.signOut();
    }
  } catch (err) {
    console.log(`❌ Exception during login: ${err.message}`);
  }
  
  // TEST 5: Admin Registration Test
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 5: ADMIN REGISTRATION TEST');
  console.log('='.repeat(70));
  
  const adminEmail = `admin${Date.now()}@example.com`;
  const adminSecret = 'BOZQ_BARBERSHOP_ADMIN_2025_SECRET';
  
  console.log(`Admin Email: ${adminEmail}`);
  console.log(`Admin Secret: ${adminSecret}`);
  
  try {
    // First, sign up as admin
    const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
      email: adminEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Admin Test User',
          role: 'admin'
        }
      }
    });
    
    if (signupError) {
      console.log(`❌ Admin sign up failed: ${signupError.message}`);
    } else {
      console.log(`✅ Admin sign up successful!`);
      console.log(`   User ID: ${signupData.user?.id}`);
      
      // Check admin profile
      if (signupData.user?.id) {
        const { data: adminProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.log(`❌ Admin profile not found: ${profileError.message}`);
        } else {
          console.log(`✅ Admin profile created!`);
          console.log(`   Role: ${adminProfile.role}`);
          console.log(`   Verified: ${adminProfile.is_verified ? 'Yes' : 'No'}`);
        }
      }
    }
  } catch (err) {
    console.log(`❌ Exception during admin registration: ${err.message}`);
  }
  
  // SUMMARY
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log('\n✅ Tests completed. Check results above.');
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. If profiles are NOT being created, RLS policies need to be applied');
  console.log('2. Manual SQL execution required at:');
  console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('3. Copy contents of APPLY_ALL_FIXES.sql and run it');
  console.log('\n4. For Google OAuth testing, configure in Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers');
  console.log('\n' + '='.repeat(70));
}

testAuthenticationFlow().catch(console.error);
