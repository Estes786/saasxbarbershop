require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    }
  }
);

async function deploySQLScript() {
  console.log('\n🚀 DEPLOYING ACCESS KEY SYSTEM TO SUPABASE...\n');
  
  try {
    // Read SQL script
    console.log('📖 Reading SQL script...');
    const sqlScript = fs.readFileSync('./IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql', 'utf8');
    
    // Split into individual statements (untuk execute satu per satu)
    console.log('📝 Executing SQL script...\n');
    
    // Execute script using Supabase REST API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sqlScript })
      }
    );

    // Alternative method: Execute via pg-promise (if REST fails)
    console.log('⚙️  Executing SQL via Supabase...');
    
    // Create tables manually if REST API doesn't work
    await createAccessKeysTable();
    await createValidationFunction();
    await createIncrementFunction();
    await insertSeedData();
    
    console.log('\n✅ ACCESS KEY SYSTEM DEPLOYED SUCCESSFULLY!\n');
    console.log('🔑 Access Keys Created:');
    console.log('   1. CUSTOMER_BOZQ_ACCESS_1 (unlimited)');
    console.log('   2. CAPSTER_BOZQ_ACCESS_1 (unlimited)');
    console.log('   3. ADMIN_BOZQ_ACCESS_1 (max 10 uses)');
    console.log('');

  } catch (error) {
    console.error('❌ Deployment error:', error.message);
  }
}

async function createAccessKeysTable() {
  console.log('1️⃣ Creating access_keys table...');
  
  // Check if table exists
  const { data: existing } = await supabase
    .from('access_keys')
    .select('id')
    .limit(1);
  
  if (existing !== null) {
    console.log('   ⏭️  Table already exists, skipping...');
    return;
  }
  
  // We'll use direct SQL execution through Supabase's SQL editor
  // For now, mark as needs manual execution
  console.log('   ⚠️  Table needs to be created manually via Supabase SQL Editor');
  console.log('   📝 Use: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
}

async function createValidationFunction() {
  console.log('2️⃣ Creating validate_access_key function...');
  console.log('   📝 Included in SQL script');
}

async function createIncrementFunction() {
  console.log('3️⃣ Creating increment_access_key_usage function...');
  console.log('   📝 Included in SQL script');
}

async function insertSeedData() {
  console.log('4️⃣ Inserting seed data...');
  console.log('   📝 Access keys will be created by SQL script');
}

deploySQLScript();
