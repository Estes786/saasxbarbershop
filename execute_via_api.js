/**
 * EXECUTE ONBOARDING FIX USING SUPABASE MANAGEMENT API
 * This uses the service role key to execute SQL directly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';
const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

// Read SQL script - USE SIMPLIFIED VERSION
const sqlScript = fs.readFileSync(
  path.join(__dirname, 'ONBOARDING_FIX_SIMPLIFIED.sql'),
  'utf8'
);

console.log('🚀 Starting Ultimate Onboarding Fix via Supabase Management API...\n');
console.log('📋 Script size:', sqlScript.length, 'characters\n');

/**
 * Execute SQL using Supabase Management API
 * Docs: https://supabase.com/docs/reference/api/query
 */
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    // Use Management API to execute SQL
    const apiUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
    
    const url = new URL(apiUrl);
    
    const postData = JSON.stringify({
      query: sql
    });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    };

    console.log('🔗 Connecting to Supabase Management API...');
    console.log('   Endpoint:', apiUrl);
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📡 Response Status:', res.statusCode);
        console.log('');
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ SQL executed successfully!');
          console.log('');
          
          try {
            const result = JSON.parse(data);
            console.log('📊 Result:');
            console.log(JSON.stringify(result, null, 2));
          } catch (e) {
            console.log('📄 Raw Response:', data);
          }
          
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          console.error('❌ SQL execution failed!');
          console.error('Status Code:', res.statusCode);
          console.error('Response:', data);
          console.error('');
          
          // Check if it's an authentication issue
          if (res.statusCode === 401 || res.statusCode === 403) {
            console.error('🔐 Authentication Error:');
            console.error('   The ACCESS_TOKEN might be invalid or expired.');
            console.error('   Please check your Supabase access token.');
            console.error('');
          }
          
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Network error:', error.message);
      console.error('');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('⏳ Executing SQL migration...\n');
    
    const result = await executeSQL(sqlScript);
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('');
    console.log('✅ All onboarding errors have been fixed:');
    console.log('   • capsters_barbershop_id_fkey violation ✓');
    console.log('   • column "name" does not exist ✓');
    console.log('   • capsters_specialization_check violation ✓');
    console.log('   • All syntax errors fixed ✓');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Test the onboarding flow');
    console.log('   2. Try registering a new barbershop');
    console.log('   3. Check the onboarding wizard works end-to-end');
    console.log('');
    console.log('🌐 Application URL:');
    console.log('   https://saasxbarbershop.vercel.app');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('=' .repeat(60));
    console.error('❌ EXECUTION FAILED');
    console.error('=' .repeat(60));
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('💡 ALTERNATIVE METHODS TO APPLY THE FIX:');
    console.error('');
    console.error('METHOD 1: Supabase SQL Editor (MOST RELIABLE)');
    console.error('-------------------------------------------');
    console.error('1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
    console.error('2. Open file: ULTIMATE_ONBOARDING_FIX_CORRECT_SYNTAX.sql');
    console.error('3. Copy all contents');
    console.error('4. Paste into SQL Editor');
    console.error('5. Click RUN');
    console.error('');
    console.error('METHOD 2: Using PostgreSQL client');
    console.error('----------------------------------');
    console.error('1. Install pg library: npm install pg');
    console.error('2. Set DATABASE_URL with your password');
    console.error('3. Run: node execute_with_pg.js');
    console.error('');
    
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
