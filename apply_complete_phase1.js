#!/usr/bin/env node
/**
 * Apply Complete Phase 1 SQL to Supabase
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function applySQL() {
  console.log('\n🚀 APPLYING PHASE 1 COMPLETION SCRIPT\n');
  console.log('=' .repeat(60));
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('./complete_phase1.sql', 'utf8');
    console.log('\n📄 SQL script loaded');
    console.log(`   Size: ${sql.length} characters\n`);
    
    // Apply via Supabase REST API using service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SQL executed successfully!\n');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      // Try alternative method: direct query execution
      console.log('⚠️  REST API method failed, trying alternative...\n');
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Execute SQL using raw query
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        console.error('❌ Error executing SQL:', error.message);
        console.error('\nFull error:', error);
        console.log('\n📝 MANUAL APPLICATION REQUIRED:');
        console.log('   1. Go to Supabase SQL Editor');
        console.log('   2. Copy content from: complete_phase1.sql');
        console.log('   3. Execute the script\n');
        return false;
      }
      
      console.log('✅ SQL executed successfully!\n');
      console.log('Result:', data);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 PHASE 1 COMPLETION APPLIED!\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\n📝 MANUAL APPLICATION REQUIRED:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
    console.log('   2. Copy content from: complete_phase1.sql');
    console.log('   3. Click "Run"');
    console.log('   4. Verify with: node verify_phase1_status.js\n');
    
    return false;
  }
}

applySQL()
  .then(success => {
    if (success) {
      console.log('✅ Next step: Run verification with: node verify_phase1_status.js\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
