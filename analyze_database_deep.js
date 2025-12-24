#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabaseDeep() {
  console.log('\n🔍 DEEP ANALYSIS OF SUPABASE DATABASE\n');
  console.log('=' .repeat(80));
  
  try {
    // 1. Check auth.users table
    console.log('\n1️⃣  CHECKING AUTH.USERS:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers?.users?.length || 0} auth users`);
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log('\n   Sample users:');
        authUsers.users.slice(0, 5).forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
          console.log(`     Metadata: ${JSON.stringify(user.user_metadata)}`);
        });
      }
    }

    // 2. Check user_profiles data
    console.log('\n2️⃣  CHECKING user_profiles TABLE:');
    const { data: profiles, error: profilesDataError } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_approved, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (profilesDataError) {
      console.log('❌ Error fetching profiles:', profilesDataError.message);
      console.log('   This could mean:');
      console.log('   - Table does not exist');
      console.log('   - RLS policies are blocking access');
      console.log('   - Column names are different');
    } else {
      console.log(`✅ Found ${profiles?.length || 0} user profiles`);
      if (profiles && profiles.length > 0) {
        console.log('\n   Profiles:');
        profiles.forEach(profile => {
          console.log(`   - ${profile.email} | Role: ${profile.role} | Approved: ${profile.is_approved} | ID: ${profile.id.substring(0, 8)}...`);
        });
      } else {
        console.log('   ⚠️  No profiles found in table!');
      }
    }

    // 3. Check for orphaned auth users (users without profiles)
    console.log('\n3️⃣  CHECKING FOR ORPHANED AUTH USERS:');
    if (authUsers?.users) {
      const authUserEmails = authUsers.users.map(u => u.email);
      const profileEmails = profiles?.map(p => p.email) || [];
      
      const orphanedEmails = authUserEmails.filter(email => !profileEmails.includes(email));
      
      if (orphanedEmails.length > 0) {
        console.log(`⚠️  Found ${orphanedEmails.length} auth users WITHOUT profiles!`);
        console.log('   🚨 ROOT CAUSE: This is likely causing "User profile not found" error');
        console.log('\n   Orphaned users:');
        orphanedEmails.slice(0, 5).forEach(email => {
          const user = authUsers.users.find(u => u.email === email);
          console.log(`   - ${email} (ID: ${user?.id.substring(0, 8)}...)`);
          console.log(`     Metadata: ${JSON.stringify(user?.user_metadata)}`);
        });
      } else {
        console.log('✅ All auth users have profiles');
      }
    }

    // 4. Check barbershop_customers table
    console.log('\n4️⃣  CHECKING barbershop_customers TABLE:');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('id, phone, barbershop_customer_id, created_at')
      .limit(10);
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError.message);
    } else {
      console.log(`✅ Found ${customers?.length || 0} barbershop customers`);
    }

    // 5. Check barbershops table
    console.log('\n5️⃣  CHECKING barbershops TABLE:');
    const { data: barbershops, error: barbershopsError } = await supabase
      .from('barbershops')
      .select('id, name, created_at')
      .limit(10);
    
    if (barbershopsError) {
      console.log('❌ Error fetching barbershops:', barbershopsError.message);
    } else {
      console.log(`✅ Found ${barbershops?.length || 0} barbershops`);
      if (barbershops && barbershops.length > 0) {
        console.log('\n   Barbershops:');
        barbershops.forEach(shop => {
          console.log(`   - ${shop.name} (ID: ${shop.id})`);
        });
      }
    }

    // 6. Test authentication and profile creation
    console.log('\n6️⃣  TESTING AUTHENTICATION FLOW:');
    console.log('   Creating test user to verify trigger...');
    
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'customer',
          name: 'Test User'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message);
    } else {
      console.log('✅ Test user created:', signUpData.user?.email);
      console.log('   User ID:', signUpData.user?.id);
      
      // Wait for trigger to fire
      console.log('   Waiting 3 seconds for trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if profile was created
      const { data: testProfile, error: testProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user?.id)
        .single();
      
      if (testProfileError) {
        console.log('❌ Profile NOT created by trigger!');
        console.log('   Error:', testProfileError.message);
        console.log('   🚨 ROOT CAUSE CONFIRMED: Trigger is not working!');
        console.log('\n   Possible issues:');
        console.log('   1. Trigger does not exist');
        console.log('   2. Trigger function has errors');
        console.log('   3. RLS policies blocking insert');
      } else if (testProfile) {
        console.log('✅ Profile created successfully by trigger');
        console.log('   Role:', testProfile.role);
        console.log('   Approved:', testProfile.is_approved);
      }
      
      // Cleanup test user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user?.id);
      if (!deleteError) {
        console.log('✅ Test user cleaned up');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('\n✅ WHAT WE KNOW:');
    console.log(`   - Auth users: ${authUsers?.users?.length || 0}`);
    console.log(`   - User profiles: ${profiles?.length || 0}`);
    console.log(`   - Barbershops: ${barbershops?.length || 0}`);
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    if (authUsers?.users && profiles) {
      const orphanedCount = authUsers.users.length - profiles.length;
      if (orphanedCount > 0) {
        console.log('   🚨 PRIMARY ISSUE: Auth users without profiles');
        console.log(`      ${orphanedCount} users cannot login because their profile is missing`);
        console.log('\n   💡 SOLUTION NEEDED:');
        console.log('      1. Fix or recreate trigger function');
        console.log('      2. Create profiles for existing orphaned users');
        console.log('      3. Ensure RLS policies allow profile creation');
      } else {
        console.log('   ✅ All auth users have profiles');
      }
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Create comprehensive idempotent SQL fix');
    console.log('   2. Fix trigger function');
    console.log('   3. Create missing profiles for orphaned users');
    console.log('   4. Update RLS policies');
    console.log('   5. Test all 3 roles (Customer, Capster, Admin)');
    console.log('   6. Verify login works for all users\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
  }
}

analyzeDatabaseDeep();
