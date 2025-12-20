const https = require('https');
const fs = require('fs');

const supabaseUrl = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

console.log('🔐 Applying Comprehensive RLS Policies to Supabase...\n');

// Read SQL file
const sql = fs.readFileSync('APPLY_ALL_FIXES.sql', 'utf8');

// Split by double newline to get logical statement groups, but exclude verification queries
const statements = sql
  .split('\n\n')
  .filter(s => {
    const trimmed = s.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith('--') && 
           !trimmed.includes('SELECT tablename') &&
           !trimmed.includes('SELECT schemaname') &&
           !trimmed.includes('SELECT proname') &&
           !trimmed.includes('FROM pg_tables') &&
           !trimmed.includes('FROM pg_policies') &&
           !trimmed.includes('FROM pg_proc');
  })
  .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim())
  .filter(s => s.length > 0);

console.log(`Found ${statements.length} statement groups to execute\n`);

async function executeSQL(query, description) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${description}`);
          resolve({ success: true, status: res.statusCode });
        } else {
          console.log(`⚠️  ${description} - HTTP ${res.statusCode}`);
          console.log(`Response: ${body}`);
          resolve({ success: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${description} - ${e.message}`);
      resolve({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function applyAll() {
  console.log('Starting RLS policy application...\n');
  
  // Try to execute all statements
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const description = `Statement ${i + 1}/${statements.length}`;
    
    const result = await executeSQL(stmt, description);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('EXECUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${statements.length}`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\n⚠️  Some statements failed. This is normal if:');
    console.log('   - Tables/policies already exist (idempotent operations)');
    console.log('   - RPC endpoint not available (may need SQL Editor)');
    console.log('\n📋 MANUAL FALLBACK:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('   2. Copy contents of APPLY_ALL_FIXES.sql');
    console.log('   3. Paste and click "Run"');
  } else {
    console.log('\n🎉 All RLS policies applied successfully!');
  }
}

applyAll().catch(console.error);
