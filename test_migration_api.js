const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';

// Read SQL file
const sqlContent = fs.readFileSync('migrations/PHASE_1_MULTI_LOCATION_SAFE.sql', 'utf8');

console.log('🚀 Testing Phase 1 Multi-Location Migration...\n');

// First, let's try to execute via Supabase SQL Editor API
const postData = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: 'qwqmhvwqeynnyxaecqzw.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Migration executed successfully!');
    } else {
      console.log('\n❌ Migration failed!');
      console.log('⚠️ You may need to run this script manually in Supabase SQL Editor');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️ Alternative: Copy the SQL script content and run manually in Supabase SQL Editor');
});

req.write(postData);
req.end();
