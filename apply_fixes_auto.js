const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFixes() {
  console.log('🔐 Applying Authentication Fixes to Supabase...\n');
  
  // Read SQL file
  const sql = fs.readFileSync('APPLY_ALL_FIXES.sql', 'utf8');
  
  // Split into statements (skip comments and verification queries)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => 
      s.length > 0 && 
      !s.startsWith('--') && 
      !s.includes('FROM pg_tables') && 
      !s.includes('FROM pg_policies') &&
      !s.includes('FROM pg_proc')
    )
    .map(s => s + ';');

  console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const shortStatement = statement.substring(0, 80).replace(/\s+/g, ' ') + '...';
    
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${shortStatement}`);
    
    try {
      const { data, error } = await supabase.rpc('exec', { sql: statement });
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
        failCount++;
      } else {
        console.log(`✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📋 Total: ${statements.length}`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\n⚠️  Some statements failed. You may need to apply them manually via SQL Editor:');
    console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  } else {
    console.log('\n✅ All fixes applied successfully!');
  }
}

applyFixes().catch(console.error);
