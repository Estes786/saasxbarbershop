const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLFix() {
  console.log('\n🔧 APPLYING PERFECT IDEMPOTENT FIX TO SUPABASE...\n');

  try {
    // Read SQL file
    const sql = fs.readFileSync('./PERFECT_IDEMPOTENT_FIX.sql', 'utf8');
    
    console.log('📄 SQL File loaded successfully');
    console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${sql.split('\n').length}`);
    
    console.log('\n⏳ Executing SQL... (this may take 10-30 seconds)\n');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      // Try alternative method: split and execute
      console.log('⚠️  RPC method failed, trying direct execution...\n');
      
      // Split SQL into statements (basic split by semicolon)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`   Found ${statements.length} SQL statements\n`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length < 10) continue; // Skip empty/comment-only statements
        
        try {
          // Use the from() method for basic queries, but most DDL requires direct execution
          // Since Supabase doesn't support direct SQL execution via client,
          // we need to use the Management API or SQL Editor
          console.log(`⚠️  Statement ${i + 1}: Needs to be executed in Supabase SQL Editor`);
          console.log(`   Preview: ${stmt.substring(0, 80)}...`);
        } catch (stmtError) {
          errorCount++;
          console.log(`❌ Statement ${i + 1} error: ${stmtError.message}`);
        }
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  IMPORTANT: SQL needs to be executed manually in Supabase SQL Editor');
      console.log('='.repeat(80));
      console.log('\n📋 INSTRUCTIONS:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
      console.log('   2. Copy contents of: PERFECT_IDEMPOTENT_FIX.sql');
      console.log('   3. Paste into SQL Editor');
      console.log('   4. Click "Run" button');
      console.log('   5. Wait for execution to complete');
      console.log('   6. Verify with: SELECT * FROM verification queries at end of script\n');
      
      return false;
    }
    
    console.log('✅ SQL executed successfully!');
    console.log('   Result:', JSON.stringify(data, null, 2));
    
    return true;
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run fix
applySQLFix()
  .then((success) => {
    if (success) {
      console.log('\n✅ Fix applied successfully!');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Run: node analyze_db_current_state.js (to verify changes)');
      console.log('   2. Test registration flow for all 3 roles');
      console.log('   3. Build and start development server\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Fix needs manual application via Supabase SQL Editor');
      console.log('   File: PERFECT_IDEMPOTENT_FIX.sql\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
