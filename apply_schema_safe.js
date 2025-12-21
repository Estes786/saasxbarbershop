const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  console.log('🚀 Starting safe schema deployment...\n');
  
  const sqlFile = path.join(__dirname, 'SAFE_3_ROLE_SCHEMA.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('📄 SQL file loaded:', sqlFile);
  console.log('📝 SQL length:', sql.length, 'characters\n');
  
  console.log('🔄 Executing SQL on Supabase...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ SQL executed successfully!\n');
    console.log('📊 Result:', data);
    
    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const tables = ['service_catalog', 'capsters', 'booking_slots', 'customer_loyalty', 'customer_reviews'];
    
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`  ❌ ${table}: Error - ${countError.message}`);
      } else {
        console.log(`  ✅ ${table}: ${count} rows`);
      }
    }
    
    console.log('\n✨ Schema deployment complete!');
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  }
}

applySchema();
