const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING SUPABASE DATABASE STATE...\n');
  
  // Check all tables
  const tables = [
    'user_profiles',
    'barbershop_transactions', 
    'barbershop_customers',
    'bookings',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking',
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false });
      
      if (error) {
        console.log(`❌ ${table}: Table not found or error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
        if (data && data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: Error - ${e.message}`);
    }
  }
  
  // Check user roles distribution
  console.log('\n📊 USER ROLES DISTRIBUTION:');
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('role');
  
  if (profiles) {
    const roles = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    console.log(roles);
  }
  
  console.log('\n✅ Analysis complete!');
}

analyzeDatabase().catch(console.error);
