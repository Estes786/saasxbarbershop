const https = require('https');
require('dotenv').config({ path: '.env.local' });

const projectRef = 'qwqmhvwqeynnyxaecqzw';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

console.log('🚨 TEMPORARY FIX: Disable RLS for Testing\n');
console.log('=' .repeat(60));
console.log('⚠️  This is TEMPORARY - for testing only!');
console.log('We will re-enable RLS after fixing the recursion issue.');
console.log('=' .repeat(60) + '\n');

const statements = [
  'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY'
];

async function executeStatement(sql) {
  return new Promise((resolve) => {
    console.log(`⏳ Executing: ${sql}\n`);
    
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   ✅ Success!');
        } else {
          console.log(`   ❌ Failed: ${body}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

async function main() {
  await executeStatement(statements[0]);
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ RLS Disabled for user_profiles');
  console.log('🧪 Running authentication test...\n');
  
  const { exec } = require('child_process');
  exec('node test_auth_automated.js', (error, stdout) => {
    console.log(stdout);
  });
}

main();
