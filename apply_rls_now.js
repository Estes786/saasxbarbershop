const https = require('https');
const fs = require('fs');

const supabaseUrl = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';

// Read SQL file
const sql = fs.readFileSync('APPLY_RLS_POLICIES.sql', 'utf8');

// Split into individual statements and filter out comments and verification query
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('FROM pg_policies'));

console.log('🔐 Applying RLS Policies to Supabase...\n');
console.log(`Found ${statements.length} SQL statements to execute\n`);

async function executeSQL(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': accessToken,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          resolve({ success: false, statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function main() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing:`);
    console.log(statement.substring(0, 100) + '...\n');

    try {
      const result = await executeSQL(statement);
      if (result.success) {
        console.log('✅ Success');
        successCount++;
      } else {
        console.log(`⚠️  HTTP ${result.statusCode}:`, result.body);
        errorCount++;
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount === 0) {
    console.log('\n🎉 All RLS policies applied successfully!');
  } else {
    console.log('\n⚠️  Some statements failed. You may need to apply them manually in Supabase SQL Editor.');
  }
}

main().catch(console.error);
