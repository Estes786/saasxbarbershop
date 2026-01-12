const https = require('https');

const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

// SQL commands to execute
const sqlCommands = [
  `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;`,
  `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'customer';`,
  `UPDATE user_profiles SET full_name = customer_name WHERE full_name IS NULL AND customer_name IS NOT NULL;`,
  `UPDATE user_profiles SET user_role = role WHERE user_role IS NULL AND role IS NOT NULL;`,
  `UPDATE user_profiles SET user_role = 'customer' WHERE user_role IS NULL;`
];

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
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          resolve({ success: false, error: body, status: res.statusCode });
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
  console.log('\n🔧 EXECUTING SQL COMMANDS DIRECTLY\n');
  
  let success = 0;
  let failed = 0;

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    console.log(`\n${i + 1}. Executing: ${sql.substring(0, 70)}...`);
    
    try {
      const result = await executeSQL(sql);
      
      if (result.success) {
        console.log('   ✅ SUCCESS');
        success++;
      } else {
        console.log('   ⚠️  FAILED:', result.status, result.error.substring(0, 100));
        failed++;
      }
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed\n`);
  
  // Verify columns
  console.log('\n🔍 Verifying columns...');
  const verifySQL = `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' ORDER BY ordinal_position;`;
  
  try {
    const result = await executeSQL(verifySQL);
    if (result.success) {
      console.log('✅ Columns verified:', result.data);
    }
  } catch (error) {
    console.log('⚠️  Could not verify columns');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
