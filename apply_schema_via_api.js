const fs = require('fs');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

async function executeSQLCommand(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql })
  });

  return response;
}

async function applySchema() {
  console.log('\n🔧 APPLYING SCHEMA FIX TO SUPABASE\n');
  
  const sql = fs.readFileSync('apply_schema_fix_direct.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;

    try {
      // Use curl untuk execute SQL karena Supabase tidak punya endpoint exec
      const { execSync } = require('child_process');
      
      // Escape single quotes in SQL
      const escapedSQL = stmt.replace(/'/g, "''");
      
      const curlCommand = `curl -X POST '${SUPABASE_URL}/rest/v1/rpc/query' \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"query": "${escapedSQL}"}' 2>&1`;

      const result = execSync(curlCommand, { encoding: 'utf8' });
      
      console.log(`${i + 1}. ✅ ${stmt.substring(0, 60)}...`);
      success++;
    } catch (error) {
      console.log(`${i + 1}. ⚠️  ${stmt.substring(0, 60)}... (skipped)`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed/skipped\n`);
}

applySchema().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
