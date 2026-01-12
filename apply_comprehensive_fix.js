#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQLFix() {
  console.log('\n============================================================');
  console.log('🚀 APPLYING COMPREHENSIVE 1 USER = 1 DASHBOARD FIX');
  console.log('============================================================\n');

  try {
    // Read SQL file
    const sqlFile = path.join(__dirname, 'COMPREHENSIVE_1_USER_1_ROLE_1_DASHBOARD_FIX.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 SQL File: COMPREHENSIVE_1_USER_1_ROLE_1_DASHBOARD_FIX.sql');
    console.log(`📊 Size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('⏳ Executing SQL script...');
    console.log('   This may take 30-60 seconds...');
    console.log('');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    }).catch(async (rpcError) => {
      // Fallback: try direct execution
      console.log('⚠️  RPC method not available, trying direct execution...');
      return await supabase.from('_sqlx_migrations').select('*').limit(0).then(() => {
        // If this works, we know we have access
        // Now execute the SQL in chunks
        return { data: null, error: { message: 'Need to use Supabase SQL Editor' } };
      });
    });

    if (error) {
      console.log('');
      console.log('⚠️  Cannot execute SQL directly via API');
      console.log('');
      console.log('📝 MANUAL EXECUTION REQUIRED:');
      console.log('============================================================');
      console.log('');
      console.log('1. Open Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/editor');
      console.log('');
      console.log('2. Go to SQL Editor');
      console.log('');
      console.log('3. Copy and paste the entire content of:');
      console.log('   COMPREHENSIVE_1_USER_1_ROLE_1_DASHBOARD_FIX.sql');
      console.log('');
      console.log('4. Click "Run" button');
      console.log('');
      console.log('5. Wait for completion (will show RAISE NOTICE messages)');
      console.log('');
      console.log('6. Come back and run: node verify_fix.js');
      console.log('');
      console.log('============================================================');
      console.log('');
      
      // Save SQL to a convenient location
      const outputPath = path.join(__dirname, 'APPLY_THIS_SQL.sql');
      fs.writeFileSync(outputPath, sqlContent);
      console.log(`✅ SQL saved to: ${outputPath}`);
      console.log('   You can copy this file content to Supabase SQL Editor');
      console.log('');
    } else {
      console.log('');
      console.log('✅ SQL executed successfully!');
      console.log('');
      console.log('📊 Verifying results...');
      
      // Verify the fix
      await verifyFix();
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  }
}

async function verifyFix() {
  console.log('');
  console.log('============================================================');
  console.log('🔍 VERIFYING FIX RESULTS');
  console.log('============================================================\n');

  try {
    // Check customer records
    const { data: customers, error } = await supabase
      .from('barbershop_customers')
      .select('user_id, customer_phone, customer_name, total_visits');
    
    if (error) {
      console.log('⚠️  Cannot verify (RLS may be blocking)');
      console.log('   Run: node analyze_current_db.js');
      return;
    }

    const total = customers.length;
    const linked = customers.filter(c => c.user_id !== null).length;
    const orphaned = customers.filter(c => c.user_id === null).length;

    console.log('📊 Results:');
    console.log(`   Total customer records: ${total}`);
    console.log(`   ✅ Linked to users: ${linked} (${(linked/total*100).toFixed(1)}%)`);
    console.log(`   ❌ Orphaned: ${orphaned} (${(orphaned/total*100).toFixed(1)}%)`);
    console.log('');

    if (orphaned === 0) {
      console.log('🎉 SUCCESS: All customer records properly linked!');
      console.log('✅ 1 USER = 1 DASHBOARD is now enforced');
    } else if (orphaned < 5) {
      console.log('⚠️  Some orphaned records remain');
      console.log('   These may need manual linking');
    } else {
      console.log('❌ Many orphaned records still exist');
      console.log('   The fix may not have applied correctly');
    }

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

applySQLFix();
