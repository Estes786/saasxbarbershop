const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  console.log('\n🧪 TESTING USER REGISTRATION (FIXED)\n');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  const testName = 'Test User';
  const testRole = 'customer';

  console.log('📧 Test email:', testEmail);
  console.log('👤 Test name:', testName);
  console.log('🎭 Test role:', testRole);
  console.log();

  try {
    // Step 1: Sign up
    console.log('1️⃣ Registering user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          user_role: testRole
        }
      }
    });

    if (authError) {
      console.error('❌ AUTH ERROR:', authError);
      return;
    }

    console.log('✅ User registered in auth.users');
    console.log('   User ID:', authData.user?.id);
    console.log('   Email:', authData.user?.email);

    // Step 2: Check if profile was created
    console.log('\n2️⃣ Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ PROFILE ERROR:', profileError);
      
      // Try to create manually
      console.log('\n3️⃣ Creating profile manually...');
      const { data: manualProfile, error: manualError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: testEmail,
          full_name: testName,
          user_role: testRole
        })
        .select()
        .single();

      if (manualError) {
        console.error('❌ MANUAL INSERT ERROR:', manualError);
      } else {
        console.log('✅ Profile created manually');
        console.log('   Profile:', manualProfile);
      }
    } else {
      console.log('✅ Profile found automatically');
      console.log('   Profile:', profile);
    }

    // Step 3: Try to login
    console.log('\n4️⃣ Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ LOGIN ERROR:', loginError);
    } else {
      console.log('✅ Login successful');
      console.log('   Session:', loginData.session ? 'Active' : 'None');
    }

    console.log('\n✅ REGISTRATION TEST COMPLETE\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRegistration();
