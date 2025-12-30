/**
 * VERIFY DATABASE SCHEMA AFTER MIGRATION
 */

const https = require('https');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

console.log('🔍 Verifying Database Schema After Migration...\n');

const queries = [
  {
    name: 'Check capsters columns',
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'capsters'
      ORDER BY column_name
    `
  },
  {
    name: 'Check capsters constraints',
    query: `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'capsters'
      ORDER BY constraint_name
    `
  },
  {
    name: 'Check barbershop_profiles table',
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'barbershop_profiles'
      ORDER BY column_name
    `
  },
  {
    name: 'Check sync trigger',
    query: `
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE trigger_name = 'sync_capster_name_trigger'
    `
  },
  {
    name: 'Check capsters data sample',
    query: `SELECT id, capster_name, name, specialization, phone FROM capsters LIMIT 3`
  }
];

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
    const url = new URL(apiUrl);
    
    const postData = JSON.stringify({ query });
    
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  for (const check of queries) {
    console.log(`📌 ${check.name}`);
    console.log('=' .repeat(60));
    
    try {
      const result = await executeQuery(check.query);
      
      if (Array.isArray(result)) {
        if (result.length > 0) {
          console.table(result);
        } else {
          console.log('   (No rows returned)\n');
        }
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('   ERROR:', error.message);
    }
    
    console.log('');
  }
  
  console.log('=' .repeat(60));
  console.log('✅ VERIFICATION COMPLETE!');
  console.log('=' .repeat(60));
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('   1. Test onboarding flow at: https://saasxbarbershop.vercel.app');
  console.log('   2. Try registering a new barbershop');
  console.log('   3. Complete all 5 onboarding steps');
  console.log('   4. Check if errors are resolved');
  console.log('');
}

main().catch(console.error);
