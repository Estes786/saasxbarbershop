const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');
  
  // Check tables
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'bookings',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking'
  ];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table '${table}' does NOT exist`);
      } else {
        console.log(`⚠️  Error checking table '${table}':`, error.message);
      }
    } else {
      console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
    }
  }
  
  console.log('\n📊 Database Status Check Complete\n');
}

checkDatabase().catch(console.error);
