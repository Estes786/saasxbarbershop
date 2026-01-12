const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCurrentIssue() {
  console.log('🔍 Analyzing Current Database State...\n');

  // 1. Check user_profiles table structure
  console.log('📋 1. Checking user_profiles table structure...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(5);
  
  if (profilesError) {
    console.error('❌ Error querying user_profiles:', profilesError.message);
  } else {
    console.log(`✅ Found ${profiles?.length || 0} profiles in user_profiles table`);
    if (profiles && profiles.length > 0) {
      console.log('Sample profile structure:', Object.keys(profiles[0]));
      console.log('Sample profiles:', profiles.map(p => ({
        id: p.id.substring(0, 8) + '...',
        email: p.email,
        role: p.role,
        customer_name: p.customer_name,
        customer_phone: p.customer_phone,
        capster_id: p.capster_id
      })));
    }
  }
  console.log('');

  // 2. Check auth.users vs user_profiles sync
  console.log('👥 2. Checking auth.users count...');
  const { count: authCount, error: authCountError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  if (authCountError) {
    console.error('❌ Error counting user_profiles:', authCountError.message);
  } else {
    console.log(`✅ Total users in user_profiles: ${authCount}`);
  }
  console.log('');

  // 3. Check barbershop_customers table
  console.log('👤 3. Checking barbershop_customers table...');
  const { data: customers, error: customersError } = await supabase
    .from('barbershop_customers')
    .select('*')
    .limit(5);
  
  if (customersError) {
    console.error('❌ Error querying barbershop_customers:', customersError.message);
  } else {
    console.log(`✅ Found ${customers?.length || 0} customers in barbershop_customers table`);
    if (customers && customers.length > 0) {
      console.log('Sample customers:', customers.map(c => ({
        customer_phone: c.customer_phone,
        customer_name: c.customer_name,
        total_visits: c.total_visits
      })));
    }
  }
  console.log('');

  // 4. Check capsters table
  console.log('✂️ 4. Checking capsters table...');
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('*')
    .limit(5);
  
  if (capstersError) {
    console.error('❌ Error querying capsters:', capstersError.message);
  } else {
    console.log(`✅ Found ${capsters?.length || 0} capsters in capsters table`);
    if (capsters && capsters.length > 0) {
      console.log('Sample capsters:', capsters.map(c => ({
        id: c.id.substring(0, 8) + '...',
        user_id: c.user_id ? c.user_id.substring(0, 8) + '...' : null,
        capster_name: c.capster_name,
        is_available: c.is_available
      })));
    }
  }
  console.log('');

  // 5. Check RLS policies
  console.log('🔒 5. Checking RLS policies on user_profiles...');
  const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', {
    table_name: 'user_profiles'
  }).catch(e => {
    console.log('ℹ️ Cannot query RLS policies directly (expected)');
    return { data: null, error: null };
  });
  
  // 6. Test profile query with specific user_id
  console.log('🧪 6. Testing profile query simulation...');
  const testUserId = profiles && profiles.length > 0 ? profiles[0].id : null;
  
  if (testUserId) {
    console.log(`Testing query for user_id: ${testUserId.substring(0, 8)}...`);
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Test query successful');
      console.log('Profile data:', {
        id: testProfile.id.substring(0, 8) + '...',
        email: testProfile.email,
        role: testProfile.role,
        customer_name: testProfile.customer_name
      });
    }
  } else {
    console.log('⚠️ No profiles found to test query');
  }
  console.log('');

  // 7. Summary and recommendations
  console.log('📊 SUMMARY & RECOMMENDATIONS:\n');
  console.log('Current State:');
  console.log(`  - User profiles in database: ${authCount || 0}`);
  console.log(`  - Customers in barbershop_customers: ${customers?.length || 0}`);
  console.log(`  - Capsters in capsters table: ${capsters?.length || 0}`);
  console.log('');
  
  if (profiles && profiles.length > 0) {
    const roleDistribution = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    console.log('Role Distribution (sample):', roleDistribution);
  }
  
  console.log('\n✨ Analysis complete!');
}

analyzeCurrentIssue().catch(console.error);
