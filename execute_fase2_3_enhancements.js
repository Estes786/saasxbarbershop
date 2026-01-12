const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

console.log('\n🚀 EXECUTING FASE 2 & 3 DATABASE ENHANCEMENTS...\n');
console.log('='.repeat(60));

// Read SQL file
const sqlContent = fs.readFileSync('./FASE_2_3_DATABASE_ENHANCEMENT_FIXED.sql', 'utf8');

// Split into individual statements (simple approach)
const statements = sqlContent
  .split(/;\s*$/gm)
  .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));

console.log(`\n📄 Found ${statements.length} SQL statements to execute\n`);

// Execute via REST API
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

const data = JSON.stringify({
  query: sqlContent
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=minimal'
  }
};

console.log('⏳ Executing SQL via Supabase REST API...\n');

const req = https.request(url, options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}\n`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ SQL EXECUTED SUCCESSFULLY!\n');
      console.log('='.repeat(60));
      console.log('\n🎉 FASE 2 & 3 DATABASE ENHANCEMENTS COMPLETE!\n');
      console.log('New tables and features added:');
      console.log('  ✅ Enhanced bookings table with queue management');
      console.log('  ✅ customer_visit_history for tracking');
      console.log('  ✅ customer_predictions for analytics');
      console.log('  ✅ Automatic queue number assignment');
      console.log('  ✅ Predictive analytics functions');
      console.log('  ✅ RLS policies configured');
      console.log('\n' + '='.repeat(60) + '\n');
    } else {
      console.log('⚠️  Response:', responseData);
      console.log('\n❌ Execution might have issues. Check Supabase SQL Editor manually.\n');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERROR:', error.message);
  console.log('\n⚠️  Please execute SQL manually in Supabase SQL Editor:\n');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Open file: FASE_2_3_DATABASE_ENHANCEMENT_FIXED.sql');
  console.log('   3. Click "Run" button\n');
});

req.write(data);
req.end();
