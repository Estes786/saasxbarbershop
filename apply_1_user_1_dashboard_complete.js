#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQLFix() {
  console.log('\n🚀 APPLYING SQL FIX TO SUPABASE...\n');
  
  try {
    // Read SQL file
    const sqlFile = fs.readFileSync('./FIX_1_USER_1_DASHBOARD_COMPLETE.sql', 'utf8');
    
    console.log('📄 SQL File loaded:');
    console.log(`   Size: ${sqlFile.length} bytes`);
    console.log(`   Lines: ${sqlFile.split('\n').length}`);
    console.log('');
    
    // Execute SQL
    console.log('⏳ Executing SQL fix...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlFile });
    
    if (error) {
      // Try alternative: direct query
      console.log('⚠️  RPC method failed, trying direct query...');
      
      const { data: data2, error: error2 } = await supabase
        .from('_sql')
        .select('*')
        .sql(sqlFile);
      
      if (error2) {
        throw new Error(`SQL execution failed: ${error2.message}`);
      }
      
      console.log('✅ SQL fix applied successfully (via direct query)');
    } else {
      console.log('✅ SQL fix applied successfully');
      if (data) {
        console.log('Response:', data);
      }
    }
    
    // Verify results
    console.log('\n📊 Verifying results...\n');
    
    const { data: customers, error: custError } = await supabase
      .from('barbershop_customers')
      .select('user_id, customer_phone, customer_name');
    
    if (custError) {
      throw new Error(`Verification failed: ${custError.message}`);
    }
    
    const total = customers.length;
    const linked = customers.filter(c => c.user_id !== null).length;
    const orphaned = customers.filter(c => c.user_id === null).length;
    
    console.log('========================================');
    console.log('✅ VERIFICATION RESULTS');
    console.log('========================================');
    console.log(`Total customers: ${total}`);
    console.log(`Linked to users: ${linked} (${(linked/total*100).toFixed(1)}%)`);
    console.log(`Orphaned: ${orphaned} (${(orphaned/total*100).toFixed(1)}%)`);
    console.log('========================================');
    
    if (orphaned === 0) {
      console.log('\n🎉 SUCCESS! All customers linked to users');
      console.log('✅ 1 USER = 1 ROLE = 1 DASHBOARD achieved!');
    } else {
      console.log(`\n⚠️  Warning: ${orphaned} orphaned records remaining`);
      console.log('   These records have no matching user_profiles');
    }
    
  } catch (error) {
    console.error('\n❌ Error applying SQL fix:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run fix
applySQLFix();
