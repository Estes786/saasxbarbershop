const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking existing database tables...\n');
  
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking',
    'bookings'
  ];
  
  const results = {};
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table '${table}' does NOT exist`);
        results[table] = { exists: false, count: 0 };
      } else {
        console.log(`⚠️  Error checking table '${table}':`, error.message);
        results[table] = { exists: false, count: 0, error: error.message };
      }
    } else {
      console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
      results[table] = { exists: true, count: count || 0 };
    }
  }
  
  return results;
}

async function main() {
  console.log('🚀 Starting Supabase Database Deployment Check\n');
  console.log('=' .repeat(60));
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log('=' .repeat(60));
  console.log('');
  
  const results = await checkTables();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));
  
  const existing = Object.values(results).filter(r => r.exists).length;
  const missing = Object.values(results).filter(r => !r.exists).length;
  
  console.log(`✅ Existing tables: ${existing}`);
  console.log(`❌ Missing tables: ${missing}`);
  
  if (missing > 0) {
    console.log('\n⚠️  RECOMMENDATION:');
    console.log('Some tables are missing. You need to:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('2. Copy contents from: DEPLOY_TO_SUPABASE.sql');
    console.log('3. Paste and click "Run"');
    console.log('4. Then run FIX_SQL_FUNCTION.sql for the compute_lead_scores fix');
  } else {
    console.log('\n✅ All required tables exist!');
    console.log('Database schema is ready.');
  }
}

main().catch(console.error);
