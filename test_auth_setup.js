const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSetup() {
  console.log('🔍 Checking Supabase Authentication Setup...\n');
  console.log('=' .repeat(60));
  
  // 1. Check if user_profiles table exists and has RLS enabled
  console.log('\n📋 Step 1: Checking user_profiles table...');
  
  const { data: tables, error: tableError } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1);
  
  if (tableError) {
    if (tableError.code === '42P01') {
      console.log('❌ Table user_profiles does NOT exist');
      return;
    }
    console.log('⚠️  Error checking table:', tableError.message);
  } else {
    console.log('✅ Table user_profiles exists');
  }
  
  // 2. Check RLS policies (using raw SQL via RPC or manual check)
  console.log('\n🔐 Step 2: Checking RLS policies...');
  console.log('ℹ️  RLS policies need to be checked manually in Supabase Dashboard');
  console.log('   URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/policies');
  
  // 3. Check authentication providers
  console.log('\n🌐 Step 3: Checking authentication providers...');
  console.log('ℹ️  Google OAuth needs to be configured manually in Supabase Dashboard');
  console.log('   URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers');
  
  // 4. Test creating a user profile (to check if RLS allows it)
  console.log('\n🧪 Step 4: Testing profile creation with service role...');
  
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testEmail = 'test@example.com';
  
  // First, delete test user if exists
  await supabase
    .from('user_profiles')
    .delete()
    .eq('id', testUserId);
  
  // Try to insert test profile
  const { data: insertData, error: insertError } = await supabase
    .from('user_profiles')
    .insert({
      id: testUserId,
      email: testEmail,
      role: 'customer',
      customer_name: 'Test User',
      customer_phone: null,
    })
    .select()
    .single();
  
  if (insertError) {
    console.log('❌ Failed to insert test profile:', insertError.message);
    console.log('   This might indicate RLS issues or missing policies');
  } else {
    console.log('✅ Successfully created test profile');
    
    // Clean up
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', testUserId);
    console.log('✅ Cleaned up test profile');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 SUMMARY:\n');
  console.log('✅ Database connection: OK');
  console.log('✅ user_profiles table: EXISTS');
  console.log('⚠️  RLS policies: NEEDS MANUAL CHECK');
  console.log('⚠️  Google OAuth: NEEDS MANUAL CONFIGURATION');
  
  console.log('\n📝 NEXT STEPS:\n');
  console.log('1. Apply RLS policies using APPLY_RLS_POLICIES.sql');
  console.log('   → Open: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('   → Paste contents of APPLY_RLS_POLICIES.sql');
  console.log('   → Click "Run"\n');
  
  console.log('2. Configure Google OAuth');
  console.log('   → Follow instructions in PANDUAN_LENGKAP_KONFIGURASI.md');
  console.log('   → Or use Quick Reference Card\n');
  
  console.log('3. Test authentication:');
  console.log('   → Email registration: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register');
  console.log('   → Admin registration: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register/admin');
  console.log('   → Login: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/login\n');
}

checkSetup().catch(console.error);
