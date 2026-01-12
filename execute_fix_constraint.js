#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Supabase credentials
const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

// Read SQL file
const sqlContent = fs.readFileSync('./FIX_ONBOARDING_CONSTRAINT_SAFE_V2.sql', 'utf8');

console.log('🚀 Executing SQL fix to Supabase...\n');
console.log('📝 SQL Script: FIX_ONBOARDING_CONSTRAINT_SAFE_V2.sql');
console.log('🎯 Target: Remove restrictive check constraint on capsters.specialization\n');

// Use Supabase Management API
const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: '/v1/projects/qwqmhvwqeynnyxaecqzw/database/query',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const postData = JSON.stringify({
  query: sqlContent
});

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📊 Response Status:', res.statusCode);
    console.log('📄 Response Headers:', JSON.stringify(res.headers, null, 2));
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ SUCCESS! SQL script executed successfully');
      console.log('📋 Response:', data);
      console.log('\n✨ Check constraint fix applied!');
      console.log('✅ Onboarding should now work without errors\n');
    } else {
      console.log('\n❌ Error executing SQL');
      console.log('📋 Response:', data);
      console.log('\n💡 Alternative: Copy SQL script and run manually in Supabase SQL Editor');
      console.log('📍 URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Fallback: Run SQL manually in Supabase SQL Editor');
  console.log('📍 URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('\n📝 Copy this SQL:\n');
  console.log('=' .repeat(60));
  console.log(sqlContent);
  console.log('='.repeat(60));
});

req.write(postData);
req.end();
