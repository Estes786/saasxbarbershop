const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING SUPABASE DATABASE...\n');

  // Check existing tables
  const tables = [
    'user_profiles',
    'barbershop_customers',
    'capsters',
    'service_catalog',
    'booking_slots',
    'bookings',
    'customer_loyalty',
    'customer_reviews',
    'barbershop_transactions'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: NOT EXISTS or ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERROR - ${err.message}`);
    }
  }

  // Check user_profiles in detail
  console.log('\n📊 USER_PROFILES ANALYSIS:');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('role, count');

  if (!profilesError && profiles) {
    console.log('Roles distribution:', profiles);
  }

  // Check RLS policies
  console.log('\n🔐 CHECKING RLS POLICIES...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('pg_policies')
    .select('*');

  if (policiesError) {
    console.log('❌ Cannot check policies:', policiesError.message);
  } else {
    console.log(`✅ Found ${policies?.length || 0} policies`);
  }

  console.log('\n✅ Database analysis complete!');
}

analyzeDatabase().catch(console.error);
