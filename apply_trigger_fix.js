const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          resolve({ success: false, error: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🔧 APPLYING TRIGGER FIX\n');
  
  const sql = fs.readFileSync('fix_profile_trigger.sql', 'utf8');
  
  // Execute full SQL
  console.log('Executing SQL...');
  const result = await executeSQL(sql);
  
  if (result.success) {
    console.log('✅ Trigger fix applied successfully');
    console.log('   Result:', result.data.substring(0, 200));
  } else {
    console.log('⚠️  Trigger fix failed');
    console.log('   Status:', result.status);
    console.log('   Error:', result.error);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
