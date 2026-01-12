const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

async function executeSQL(sql, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    // Use fetch API to call PostgREST directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`  ⚠️  ${description}: ${error}`);
      return false;
    }

    console.log(`  ✅ ${description}`);
    return true;
  } catch (err) {
    console.log(`  ⚠️  ${description}: ${err.message}`);
    return false;
  }
}

async function deploySchema() {
  console.log('🚀 Deploying 3-Role Architecture Schema\n');
  console.log('=' .repeat(50));

  const sql = fs.readFileSync('./SAFE_3_ROLE_SCHEMA.sql', 'utf8');
  
  // Execute full SQL via REST API
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      console.error('❌ Failed to execute SQL');
      const error = await response.text();
      console.error('Error:', error);
      
      // Try alternative: use psql-like connection
      console.log('\n🔄 Trying alternative method...');
      await deployViaDirectQuery();
      return;
    }

    console.log('✅ Schema deployed successfully!');
    await verifyDeployment();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n🔄 Trying alternative method...');
    await deployViaDirectQuery();
  }
}

async function deployViaDirectQuery() {
  console.log('\n📝 Executing via direct query method...\n');
  
  const sql = fs.readFileSync('./SAFE_3_ROLE_SCHEMA.sql', 'utf8');
  
  // Split into batches
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.match(/^\/\*/));
  
  console.log(`Found ${statements.length} SQL statements\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    const preview = stmt.substring(0, 60) + '...';
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: stmt });
      
      if (error) {
        console.log('❌');
        failCount++;
        // Don't stop, continue with next statement
      } else {
        console.log('✅');
        successCount++;
      }
    } catch (err) {
      console.log('❌');
      failCount++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount} statements`);
  console.log(`❌ Failed: ${failCount} statements`);
  console.log('='.repeat(50) + '\n');
  
  await verifyDeployment();
}

async function verifyDeployment() {
  console.log('\n🔍 Verifying deployment...\n');
  
  const tables = [
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews',
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ ${table.padEnd(20)}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table.padEnd(20)}: ${count} rows`);
      }
    } catch (err) {
      console.log(`  ❌ ${table.padEnd(20)}: ${err.message}`);
    }
  }
  
  console.log('\n✨ Deployment verification complete!\n');
}

deploySchema().catch(console.error);
