const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLScript() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 EXECUTING COMPREHENSIVE SQL SCRIPT TO SUPABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Read the SQL script
    const sqlPath = path.join(__dirname, 'COMPREHENSIVE_FIX_WITH_SECRET_KEY_SYSTEM.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL Script loaded successfully');
    console.log(`📏 Script size: ${(sqlScript.length / 1024).toFixed(2)} KB\n`);
    
    // Execute via Management API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query: sqlScript
      })
    });

    if (!response.ok) {
      // Try alternative: split and execute line by line for complex scripts
      console.log('⚠️  Direct execution failed, trying supabase-js method...\n');
      
      // For Supabase, we need to use their CLI or execute via pg connection
      // Let's try using .rpc() with a simpler approach
      
      console.log('ℹ️  Since Supabase doesn\'t support direct multi-statement SQL execution via API,');
      console.log('   you need to execute the script manually in Supabase SQL Editor.');
      console.log('\n📋 INSTRUCTIONS:');
      console.log('   1. Go to: https://qwqmhvwqeynnyxaecqzw.supabase.co/project/_/sql');
      console.log('   2. Open file: COMPREHENSIVE_FIX_WITH_SECRET_KEY_SYSTEM.sql');
      console.log('   3. Copy all content and paste in SQL Editor');
      console.log('   4. Click "Run" button');
      console.log('\n✅ The script is SAFE and IDEMPOTENT - you can run it multiple times!');
      
      // BUT let's try to verify connection works
      console.log('\n🔍 Verifying Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.log('❌ Connection test failed:', testError.message);
      } else {
        console.log('✅ Connection to Supabase verified!');
      }
      
      return;
    }

    const result = await response.json();
    console.log('✅ SQL script executed successfully!');
    console.log(result);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    
    console.log('\n📋 MANUAL EXECUTION REQUIRED:');
    console.log('   Please execute COMPREHENSIVE_FIX_WITH_SECRET_KEY_SYSTEM.sql');
    console.log('   in Supabase SQL Editor at:');
    console.log('   https://qwqmhvwqeynnyxaecqzw.supabase.co/project/_/sql');
  }
}

executeSQLScript();
