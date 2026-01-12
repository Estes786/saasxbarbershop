const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
  console.log('🚀 APPLYING 3-ROLE ARCHITECTURE SCHEMA...\n');
  
  const sql = fs.readFileSync('APPLY_3_ROLE_SCHEMA.sql', 'utf8');
  
  // Split by sections for better error tracking
  const sections = sql.split('-- ===========================');
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    const title = section.split('\n')[0].replace('--', '').trim();
    console.log(`📝 Executing: ${title}...`);
    
    try {
      // Execute section
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: section });
      
      if (error) {
        console.error(`❌ Error in ${title}:`, error.message);
        // Continue with other sections
      } else {
        console.log(`✅ ${title} completed`);
      }
    } catch (e) {
      console.error(`❌ Exception in ${title}:`, e.message);
    }
  }
  
  // Verification
  console.log('\n🔍 VERIFYING TABLES...\n');
  
  const tables = [
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  console.log('\n✅ SCHEMA APPLICATION COMPLETE!\n');
}

applySchema().catch(console.error);
