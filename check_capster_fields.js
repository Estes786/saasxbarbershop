#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkCapsterFields() {
  console.log('🔍 Checking capster table schema...\n');

  // Get one sample capster to see all fields
  const { data, error } = await supabase
    .from('capsters')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('✅ Sample capster record:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n📋 Available fields:', Object.keys(data));

  // Check if is_active exists
  if ('is_active' in data) {
    console.log('\n✅ Field "is_active" EXISTS');
  } else if ('is_available' in data) {
    console.log('\n⚠️  Field "is_available" found instead of "is_active"');
  } else {
    console.log('\n❌ Neither "is_active" nor "is_available" found!');
  }

  // Count total capsters
  const { count } = await supabase
    .from('capsters')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total capsters in database: ${count}`);

  // Try querying with is_active vs is_available
  console.log('\n🧪 Testing different queries:');
  
  const { count: activeCount } = await supabase
    .from('capsters')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true);
  
  console.log(`   - Capsters where is_available=true: ${activeCount}`);
}

checkCapsterFields().catch(console.error);
