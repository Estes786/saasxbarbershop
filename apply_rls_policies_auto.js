const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔐 Applying RLS Policies to Supabase...\n');
console.log('=' .repeat(60));

// Read SQL file
const sqlFile = fs.readFileSync('FIX_RLS_NO_RECURSION.sql', 'utf8');

// Split into individual statements (exclude comments and verification queries)
const statements = sqlFile
  .split(';')
  .map(s => s.trim())
  .filter(s => {
    // Remove empty statements
    if (s.length === 0) return false;
    // Remove comments
    if (s.startsWith('--')) return false;
    // Remove verification queries
    if (s.includes('FROM pg_tables') || s.includes('FROM pg_policies') || s.includes('FROM pg_proc')) return false;
    return true;
  });

console.log(`📄 Found ${statements.length} SQL statements to execute\n`);
console.log('=' .repeat(60) + '\n');

async function executeSQL(sql, description) {
  console.log(`⏳ Executing: ${description}...`);
  
  try {
    // Use Supabase REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText.substring(0, 100)}`);
      return { success: false, error: errorText };
    }

    console.log(`   ✅ Success`);
    return { success: true };
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyPolicies() {
  console.log('🚀 Starting RLS Policy Application...\n');
  
  const results = [];
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Determine statement type
    let description = `Statement ${i + 1}`;
    if (stmt.includes('ALTER TABLE') && stmt.includes('DISABLE')) {
      description = 'Disable RLS temporarily';
    } else if (stmt.includes('DROP POLICY')) {
      const match = stmt.match(/DROP POLICY IF EXISTS "([^"]+)"/);
      description = match ? `Drop policy: ${match[1]}` : 'Drop old policy';
    } else if (stmt.includes('ALTER TABLE') && stmt.includes('ENABLE')) {
      description = 'Enable RLS';
    } else if (stmt.includes('CREATE POLICY')) {
      const match = stmt.match(/CREATE POLICY "([^"]+)"/);
      description = match ? `Create policy: ${match[1]}` : 'Create new policy';
    } else if (stmt.includes('DROP FUNCTION')) {
      description = 'Drop old function';
    } else if (stmt.includes('CREATE OR REPLACE FUNCTION')) {
      description = 'Create updated function';
    } else if (stmt.includes('DROP TRIGGER')) {
      description = 'Drop old trigger';
    } else if (stmt.includes('CREATE TRIGGER')) {
      const match = stmt.match(/CREATE TRIGGER ([^ ]+)/);
      description = match ? `Create trigger: ${match[1]}` : 'Create trigger';
    }
    
    const result = await executeSQL(stmt, description);
    results.push({ statement: description, ...result });
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 EXECUTION SUMMARY');
  console.log('=' .repeat(60) + '\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${results.length}\n`);
    console.log('Failed statements:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.statement}`);
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (failed > 0) {
    console.log('\n⚠️  IMPORTANT: Some statements failed.');
    console.log('   This is NORMAL if using Supabase REST API.');
    console.log('   Please apply the SQL file manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('\n   Copy the contents of: FIX_RLS_NO_RECURSION.sql');
  } else {
    console.log('\n✅ All RLS policies applied successfully!');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run
applyPolicies().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
