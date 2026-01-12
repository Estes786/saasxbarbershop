const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  console.log('🚀 Applying RLS Fix to Supabase...\n');
  console.log('=' .repeat(70));
  
  // Read the SQL file
  const sql = fs.readFileSync('FIX_ALL_RLS_COMPLETE.sql', 'utf8');
  
  // Split into individual statements (excluding comments and verification queries)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => 
      s.length > 0 && 
      !s.startsWith('--') && 
      !s.includes('FROM pg_policies') &&
      !s.includes('Expected output')
    );

  console.log(`📄 Total SQL statements to execute: ${statements.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    // Extract operation type for logging
    const operation = statement.split(/\s+/)[0].toUpperCase();
    const tableName = statement.match(/ON\s+(\w+)/i)?.[1] || statement.match(/TABLE\s+(\w+)/i)?.[1] || 'unknown';
    
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${operation} on ${tableName}...`);

    try {
      const { error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(async () => {
        // If RPC doesn't exist, try direct REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        return { error: null };
      });

      if (error) {
        throw error;
      }

      console.log(`  ✅ SUCCESS`);
      successCount++;
    } catch (err) {
      // Some operations might fail safely (e.g., DROP POLICY IF EXISTS when policy doesn't exist)
      if (err.message?.includes('does not exist') || err.message?.includes('already exists')) {
        console.log(`  ⚠️  SKIPPED (${err.message})`);
        successCount++;
      } else {
        console.log(`  ❌ ERROR: ${err.message || err}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);

  if (errorCount === 0) {
    console.log(`\n🎉 RLS policies applied successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Test customer registration at http://localhost:3000/register`);
    console.log(`   2. Verify policies in Supabase Dashboard → Authentication → Policies`);
  } else {
    console.log(`\n⚠️  Some operations failed. Please:`);
    console.log(`   1. Check Supabase SQL Editor: ${supabaseUrl}/project/qwqmhvwqeynnyxaecqzw/sql`);
    console.log(`   2. Manually execute FIX_ALL_RLS_COMPLETE.sql`);
    console.log(`   3. Verify tables exist and RLS is enabled`);
  }

  console.log('\n' + '=' .repeat(70));
}

// Execute
applyRLSFix().catch(console.error);
