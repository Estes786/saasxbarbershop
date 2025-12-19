const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable(tableName) {
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    if (error.code === '42P01') {
      console.log(`❌ Table '${tableName}' does NOT exist`);
      return { exists: false, count: 0 };
    }
    console.log(`⚠️  Error checking table '${tableName}':`, error.message);
    return { exists: false, count: 0, error: error.message };
  }
  
  console.log(`✅ Table '${tableName}' exists (${count || 0} rows)`);
  return { exists: true, count: count || 0 };
}

async function checkAuthConfig() {
  console.log('\n🔐 Checking Authentication Configuration...\n');
  
  // Try to get auth settings
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.log('⚠️  Auth check error (expected when not logged in):', error.message);
  } else {
    console.log('✅ Auth system is working');
  }
}

async function main() {
  console.log('🔍 SUPABASE AUDIT REPORT\n');
  console.log('=' .repeat(60));
  console.log('Project URL:', supabaseUrl);
  console.log('=' .repeat(60));
  
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
    results[table] = await checkTable(table);
  }
  
  await checkAuthConfig();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY');
  console.log('=' .repeat(60));
  
  const existingTables = Object.keys(results).filter(t => results[t].exists);
  const missingTables = Object.keys(results).filter(t => !results[t].exists);
  
  console.log(`✅ Existing tables: ${existingTables.length}/${tables.length}`);
  if (existingTables.length > 0) {
    console.log('  -', existingTables.join(', '));
  }
  
  if (missingTables.length > 0) {
    console.log(`❌ Missing tables: ${missingTables.length}/${tables.length}`);
    console.log('  -', missingTables.join(', '));
    console.log('\n⚠️  ACTION REQUIRED: Deploy SQL schema using DEPLOY_TO_SUPABASE.sql');
  } else {
    console.log('\n✅ All required tables exist!');
  }
  
  console.log('\n' + '=' .repeat(60));
}

main().catch(console.error);
