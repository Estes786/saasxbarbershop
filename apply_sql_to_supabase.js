const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQL(sqlScript) {
  console.log('🚀 APPLYING SQL SCRIPT TO SUPABASE...\n');
  console.log('=' .repeat(80));
  
  // Split SQL script into individual statements
  const statements = sqlScript
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
    console.log('-'.repeat(80));
    
    // Show first 100 chars of statement
    const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
    console.log(`Preview: ${preview}...`);
    
    try {
      // Use Supabase service role to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        errorCount++;
        
        // Continue on some errors (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist')) {
          console.log('   (Continuing - this is expected for idempotent script)');
        } else {
          console.log('   (This error might cause issues!)');
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      errorCount++;
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RESULTS:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);
  console.log('\n' + '='.repeat(80));
}

// Read SQL file
const sqlFile = process.argv[2] || 'FIX_RLS_USER_PROFILE_NOT_FOUND.sql';
console.log(`\n📖 Reading SQL file: ${sqlFile}\n`);

try {
  const sqlScript = fs.readFileSync(sqlFile, 'utf8');
  applySQL(sqlScript);
} catch (err) {
  console.error('❌ Error reading file:', err.message);
  process.exit(1);
}
