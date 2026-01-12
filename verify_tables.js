const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('🔍 Verifying Supabase Tables...\n');
  
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'bookings',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking'
  ];
  
  let allGood = true;
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Table '${table}' - ERROR: ${error.message}`);
      allGood = false;
    } else {
      console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
    }
  }
  
  if (allGood) {
    console.log('\n🎉 All tables verified successfully!\n');
  } else {
    console.log('\n⚠️  Some tables have issues\n');
  }
}

verifyTables();
