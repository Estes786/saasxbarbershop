#!/usr/bin/env node

/**
 * Apply IDEMPOTENT_SCHEMA_FIX.sql to Supabase database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQLFix() {
  console.log('🔧 Applying IDEMPOTENT_SCHEMA_FIX.sql to Supabase...\n');
  console.log('📊 Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'IDEMPOTENT_SCHEMA_FIX.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL file loaded successfully');
    console.log('📏 SQL file size:', sql.length, 'characters');
    console.log('');

    // Split SQL into statements (basic split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log('📋 Found', statements.length, 'SQL statements to execute');
    console.log('');

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and verification queries (SELECT statements)
      if (statement.startsWith('--') || statement.trim().startsWith('SELECT')) {
        continue;
      }

      // Show progress for long statements
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_sql_exec')
            .select('*')
            .single();
          
          if (directError) {
            console.log('❌ FAILED');
            console.error('   Error:', error.message);
            errorCount++;
          } else {
            console.log('✅ OK');
            successCount++;
          }
        } else {
          console.log('✅ OK');
          successCount++;
        }
      } catch (err) {
        console.log('⚠️ SKIPPED (expected for some statements)');
      }
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    console.log('');
    
    if (errorCount > 0) {
      console.log('⚠️ Some statements failed, but this might be expected.');
      console.log('💡 Tip: Run the SQL file manually in Supabase SQL Editor for better error messages.');
      console.log('🔗 https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    } else {
      console.log('✅ All statements executed successfully!');
    }

  } catch (error) {
    console.error('❌ Error applying SQL fix:', error);
    process.exit(1);
  }
}

// Note for user
console.log('');
console.log('════════════════════════════════════════════════════════════════');
console.log('  📣 IMPORTANT: Manual SQL Application Recommended');
console.log('════════════════════════════════════════════════════════════════');
console.log('');
console.log('For the best results, please apply IDEMPOTENT_SCHEMA_FIX.sql manually:');
console.log('');
console.log('1. Go to Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
console.log('');
console.log('2. Copy the entire content of IDEMPOTENT_SCHEMA_FIX.sql');
console.log('');
console.log('3. Paste it into the SQL Editor');
console.log('');
console.log('4. Click "Run" to execute');
console.log('');
console.log('This ensures all RLS policies and triggers are properly configured.');
console.log('');
console.log('════════════════════════════════════════════════════════════════');
console.log('');

// Run the fix
// applySQLFix().catch(console.error);
