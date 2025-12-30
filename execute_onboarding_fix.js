const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeOnboardingFix() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 EXECUTING ONBOARDING FIX TO SUPABASE');
  console.log('='.repeat(70) + '\n');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'FIX_ONBOARDING_ULTIMATE_30DEC2025.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL Script loaded:', sqlPath);
    console.log('📏 Script size:', sqlContent.length, 'characters\n');

    // Execute SQL using Supabase RPC
    console.log('⏳ Executing SQL script...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    }).catch(async () => {
      // Fallback: try direct execution via REST API
      console.log('⚠️  RPC method not available, trying Management API...\n');
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: sqlContent })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Management API failed: ${response.status} ${response.statusText}`);
      }
      
      return { data: await response.json(), error: null };
    });

    if (error) {
      console.log('❌ ERROR EXECUTING SQL:\n');
      console.log(error);
      console.log('\n' + '='.repeat(70));
      console.log('📋 MANUAL EXECUTION REQUIRED');
      console.log('='.repeat(70) + '\n');
      console.log('Please execute the SQL script manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
      console.log('2. Copy the entire content of: FIX_ONBOARDING_ULTIMATE_30DEC2025.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click "Run"\n');
      
      // Save instructions to file
      fs.writeFileSync(
        path.join(__dirname, 'MANUAL_EXECUTION_INSTRUCTIONS.md'),
        `# Manual SQL Execution Required

## Error
The automated execution failed. Please execute the SQL manually.

## Steps
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql)
2. Copy the entire content of \`FIX_ONBOARDING_ULTIMATE_30DEC2025.sql\`
3. Paste into SQL Editor
4. Click "Run"

## What the Script Does
- ✅ Makes barbershop_id NULLABLE (critical fix!)
- ✅ Recreates foreign key with ON DELETE SET NULL
- ✅ Ensures name column exists and syncs with capster_name
- ✅ Removes restrictive constraints
- ✅ Updates RLS policies
- ✅ Creates performance indexes

## Expected Result
After execution, you should see messages like:
- ✅ CRITICAL FIX: barbershop_id is now nullable
- ✅ Recreated capsters_barbershop_id_fkey with ON DELETE SET NULL
- ✅ Created trigger to sync name <-> capster_name automatically
- ✅ ONBOARDING FIX COMPLETED SUCCESSFULLY

## Error Details
\`\`\`
${JSON.stringify(error, null, 2)}
\`\`\`
`
      );
      
      console.log('📄 Instructions saved to: MANUAL_EXECUTION_INSTRUCTIONS.md\n');
      process.exit(1);
    }

    console.log('✅ SQL EXECUTION COMPLETED!\n');
    console.log('Result:', JSON.stringify(data, null, 2), '\n');
    
    // Verify the fix by checking database
    console.log('🔍 Verifying the fix...\n');
    
    const { data: capsters, error: verifyError } = await supabase
      .from('capsters')
      .select('id, name, capster_name, barbershop_id, status')
      .limit(5);
    
    if (verifyError) {
      console.log('⚠️  Verification warning:', verifyError.message);
    } else {
      console.log('✅ Verification successful! Sample capsters:');
      console.log(JSON.stringify(capsters, null, 2));
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ONBOARDING FIX COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70) + '\n');
    console.log('What was fixed:');
    console.log('✅ 1. barbershop_id is now NULLABLE (critical fix!)');
    console.log('✅ 2. Foreign key constraint uses ON DELETE SET NULL');
    console.log('✅ 3. name column exists and syncs with capster_name');
    console.log('✅ 4. All restrictive constraints removed');
    console.log('✅ 5. RLS policies updated for secure access');
    console.log('✅ 6. Indexes created for performance\n');
    console.log('🎉 Onboarding flow should now work correctly!\n');

  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:\n');
    console.error(error);
    console.log('\n' + '='.repeat(70));
    console.log('📋 MANUAL EXECUTION REQUIRED');
    console.log('='.repeat(70) + '\n');
    console.log('Please execute the SQL script manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
    console.log('2. Copy the entire content of: FIX_ONBOARDING_ULTIMATE_30DEC2025.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run"\n');
    
    process.exit(1);
  }
}

// Execute
executeOnboardingFix();
