const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const projectRef = 'qwqmhvwqeynnyxaecqzw';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

console.log('🔐 Applying Idempotent RLS Fixes...\n');
console.log('=' .repeat(60));

const sql = fs.readFileSync('FIX_RLS_IDEMPOTENT.sql', 'utf8');

const data = JSON.stringify({
  query: sql
});

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
    console.log('📡 Status:', res.statusCode);
    console.log('Response:', body);
    console.log('\n' + '=' .repeat(60));
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ SUCCESS! RLS policies applied!');
      console.log('\n🧪 Running authentication test...\n');
      
      // Run test automatically
      const { exec } = require('child_process');
      exec('node test_auth_automated.js', (error, stdout, stderr) => {
        console.log(stdout);
        if (error) console.error(stderr);
      });
    } else {
      console.log('❌ Failed. Error:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
