const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 ANALYZING SUPABASE DATABASE SCHEMA...\n');
  
  try {
    // Check all tables
    const { data: tables, error } = await supabase.rpc('get_tables_info');
    
    if (error) {
      // Try alternative method
      console.log('⚠️ RPC method not available, using direct queries...\n');
      
      // Check specific tables
      const tablesToCheck = [
        'barbershop_profiles',
        'capsters',
        'service_catalog',
        'bookings',
        'customers',
        'access_keys',
        'loyalty_points',
        'branches' // Check if branches table exists
      ];
      
      for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('*').limit(0);
        
        if (error) {
          console.log(`❌ Table "${table}": NOT EXISTS or NO ACCESS`);
          console.log(`   Error: ${error.message}\n`);
        } else {
          console.log(`✅ Table "${table}": EXISTS`);
          
          // Get column info
          const { data: columns } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (columns && columns.length > 0) {
            console.log(`   Columns: ${Object.keys(columns[0]).join(', ')}`);
          }
          console.log('');
        }
      }
    }
    
    console.log('✅ Schema analysis complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkSchema();
