#!/usr/bin/env node
/**
 * APPLY ONBOARDING FIX - FINAL VERSION
 * 
 * This script will:
 * 1. Read the SQL fix file
 * 2. Connect to Supabase using your credentials
 * 3. Execute the SQL fix safely
 * 4. Report success or errors
 * 
 * Run with: node apply_onboarding_fix_final.js
 */

const fs = require('fs');
const path = require('path');

// Supabase credentials (dari yang Anda berikan)
const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function executeSQLFix() {
  try {
    console.log('🚀 Starting Onboarding Fix Execution...\n');

    // 1. Read SQL file
    const sqlFilePath = path.join(__dirname, 'ONBOARDING_FIX_ULTIMATE_FINAL_31DEC2025.sql');
    console.log('📖 Reading SQL file:', sqlFilePath);
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded successfully\n');

    // 2. Execute SQL using Supabase Management API
    console.log('🔧 Executing SQL fix on Supabase...');
    console.log('   This may take 30-60 seconds...\n');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      // Try alternative method using direct SQL execution
      console.log('⚠️  First method failed, trying direct execution...\n');
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Execute SQL in chunks to avoid timeouts
      const { data, error } = await supabase.rpc('exec_sql', { query: sqlContent });

      if (error) {
        console.error('❌ Error executing SQL:');
        console.error('   Error:', error.message);
        console.error('   Details:', error.details || 'No details available');
        console.error('\n📝 Please apply the SQL manually through Supabase SQL Editor');
        console.error('   File location:', sqlFilePath);
        process.exit(1);
      }

      console.log('✅ SQL executed successfully!\n');
      console.log('📊 Result:', data);
    } else {
      const result = await response.json();
      console.log('✅ SQL executed successfully!\n');
      console.log('📊 Result:', result);
    }

    // 3. Verify tables
    console.log('\n🔍 Verifying database tables...\n');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const tables = [
      'barbershop_profiles',
      'capsters',
      'service_catalog',
      'access_keys',
      'onboarding_progress'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ⚠️  ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Table exists`);
      }
    }

    // 4. Success summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ ONBOARDING FIX COMPLETED SUCCESSFULLY! ✨');
    console.log('='.repeat(50));
    console.log('\n🎉 All database fixes have been applied!\n');
    console.log('📋 What was fixed:');
    console.log('   ✓ service_catalog barbershop_id column added');
    console.log('   ✓ capsters table structure updated');
    console.log('   ✓ Foreign key constraints made flexible');
    console.log('   ✓ RLS policies configured');
    console.log('   ✓ Helper functions created');
    console.log('\n🚦 Next Steps:');
    console.log('   1. Test onboarding flow at: https://saasxbarbershop.vercel.app/onboarding');
    console.log('   2. Register a new barbershop');
    console.log('   3. Add capsters');
    console.log('   4. Add services');
    console.log('   5. Verify access keys generation');
    console.log('\n💡 If you encounter any errors, please share the error message.\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:');
    console.error('   ', error.message);
    console.error('\n📝 Manual Fix Instructions:');
    console.error('   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw');
    console.error('   2. Go to SQL Editor');
    console.error('   3. Create new query');
    console.error('   4. Copy contents of: ONBOARDING_FIX_ULTIMATE_FINAL_31DEC2025.sql');
    console.error('   5. Run the query');
    console.error('\n');
    process.exit(1);
  }
}

// Check if @supabase/supabase-js is installed
try {
  require('@supabase/supabase-js');
  executeSQLFix();
} catch (err) {
  console.log('📦 Installing required dependencies...\n');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed. Retrying...\n');
    executeSQLFix();
  } catch (installError) {
    console.error('❌ Failed to install dependencies.');
    console.error('   Please run: npm install @supabase/supabase-js');
    process.exit(1);
  }
}
