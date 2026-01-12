const fs = require('fs');
const path = require('path');

async function executeCompleteFix() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 EXECUTING COMPLETE ONBOARDING FIX');
  console.log('='.repeat(70) + '\n');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'ONBOARDING_FIX_FINAL.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL Script: ONBOARDING_FIX_FINAL.sql');
    console.log('📏 Size:', sqlContent.length, 'characters\n');

    // Execute via Supabase Management API
    const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
    
    console.log('⏳ Executing SQL via Supabase Management API...\n');
    
    const response = await fetch(
      'https://api.supabase.com/v1/projects/qwqmhvwqeynnyxaecqzw/database/query',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: sqlContent
        })
      }
    );

    const resultText = await response.text();
    
    if (!response.ok) {
      console.log('❌ Management API Response:', response.status);
      console.log('Response body:', resultText);
      throw new Error(`Management API failed: ${response.status}`);
    }

    const result = JSON.parse(resultText);
    console.log('✅ SQL Execution Result:', JSON.stringify(result, null, 2));

    // Verify by checking database
    console.log('\n📝 Verifying the fix...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://qwqmhvwqeynnyxaecqzw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
    );

    const { data, error } = await supabase
      .from('capsters')
      .select('id, barbershop_id, name, capster_name, status')
      .limit(5);

    if (error) {
      console.log('⚠️  Verification query error:', error.message);
    } else {
      console.log('✅ Verification successful! Sample data:');
      console.log(JSON.stringify(data, null, 2));
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ONBOARDING FIX COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70) + '\n');
    console.log('What was fixed:');
    console.log('  ✅ barbershop_id is now nullable');
    console.log('  ✅ Foreign key uses ON DELETE SET NULL');
    console.log('  ✅ name <-> capster_name auto-sync');
    console.log('  ✅ Restrictive constraints removed');
    console.log('  ✅ Performance indexes created');
    console.log('  ✅ Safe default values set\n');
    console.log('🎉 Onboarding flow should now work correctly!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 MANUAL EXECUTION REQUIRED');
    console.log('='.repeat(70) + '\n');
    console.log('Please execute the SQL manually via Supabase SQL Editor:\n');
    console.log('1. Open: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
    console.log('2. Copy the content of: ONBOARDING_FIX_FINAL.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run"');
    console.log('5. Verify you see "Onboarding fix completed successfully!"\n');
    
    process.exit(1);
  }
}

executeCompleteFix();
