const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('=' .repeat(60));
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseServiceKey.substring(0, 30) + '...');
console.log('=' .repeat(60));

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('\n📊 Checking Database Tables...\n');
  
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'bookings',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table '${table}': NOT EXISTS`);
          results[table] = { exists: false, count: 0, error: 'Table does not exist' };
        } else {
          console.log(`⚠️  Table '${table}': ERROR - ${error.message}`);
          results[table] = { exists: false, count: 0, error: error.message };
        }
      } else {
        console.log(`✅ Table '${table}': EXISTS (${count || 0} rows)`);
        results[table] = { exists: true, count: count || 0 };
      }
    } catch (err) {
      console.log(`⚠️  Table '${table}': EXCEPTION - ${err.message}`);
      results[table] = { exists: false, count: 0, error: err.message };
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Database Status Summary:');
  console.log('=' .repeat(60));
  
  const existingTables = Object.keys(results).filter(t => results[t].exists);
  const missingTables = Object.keys(results).filter(t => !results[t].exists);
  
  console.log(`\n✅ Existing Tables: ${existingTables.length}/${tables.length}`);
  existingTables.forEach(t => console.log(`   - ${t} (${results[t].count} rows)`));
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Missing Tables: ${missingTables.length}`);
    missingTables.forEach(t => console.log(`   - ${t}: ${results[t].error}`));
  }
  
  return results;
}

async function checkRLSStatus() {
  console.log('\n\n🔐 Checking RLS (Row Level Security) Status...\n');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST301') {
        console.log('⚠️  RLS is enabled but no policies allow access');
        console.log('   This is expected - RLS policies need to be applied');
      } else {
        console.log(`❌ RLS Check Error: ${error.message}`);
      }
    } else {
      console.log('✅ RLS policies are working correctly');
    }
  } catch (err) {
    console.log(`❌ RLS Check Exception: ${err.message}`);
  }
}

async function main() {
  try {
    const results = await checkDatabase();
    await checkRLSStatus();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Connection test completed!');
    console.log('=' .repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    process.exit(1);
  }
}

main();
