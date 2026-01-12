const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeSchema() {
  console.log('🔍 ANALYZING CURRENT DATABASE SCHEMA...\n');
  
  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'sql_%');
    
    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
      
      // Fallback: Try to query specific tables we know exist
      console.log('\n📋 Checking known tables...\n');
      const knownTables = [
        'user_profiles',
        'barbershop_customers',
        'barbershop_transactions',
        'capsters',
        'service_catalog',
        'bookings',
        'access_keys',
        'barbershop_profiles',
        'branches',
        'locations'
      ];
      
      for (const tableName of knownTables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${tableName} exists`);
          
          // Get columns for this table
          const { data: columns, error: colError } = await supabase
            .rpc('get_table_columns', { table_name: tableName })
            .limit(50);
          
          if (!colError && columns) {
            console.log(`   Columns: ${columns.map(c => c.column_name).join(', ')}`);
          }
        } else {
          console.log(`❌ ${tableName} does not exist`);
        }
        console.log('');
      }
      
      return;
    }
    
    console.log(`📋 Found ${tables.length} tables:\n`);
    
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n📊 Table: ${tableName}`);
      console.log('─'.repeat(50));
      
      // Get sample data to see structure
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!sampleError && sample && sample.length > 0) {
        console.log('Columns:', Object.keys(sample[0]).join(', '));
      } else if (sampleError) {
        console.log('Error:', sampleError.message);
      }
      
      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`Rows: ${count}`);
      }
    }
    
    // Check for existing branch/location related fields
    console.log('\n\n🏢 CHECKING FOR EXISTING LOCATION/BRANCH FIELDS...\n');
    
    const checkTables = ['barbershop_customers', 'capsters', 'bookings', 'service_catalog'];
    
    for (const tableName of checkTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const locationFields = columns.filter(col => 
          col.includes('branch') || 
          col.includes('location') || 
          col.includes('shop')
        );
        
        if (locationFields.length > 0) {
          console.log(`✅ ${tableName}: Has location-related fields: ${locationFields.join(', ')}`);
        } else {
          console.log(`⚠️  ${tableName}: No location-related fields found`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeSchema().then(() => {
  console.log('\n\n✅ Analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
