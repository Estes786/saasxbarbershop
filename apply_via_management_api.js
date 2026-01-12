#!/usr/bin/env node
/**
 * Apply Phase 1 SQL using Supabase Management API
 */

const fs = require('fs');
const https = require('https');

const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
const projectRef = 'qwqmhvwqeynnyxaecqzw';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🚀 APPLYING PHASE 1 COMPLETION VIA MANAGEMENT API\n');
  console.log('=' .repeat(60));
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('./complete_phase1.sql', 'utf8');
    console.log('\n📄 SQL script loaded');
    console.log(`   Size: ${sql.length} characters`);
    console.log(`   Project: ${projectRef}\n`);
    
    console.log('⏳ Executing SQL via Management API...\n');
    
    const result = await executeSQL(sql);
    
    console.log('✅ SQL executed successfully!\n');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 PHASE 1 COMPLETION APPLIED!\n');
    console.log('✅ Next: Run verification');
    console.log('   👉 node verify_phase1_status.js\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\n📝 FALLBACK: MANUAL APPLICATION');
    console.log('=' .repeat(60));
    console.log('\n1️⃣  Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('\n2️⃣  Copy this SQL:\n');
    console.log('---START SQL---');
    const sql = fs.readFileSync('./complete_phase1.sql', 'utf8');
    console.log(sql);
    console.log('---END SQL---');
    console.log('\n3️⃣  Click "Run" button\n');
    console.log('4️⃣  Verify: node verify_phase1_status.js\n');
    
    return false;
  }
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
