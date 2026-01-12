const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking Database Schema...\n');
  
  try {
    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    console.log('✅ user_profiles table:');
    if (profiles && profiles.length > 0) {
      console.log('   Sample columns:', Object.keys(profiles[0]).join(', '));
      console.log('   Sample data:', profiles[0]);
    } else {
      console.log('   No data found');
    }
    if (profilesError) console.log('   Error:', profilesError);
    
    // Check barbershop_customers table
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    console.log('\n✅ barbershop_customers table:');
    if (customers && customers.length > 0) {
      console.log('   Sample columns:', Object.keys(customers[0]).join(', '));
    } else {
      console.log('   No data found');
    }
    if (customersError) console.log('   Error:', customersError);
    
    // Check RLS policies on user_profiles
    console.log('\n🔐 Checking RLS status...');
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('get_rls_status');
    if (rlsError) {
      console.log('   Note: RLS status query not available (expected)');
    }
    
    console.log('\n✅ Database schema check complete!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

main();
