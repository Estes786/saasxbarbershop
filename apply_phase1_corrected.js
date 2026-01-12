#!/usr/bin/env node
/**
 * Apply Phase 1 Completion - CORRECTED for user_profiles
 */

const https = require('https');

const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
const projectRef = 'qwqmhvwqeynnyxaecqzw';

function executeSQLViaHTTPS(sql) {
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
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
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

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🚀 COMPLETING PHASE 1: MULTI-LOCATION SUPPORT\n');
  console.log('=' .repeat(60));
  console.log('\n📝 Target: Add preferred_branch_id to user_profiles\n');
  
  try {
    // Step 1: Add column
    console.log('1️⃣  Adding preferred_branch_id column...');
    const sql1 = `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_branch_id UUID;`;
    
    await executeSQLViaHTTPS(sql1);
    console.log('   ✅ Column added\n');
    
    // Step 2: Add foreign key
    console.log('2️⃣  Adding foreign key constraint...');
    const sql2 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_user_preferred_branch'
        ) THEN
          ALTER TABLE user_profiles ADD CONSTRAINT fk_user_preferred_branch 
            FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `;
    
    await executeSQLViaHTTPS(sql2);
    console.log('   ✅ Foreign key added\n');
    
    // Step 3: Add index
    console.log('3️⃣  Adding index...');
    const sql3 = `CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_branch_id ON user_profiles(preferred_branch_id);`;
    
    await executeSQLViaHTTPS(sql3);
    console.log('   ✅ Index created\n');
    
    console.log('=' .repeat(60));
    console.log('\n🎉 PHASE 1 COMPLETION SUCCESS!\n');
    console.log('✅ preferred_branch_id added to user_profiles');
    console.log('✅ Foreign key constraint added');
    console.log('✅ Index created for performance');
    console.log('✅ Multi-location support fully enabled\n');
    console.log('📝 Next: Run verification');
    console.log('   👉 node verify_phase1_final.js\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    console.log('\n📝 MANUAL STEPS (Copy to Supabase SQL Editor):');
    console.log('=' .repeat(60));
    console.log('\n-- Add column');
    console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_branch_id UUID;\n');
    console.log('-- Add foreign key');
    console.log(`ALTER TABLE user_profiles ADD CONSTRAINT fk_user_preferred_branch 
  FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL;\n`);
    console.log('-- Add index');
    console.log('CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_branch_id ON user_profiles(preferred_branch_id);\n');
    
    return false;
  }
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
