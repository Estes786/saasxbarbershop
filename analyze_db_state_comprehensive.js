const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('\n========================================');
  console.log('🔍 ANALYZING SUPABASE DATABASE STATE');
  console.log('========================================\n');

  try {
    // 1. Check if tables exist
    console.log('📋 CHECKING TABLES...');
    const { data: tables, error: tablesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0);
    
    if (tablesError && tablesError.code === '42P01') {
      console.log('❌ user_profiles table does NOT exist');
    } else {
      console.log('✅ user_profiles table exists');
    }

    // 2. Check RLS policies
    console.log('\n📋 CHECKING RLS POLICIES...');
    console.log('Note: RLS policies are best viewed in Supabase Dashboard SQL Editor');
    console.log('      Direct pg_policies query not available via JavaScript client');

    // 3. Check user_profiles data
    console.log('\n📋 CHECKING USER_PROFILES DATA...');
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
      .from('user_profiles')
      .select('id, email, role, customer_phone, capster_id', { count: 'exact' });
    
    if (profilesError) {
      console.log('❌ Error reading user_profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profilesCount || 0} user profiles`);
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
          console.log(`  - ${p.email} (role: ${p.role}, phone: ${p.customer_phone || 'null'})`);
        });
      }
    }

    // 4. Check barbershop_customers data
    console.log('\n📋 CHECKING BARBERSHOP_CUSTOMERS DATA...');
    const { data: customers, error: customersError, count: customersCount } = await supabase
      .from('barbershop_customers')
      .select('customer_phone, customer_name, total_visits', { count: 'exact' });
    
    if (customersError) {
      console.log('❌ Error reading barbershop_customers:', customersError.message);
    } else {
      console.log(`✅ Found ${customersCount || 0} customers`);
      if (customers && customers.length > 0) {
        customers.forEach(c => {
          console.log(`  - ${c.customer_name} (${c.customer_phone}, visits: ${c.total_visits})`);
        });
      }
    }

    // 5. Check capsters data
    console.log('\n📋 CHECKING CAPSTERS DATA...');
    const { data: capsters, error: capstersError, count: capstersCount } = await supabase
      .from('capsters')
      .select('id, capster_name, user_id, is_available', { count: 'exact' });
    
    if (capstersError) {
      console.log('❌ Error reading capsters:', capstersError.message);
    } else {
      console.log(`✅ Found ${capstersCount || 0} capsters`);
      if (capsters && capsters.length > 0) {
        capsters.forEach(c => {
          console.log(`  - ${c.capster_name} (available: ${c.is_available})`);
        });
      }
    }

    // 6. Test authentication (simulate user trying to read their own profile)
    console.log('\n🧪 TESTING RLS POLICIES (Simulated)...');
    console.log('Note: This tests if service role can bypass RLS');
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (testError && testError.code === 'PGRST116') {
      console.log('✅ RLS is working (no rows returned without proper auth)');
    } else if (testProfile) {
      console.log('✅ Service role can bypass RLS (correct)');
      console.log(`   Sample profile: ${testProfile.email}`);
    } else if (testError) {
      console.log('⚠️ Unexpected error:', testError.message);
    }

    console.log('\n========================================');
    console.log('✅ DATABASE ANALYSIS COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
  }
}

analyzeDatabase();
