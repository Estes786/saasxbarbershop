const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testAuth() {
  console.log('🧪 AUTHENTICATION FLOW TEST');
  console.log('=' .repeat(70));
  console.log('📱 App URL: https://3000-ik9h8148qaxv2ewwceprc-2b54fc91.sandbox.novita.ai');
  console.log('=' .repeat(70));
  console.log('\n');

  // Test 1: Check user_profiles table access
  console.log('TEST 1: Check user_profiles table');
  console.log('-'.repeat(70));
  
  const { data: profiles, error: profilesError } = await supabaseService
    .from('user_profiles')
    .select('*');
  
  if (profilesError) {
    console.log('❌ Error accessing user_profiles:', profilesError.message);
    console.log('   Code:', profilesError.code);
  } else {
    console.log('✅ user_profiles table accessible');
    console.log('   Total profiles:', profiles.length);
    if (profiles.length > 0) {
      console.log('   Sample:', profiles[0]);
    }
  }
  console.log('\n');

  // Test 2: Check Google OAuth configuration
  console.log('TEST 2: Check Google OAuth Configuration');
  console.log('-'.repeat(70));
  console.log('⚠️  Google OAuth requires configuration in Supabase Dashboard:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers');
  console.log('   2. Enable Google provider');
  console.log('   3. Add redirect URLs:');
  console.log('      - https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback');
  console.log('      - https://3000-ik9h8148qaxv2ewwceprc-2b54fc91.sandbox.novita.ai/auth/callback');
  console.log('\n');

  // Test 3: Simulate email signup (we can't actually test without email confirmation)
  console.log('TEST 3: Email Signup Flow');
  console.log('-'.repeat(70));
  console.log('📝 To test email signup:');
  console.log('   1. Visit: https://3000-ik9h8148qaxv2ewwceprc-2b54fc91.sandbox.novita.ai/register');
  console.log('   2. Fill in form:');
  console.log('      - Email: test@example.com');
  console.log('      - Name: Test User');
  console.log('      - Phone: 08123456789');
  console.log('      - Password: testpass123');
  console.log('   3. Submit form');
  console.log('   4. Check for success message or errors in browser console');
  console.log('\n');

  // Test 4: Check RLS policies
  console.log('TEST 4: Check RLS Policies Status');
  console.log('-'.repeat(70));
  
  try {
    // Try to access with anon key (should fail if RLS is enabled and no session)
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (anonError) {
      if (anonError.code === '42501') {
        console.log('✅ RLS is properly enabled (anon access blocked)');
        console.log('   This is correct - users can only access their own profiles');
      } else {
        console.log('⚠️  Unexpected error:', anonError.message);
      }
    } else {
      console.log('⚠️  RLS might not be enabled - anon key can read profiles');
      console.log('   Consider applying RLS policies from APPLY_RLS_POLICIES.sql');
    }
  } catch (err) {
    console.log('❌ Error testing RLS:', err.message);
  }
  console.log('\n');

  // Test 5: Manual test checklist
  console.log('TEST 5: Manual Testing Checklist');
  console.log('-'.repeat(70));
  console.log('✅ REQUIRED MANUAL TESTS:');
  console.log('');
  console.log('📧 EMAIL REGISTRATION:');
  console.log('   1. Open: https://3000-ik9h8148qaxv2ewwceprc-2b54fc91.sandbox.novita.ai/register');
  console.log('   2. Fill customer registration form');
  console.log('   3. Check browser console for errors');
  console.log('   4. If successful, check email for confirmation');
  console.log('');
  console.log('🔐 GOOGLE OAUTH:');
  console.log('   1. Configure Google OAuth in Supabase Dashboard first!');
  console.log('   2. Open: https://3000-ik9h8148qaxv2ewwceprc-2b54fc91.sandbox.novita.ai/register');
  console.log('   3. Click "Continue with Google" button');
  console.log('   4. Should redirect to Google login');
  console.log('   5. After login, should redirect to /dashboard/customer');
  console.log('');
  console.log('🐛 DEBUGGING:');
  console.log('   - Open browser DevTools (F12)');
  console.log('   - Check Console tab for errors');
  console.log('   - Check Network tab for failed API calls');
  console.log('   - PM2 logs: pm2 logs saasxbarbershop --nostream');
  console.log('\n');

  console.log('=' .repeat(70));
  console.log('✅ AUTOMATED TESTS COMPLETE');
  console.log('📋 Next step: Run manual tests in browser');
  console.log('=' .repeat(70));
}

testAuth().catch(console.error);
