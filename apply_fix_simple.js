#!/usr/bin/env node

/**
 * Apply fix dengan metode sederhana - satu-satu statement
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔧 APPLYING ONBOARDING FIX - SIMPLE METHOD\n');
  console.log('=' .repeat(80));

  try {
    // Check current state first
    console.log('\n1️⃣ Checking current schema...');
    const { data: currentData } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(1);

    if (currentData && currentData.length > 0) {
      const columns = Object.keys(currentData[0]);
      console.log(`   Current columns in service_catalog: ${columns.length}`);
      
      if (columns.includes('barbershop_id')) {
        console.log('   ✅ barbershop_id already exists!');
        console.log('\n✅ NO FIX NEEDED - Schema is already correct!\n');
        return true;
      } else {
        console.log('   ❌ barbershop_id is missing');
        console.log('   Available columns:', columns.join(', '));
      }
    }

    console.log('\n2️⃣ Attempting to add barbershop_id column...');
    console.log('   ⚠️  Note: This requires database admin privileges');
    console.log('');

    // Try using the REST API to execute SQL
    const alterTableSQL = `
      ALTER TABLE service_catalog 
      ADD COLUMN IF NOT EXISTS barbershop_id UUID 
      REFERENCES barbershop_profiles(id) ON DELETE CASCADE;
    `;

    console.log('   SQL to execute:');
    console.log('   ' + alterTableSQL.trim());
    console.log('');

    // Try to execute via fetch to REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: alterTableSQL })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Cannot execute SQL via API: ${response.status}`);
      console.log(`   ${error}`);
      console.log('');
      throw new Error('Cannot execute ALTER TABLE via REST API');
    }

    console.log('   ✅ SQL executed successfully!');

    // Verify
    console.log('\n3️⃣ Verifying the fix...');
    const { data: verifyData } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(1);

    if (verifyData && verifyData.length > 0) {
      const newColumns = Object.keys(verifyData[0]);
      if (newColumns.includes('barbershop_id')) {
        console.log('   ✅ barbershop_id column added successfully!');
        return true;
      } else {
        console.log('   ❌ barbershop_id still not found');
        return false;
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n' + '=' .repeat(80));
    console.log('⚠️  AUTOMATIC FIX FAILED');
    console.log('=' .repeat(80));
    console.log('\n📝 MANUAL ACTION REQUIRED:\n');
    console.log('Please follow instructions in: MANUAL_FIX_INSTRUCTIONS.md');
    console.log('\nQuick fix:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw');
    console.log('2. Click: SQL Editor');
    console.log('3. Run this SQL:');
    console.log('');
    console.log('   ALTER TABLE service_catalog');
    console.log('   ADD COLUMN IF NOT EXISTS barbershop_id UUID');
    console.log('   REFERENCES barbershop_profiles(id) ON DELETE CASCADE;');
    console.log('');
    return false;
  }
}

// Execute
applyFix().then(success => {
  if (success) {
    console.log('\n' + '=' .repeat(80));
    console.log('✅ FIX APPLIED SUCCESSFULLY!');
    console.log('=' .repeat(80));
    console.log('\n🎯 Next Steps:');
    console.log('   1. npm run build');
    console.log('   2. npm run dev');
    console.log('   3. Test onboarding flow at http://localhost:3000');
    console.log('');
    process.exit(0);
  } else {
    console.log('\nSee MANUAL_FIX_INSTRUCTIONS.md for detailed steps.');
    process.exit(1);
  }
});
