require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlFile(filePath) {
  console.log(`\n🔧 EXECUTING SQL FILE: ${filePath}\n`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by statement but keep it simple
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.startsWith('--')) continue;
      
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
      console.log(statement.substring(0, 100) + '...\n');

      try {
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec', {
          sql: statement
        });

        if (error) {
          // Try alternative method: direct query
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            console.log(`   ⚠️ Could not execute via RPC: ${error.message}`);
            console.log(`   ℹ️ This is expected - we need to use Management API`);
          }
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ⚠️ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n\n📊 EXECUTION SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    
    return true;
  } catch (error) {
    console.error(`\n❌ Fatal error reading SQL file:`, error);
    return false;
  }
}

async function executeViaManagementApi(sqlContent) {
  console.log('\n🔧 EXECUTING VIA MANAGEMENT API\n');
  
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', result);
      return false;
    }

    console.log('✅ SQL executed successfully via Management API');
    console.log('Result:', JSON.stringify(result, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Error calling Management API:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 STARTING DATABASE FIX\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔑 Service Role Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.log('🎫 Access Token:', process.env.SUPABASE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
  
  // Read SQL file
  const sqlContent = fs.readFileSync('./fix_database_complete.sql', 'utf8');
  
  // Try Management API first
  console.log('\n\n═══════════════════════════════════════');
  console.log('  METHOD 1: MANAGEMENT API');
  console.log('═══════════════════════════════════════\n');
  
  const apiSuccess = await executeViaManagementApi(sqlContent);
  
  if (apiSuccess) {
    console.log('\n✅ Database fix completed successfully!');
  } else {
    console.log('\n⚠️ Management API failed. You need to:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of fix_database_complete.sql');
    console.log('4. Paste and execute in SQL Editor');
  }
  
  // Verify changes
  console.log('\n\n═══════════════════════════════════════');
  console.log('  VERIFICATION');
  console.log('═══════════════════════════════════════\n');
  
  // Check barbershop_admins table
  const { data: admins, error: adminsError } = await supabase
    .from('barbershop_admins')
    .select('*')
    .limit(5);
  
  if (adminsError) {
    console.log('❌ barbershop_admins table still has issues:', adminsError.message);
  } else {
    console.log('✅ barbershop_admins table is accessible');
    console.log('   Records:', admins?.length || 0);
  }
  
  // Check user_profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, email, user_role, full_name')
    .limit(5);
  
  if (profilesError) {
    console.log('❌ user_profiles error:', profilesError.message);
  } else {
    console.log('✅ user_profiles is working');
    console.log('   Sample records:', profiles?.length || 0);
    profiles?.forEach(p => {
      console.log(`      - ${p.email} (${p.user_role})`);
    });
  }
}

main().catch(console.error);
