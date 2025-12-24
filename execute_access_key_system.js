// Execute ACCESS KEY System SQL to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLScript() {
  console.log('🚀 Executing ACCESS KEY System SQL Script...\n');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL Script loaded successfully');
    console.log('📏 Script size:', sqlScript.length, 'characters\n');

    // Execute via Supabase Management API
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sqlScript })
      }
    );

    if (!response.ok) {
      // Try alternative approach: use psql-like execution
      console.log('⚠️  RPC method not available, trying direct execution...\n');
      
      // Split into individual statements and execute
      const statements = sqlScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < Math.min(5, statements.length); i++) {
        const stmt = statements[i];
        if (stmt.includes('CREATE TABLE') || stmt.includes('CREATE INDEX')) {
          console.log(`${i + 1}. Executing: ${stmt.substring(0, 60)}...`);
        }
      }

      console.log('\n⚠️  Cannot execute via API - Please run SQL manually in Supabase SQL Editor');
      console.log('\n📋 MANUAL STEPS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
      console.log('2. Copy content from: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click "Run" button');
      console.log('\n✅ After running, come back here and we will continue with frontend implementation\n');
      
      return;
    }

    const result = await response.json();
    console.log('✅ SQL Script executed successfully!\n');
    console.log('Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    console.log('\n💡 SOLUTION: Please run SQL script manually');
    console.log('   File: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
    console.log('   Location: Supabase Dashboard → SQL Editor');
  }
}

// Also provide a verification function
async function verifyImplementation() {
  console.log('\n🔍 Verifying ACCESS KEY System Implementation...\n');

  try {
    // Check if table exists
    const { data: keys, error } = await supabase
      .from('access_keys')
      .select('*');

    if (error) {
      console.log('❌ Verification failed:', error.message);
      console.log('   → SQL script needs to be executed first\n');
      return false;
    }

    console.log('✅ access_keys table exists!');
    console.log(`   Found ${keys.length} access keys\n`);

    // Display keys
    keys.forEach((key, idx) => {
      console.log(`${idx + 1}. ${key.key_name}`);
      console.log(`   Access Key: ${key.access_key}`);
      console.log(`   Role: ${key.role}`);
      console.log(`   Uses: ${key.current_uses}${key.max_uses ? `/${key.max_uses}` : '/unlimited'}`);
      console.log(`   Active: ${key.is_active ? '✅' : '❌'}`);
      console.log('');
    });

    // Test validation function
    console.log('🧪 Testing validation function...');
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_access_key', {
        p_access_key: 'CUSTOMER_BOZQ_ACCESS_1',
        p_role: 'customer'
      });

    if (validationError) {
      console.log('❌ Validation function test failed:', validationError.message);
    } else {
      console.log('✅ Validation function working!');
      console.log('   Result:', validationResult);
    }

    return true;

  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

// Main execution
(async () => {
  await executeSQLScript();
  
  // Wait a bit then verify
  console.log('\n⏳ Waiting 3 seconds before verification...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await verifyImplementation();
})();
