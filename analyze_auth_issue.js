const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceKey);

async function analyzeAuthSettings() {
  console.log('🔍 ANALYZING AUTHENTICATION ISSUES\n');
  console.log('=' .repeat(70));
  
  console.log('\n📊 ISSUE ANALYSIS:');
  console.log('   Error: "Email address is invalid"');
  console.log('   Possible causes:');
  console.log('   1. Email confirmation is REQUIRED in Supabase Auth settings');
  console.log('   2. Email provider not configured (SMTP settings)');
  console.log('   3. Email validation pattern mismatch');
  console.log('');
  
  console.log('🔧 CHECKING CURRENT AUTH USERS...\n');
  
  // Check existing auth users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.log('❌ Error listing users:', error.message);
  } else {
    console.log(`Found ${users.length} existing users:`);
    users.slice(0, 5).forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'})`);
    });
    console.log('');
  }
  
  console.log('🛠️  SOLUTION OPTIONS:\n');
  console.log('Option 1: DISABLE Email Confirmation (Recommended for testing)');
  console.log('   ➤ Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/users');
  console.log('   ➤ Click "Configuration" tab');
  console.log('   ➤ Toggle OFF "Enable email confirmations"');
  console.log('   ➤ This allows immediate registration without email verification');
  console.log('');
  
  console.log('Option 2: Apply RLS Policies');
  console.log('   ➤ RLS policies may be blocking profile creation');
  console.log('   ➤ Need to execute: APPLY_RLS_POLICIES.sql in Supabase SQL Editor');
  console.log('   ➤ URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('');
  
  console.log('Option 3: Configure SMTP (For production)');
  console.log('   ➤ Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/templates');
  console.log('   ➤ Configure SMTP settings');
  console.log('   ➤ Users will receive confirmation emails');
  console.log('');
  
  console.log('=' .repeat(70));
  
  // Check RLS status on user_profiles
  console.log('\n🔒 CHECKING RLS POLICIES ON user_profiles...\n');
  
  const { data: policies, error: policyError } = await supabase
    .rpc('exec', { 
      query: `
        SELECT 
          schemaname, 
          tablename, 
          policyname, 
          permissive, 
          roles, 
          cmd 
        FROM pg_policies 
        WHERE tablename = 'user_profiles';
      `
    });
  
  if (policyError) {
    console.log('⚠️  Cannot check policies directly via RPC (expected)');
    console.log('   You need to check policies manually in Supabase SQL Editor');
  } else if (policies && policies.length > 0) {
    console.log(`Found ${policies.length} RLS policies on user_profiles:`);
    policies.forEach((policy, i) => {
      console.log(`  ${i + 1}. ${policy.policyname} (${policy.cmd}) for ${policy.roles}`);
    });
  } else {
    console.log('⚠️  No RLS policies found on user_profiles');
    console.log('   This means RLS may be blocking all inserts!');
  }
  
  console.log('');
  console.log('=' .repeat(70));
  console.log('\n✅ IMMEDIATE ACTION REQUIRED:\n');
  console.log('1. Disable Email Confirmation in Supabase Dashboard (quickest fix)');
  console.log('2. Apply RLS Policies using APPLY_RLS_POLICIES.sql');
  console.log('3. Test registration again in browser');
  console.log('');
  console.log('🌐 Test URL: https://3000-iute38xp9xeolrkj5k16l-b237eb32.sandbox.novita.ai/register');
  console.log('=' .repeat(70));
}

analyzeAuthSettings().catch(console.error);
