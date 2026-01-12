#!/usr/bin/env node
/**
 * Apply Phase 1 Completion - Simple statements
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(sql)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function applyPhase1Completion() {
  console.log('\n🚀 COMPLETING PHASE 1: MULTI-LOCATION SUPPORT\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Check if column already exists
    console.log('\n1️⃣  Checking if preferred_branch_id exists...');
    const { data: checkData, error: checkError } = await supabase
      .from('customers')
      .select('id, preferred_branch_id')
      .limit(1);
    
    if (!checkError && checkData) {
      console.log('   ✅ Column preferred_branch_id already exists!');
      console.log('   📊 Phase 1 is already complete\n');
      return true;
    }

    console.log('   ⚠️  Column not found, will add it now...\n');

    // Step 2: Add column using raw SQL
    console.log('2️⃣  Adding preferred_branch_id column...');
    
    // Use psql via curl to Management API
    const https = require('https');
    const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
    const projectRef = 'qwqmhvwqeynnyxaecqzw';
    
    const sql1 = `ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_branch_id UUID;`;
    
    await executeSQLViaHTTPS(projectRef, accessToken, sql1);
    console.log('   ✅ Column added\n');
    
    // Step 3: Add foreign key
    console.log('3️⃣  Adding foreign key constraint...');
    const sql2 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_customer_preferred_branch'
        ) THEN
          ALTER TABLE customers ADD CONSTRAINT fk_customer_preferred_branch 
            FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `;
    
    await executeSQLViaHTTPS(projectRef, accessToken, sql2);
    console.log('   ✅ Foreign key added\n');
    
    // Step 4: Add index
    console.log('4️⃣  Adding index...');
    const sql3 = `CREATE INDEX IF NOT EXISTS idx_customers_preferred_branch_id ON customers(preferred_branch_id);`;
    
    await executeSQLViaHTTPS(projectRef, accessToken, sql3);
    console.log('   ✅ Index created\n');
    
    console.log('=' .repeat(60));
    console.log('\n🎉 PHASE 1 COMPLETION SUCCESS!\n');
    console.log('✅ All database schema changes applied');
    console.log('✅ Multi-location support fully enabled\n');
    console.log('📝 Next: Run verification');
    console.log('   👉 node verify_phase1_status.js\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    console.log('\n📝 MANUAL STEPS REQUIRED:');
    console.log('=' .repeat(60));
    console.log('\nRun these commands in Supabase SQL Editor:\n');
    console.log('-- Add column');
    console.log('ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_branch_id UUID;\n');
    console.log('-- Add foreign key');
    console.log(`ALTER TABLE customers ADD CONSTRAINT fk_customer_preferred_branch 
  FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL;\n`);
    console.log('-- Add index');
    console.log('CREATE INDEX IF NOT EXISTS idx_customers_preferred_branch_id ON customers(preferred_branch_id);\n');
    
    return false;
  }
}

function executeSQLViaHTTPS(projectRef, accessToken, sql) {
  return new Promise((resolve, reject) => {
    const https = require('https');
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
          resolve(responseData);
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

applyPhase1Completion()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
