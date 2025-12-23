const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsers() {
  console.log('\n========================================');
  console.log('🔍 CHECKING AUTH.USERS TABLE');
  console.log('========================================\n');

  try {
    // Query auth.users table using REST API
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Error querying auth.users:', error.message);
      return;
    }

    console.log(`Found ${authUsers.users.length} users in auth.users table\n`);
    
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ YES' : '❌ NO'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
      console.log('');
    });

    // Now cross-reference with user_profiles
    console.log('📋 CROSS-REFERENCING WITH USER_PROFILES...\n');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role, customer_phone');
    
    if (profilesError) {
      console.log('❌ Error reading user_profiles:', profilesError.message);
      return;
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    
    let matchedCount = 0;
    let orphanedAuthCount = 0;
    let orphanedProfileCount = 0;
    
    authUsers.users.forEach(user => {
      if (profileMap.has(user.id)) {
        matchedCount++;
      } else {
        orphanedAuthCount++;
        console.log(`❌ ORPHANED AUTH USER (no profile): ${user.email} (${user.id})`);
      }
    });
    
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    profiles.forEach(profile => {
      if (!authUserIds.has(profile.id)) {
        orphanedProfileCount++;
        console.log(`❌ ORPHANED PROFILE (no auth user): ${profile.email} (${profile.id})`);
      }
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Matched: ${matchedCount} (auth.users with corresponding user_profiles)`);
    console.log(`   ❌ Orphaned auth.users: ${orphanedAuthCount} (users without profiles)`);
    console.log(`   ❌ Orphaned profiles: ${orphanedProfileCount} (profiles without auth.users)`);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
  }

  console.log('\n========================================');
  console.log('✅ CHECK COMPLETE');
  console.log('========================================\n');
}

checkAuthUsers();
