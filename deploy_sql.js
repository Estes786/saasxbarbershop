const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      console.log(`❌ Table '${tableName}' does NOT exist`);
      return false;
    }
    console.log(`⚠️  Error checking table '${tableName}':`, error.message);
    return false;
  }
  
  console.log(`✅ Table '${tableName}' exists`);
  return true;
}

async function main() {
  console.log('🔍 Checking database tables...\n');
  
  // Check tables
  await checkTable('barbershop_transactions');
  await checkTable('barbershop_customers');
  await checkTable('user_profiles');
  await checkTable('bookings');
  
  console.log('\n📊 Database check complete!');
}

main();
