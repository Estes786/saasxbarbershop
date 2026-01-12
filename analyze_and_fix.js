#!/usr/bin/env node

/**
 * Analyze current Supabase database state and create idempotent SQL fix
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('🔍 Analyzing Supabase Database...\n');
  console.log('📊 Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Check user_profiles table
    console.log('📋 Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log('   ❌ Error querying user_profiles:', profilesError.message);
    } else {
      console.log(`   ✅ user_profiles table exists with ${profiles.length} sample rows`);
      if (profiles.length > 0) {
        console.log('   📝 Sample columns:', Object.keys(profiles[0]));
      }
    }

    // Check barbershop_customers table
    console.log('\n📋 Checking barbershop_customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(5);

    if (customersError) {
      console.log('   ❌ Error:', customersError.message);
    } else {
      console.log(`   ✅ barbershop_customers table exists with ${customers.length} sample rows`);
    }

    // Check capsters table
    console.log('\n📋 Checking capsters table...');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*')
      .limit(5);

    if (capstersError) {
      console.log('   ❌ Error:', capstersError.message);
    } else {
      console.log(`   ✅ capsters table exists with ${capsters.length} sample rows`);
    }

    // Check service_catalog table
    console.log('\n📋 Checking service_catalog table...');
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.log('   ❌ Error:', servicesError.message);
    } else {
      console.log(`   ✅ service_catalog table exists with ${services.length} sample rows`);
    }

    // Check bookings table
    console.log('\n📋 Checking bookings table...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(5);

    if (bookingsError) {
      console.log('   ❌ Error:', bookingsError.message);
    } else {
      console.log(`   ✅ bookings table exists with ${bookings.length} sample rows`);
    }

    // Check barbershop_transactions table
    console.log('\n📋 Checking barbershop_transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('barbershop_transactions')
      .select('*')
      .limit(5);

    if (transactionsError) {
      console.log('   ❌ Error:', transactionsError.message);
    } else {
      console.log(`   ✅ barbershop_transactions table exists with ${transactions.length} sample rows`);
    }

    // Try to create a test user
    console.log('\n🧪 Testing user creation flow...');
    const testEmail = `test-${Date.now()}@test.com`;
    console.log(`   📧 Test email: ${testEmail}`);

    // Test auth signup
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        role: 'customer',
        test: true
      }
    });

    if (authError) {
      console.log('   ❌ Auth creation failed:', authError.message);
    } else {
      console.log('   ✅ Auth user created:', authData.user.id);

      // Try to create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: testEmail,
          role: 'customer',
          customer_phone: '08123456789',
          customer_name: 'Test User'
        });

      if (profileError) {
        console.log('   ❌ Profile creation failed:', profileError.message);
        console.log('   📝 Error details:', profileError);
      } else {
        console.log('   ✅ Profile created successfully');
      }

      // Cleanup test user
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('   🧹 Test user cleaned up');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }

  console.log('\n✅ Analysis complete!\n');
}

// Run analysis
analyzeDatabase().catch(console.error);
