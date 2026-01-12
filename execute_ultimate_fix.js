/**
 * EXECUTE ULTIMATE ONBOARDING FIX
 * This script will execute the comprehensive SQL fix to resolve the foreign key error
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';
const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';

async function executeFix() {
  console.log('🚀 EXECUTING ULTIMATE ONBOARDING FIX\n');
  console.log('=' .repeat(80));
  
  try {
    // Read SQL file
    const sqlContent = fs.readFileSync('./ULTIMATE_ONBOARDING_FIX_30DEC2025.sql', 'utf8');
    
    // Split into individual statements (basic split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => 
        s.length > 0 && 
        !s.startsWith('--') && 
        !s.match(/^RAISE\s+(NOTICE|WARNING)/i)
      );

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute using Supabase Management API
    const url = `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`;
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('⚡ Executing SQL fix...\n');

    // Execute full SQL as one query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      // If exec_sql doesn't exist, execute via REST API
      console.log('⚠️  exec_sql function not available, using alternative method...\n');
      
      // Try executing via client
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql: sqlContent })
      });

      if (!response.ok) {
        console.log('⚠️  Cannot execute via API, manual execution required\n');
        console.log('📋 INSTRUCTIONS FOR MANUAL EXECUTION:\n');
        console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy the contents of: ULTIMATE_ONBOARDING_FIX_30DEC2025.sql');
        console.log('4. Paste and run in SQL Editor');
        console.log('5. Check for success messages\n');
        
        console.log('=' .repeat(80));
        console.log('📄 SQL FILE LOCATION:');
        console.log('./ULTIMATE_ONBOARDING_FIX_30DEC2025.sql\n');
        
        return;
      }

      const result = await response.json();
      console.log('✅ Execution result:', result);
    } else {
      console.log('✅ SQL executed successfully!');
      console.log('Result:', data);
    }

    // Verify fix
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VERIFYING FIX...\n');

    const { data: barbershops } = await supabase
      .from('barbershops')
      .select('id, name, owner_id');
    console.log('✅ Total barbershops:', barbershops?.length || 0);

    const { data: capsters } = await supabase
      .from('capsters')
      .select('id, name, barbershop_id')
      .is('barbershop_id', null);
    console.log('✅ Orphaned capsters (should be 0):', capsters?.length || 0);

    const { data: allCapsters } = await supabase
      .from('capsters')
      .select('id, name, barbershop_id');
    console.log('✅ Total capsters:', allCapsters?.length || 0);

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE!\n');

    if (capsters && capsters.length === 0) {
      console.log('🎉 SUCCESS! All capsters now have valid barbershop_id');
    } else {
      console.log('⚠️  Warning: Still have orphaned capsters');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 MANUAL EXECUTION REQUIRED');
    console.log('Please run ULTIMATE_ONBOARDING_FIX_30DEC2025.sql in Supabase SQL Editor');
  }
}

executeFix();
