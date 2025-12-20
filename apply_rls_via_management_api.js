const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const projectRef = 'qwqmhvwqeynnyxaecqzw';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

console.log('🔐 Applying RLS Fixes via Supabase Management API\n');
console.log('=' .repeat(60));
console.log('📍 Project:', projectRef);
console.log('🔑 Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'NOT FOUND');
console.log('=' .repeat(60) + '\n');

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

// Read SQL file
const sql = fs.readFileSync('FIX_RLS_NO_RECURSION.sql', 'utf8');

// Remove comments and verification queries
const cleanedSQL = sql
  .split('\n')
  .filter(line => {
    const trimmed = line.trim();
    // Keep non-empty lines that aren't comments
    if (!trimmed) return false;
    if (trimmed.startsWith('--')) return false;
    // Remove verification queries
    if (trimmed.includes('FROM pg_tables')) return false;
    if (trimmed.includes('FROM pg_policies')) return false;
    if (trimmed.includes('FROM pg_proc')) return false;
    return true;
  })
  .join('\n');

console.log('📄 SQL File: FIX_RLS_NO_RECURSION.sql');
console.log('📏 Original Size:', sql.length, 'bytes');
console.log('📏 Cleaned Size:', cleanedSQL.length, 'bytes');
console.log('\n⏳ Sending request to Supabase Management API...\n');

const data = JSON.stringify({
  query: cleanedSQL
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
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('📡 Response Status:', res.statusCode);
    console.log('=' .repeat(60));
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ SUCCESS! RLS policies applied successfully!\n');
      console.log('Response:', body.substring(0, 500));
      console.log('\n' + '=' .repeat(60));
      console.log('✅ You can now test authentication flows again!');
      console.log('   Run: node test_auth_automated.js');
      console.log('=' .repeat(60));
    } else {
      console.log('❌ FAILED! Status:', res.statusCode);
      console.log('Response:', body);
      console.log('\n' + '=' .repeat(60));
      console.log('⚠️  FALLBACK: Manual Apply Required');
      console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
      console.log('   2. Copy contents of: FIX_RLS_NO_RECURSION.sql');
      console.log('   3. Paste and click RUN');
      console.log('=' .repeat(60));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.log('\n' + '=' .repeat(60));
  console.log('⚠️  FALLBACK: Manual Apply Required');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('   2. Copy contents of: FIX_RLS_NO_RECURSION.sql');
  console.log('   3. Paste and click RUN');
  console.log('=' .repeat(60));
});

req.write(data);
req.end();
