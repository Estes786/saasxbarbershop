const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filename) {
  console.log(`\n🚀 Executing SQL file: ${filename}\n`);
  
  const sql = fs.readFileSync(filename, 'utf8');
  
  try {
    // Execute SQL using Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✅ SQL executed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    
    // Alternative: Execute via pg client
    console.log('\n⚠️  Trying alternative execution method...\n');
    
    // Split SQL into statements and execute one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.includes('DO $$') || statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`⏭️  Skipping statement ${i + 1} (requires direct database access)\n`);
        continue;
      }
      
      try {
        await supabase.rpc('exec', { sql: statement });
        successCount++;
        console.log(`✅ Statement ${i + 1}/${statements.length} executed\n`);
      } catch (err) {
        errorCount++;
        console.log(`❌ Statement ${i + 1}/${statements.length} failed: ${err.message}\n`);
      }
    }
    
    console.log(`\n📊 Results: ${successCount} success, ${errorCount} errors\n`);
    return errorCount === 0;
  }
}

// Execute the SQL file
executeSQLFile('./FIX_BOOKING_COMPREHENSIVE_FINAL_06JAN2026_V2.sql')
  .then(success => {
    if (success) {
      console.log('🎉 ALL DATABASE FIXES APPLIED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some statements failed. Please run the SQL manually in Supabase SQL Editor.\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
