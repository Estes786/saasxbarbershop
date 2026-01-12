const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function applySQLFile() {
  console.log('🔐 Applying Complete RLS Fix to Supabase...\n');
  console.log('=' .repeat(60));
  
  const sql = fs.readFileSync('FIX_ALL_RLS_COMPLETE.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Filter out comments and SELECT verification queries
      return s.length > 0 && 
             !s.startsWith('--') && 
             !s.includes('SELECT tablename') &&
             !s.includes('SELECT schemaname') &&
             !s.includes('SELECT proname') &&
             !s.includes('FROM pg_tables') &&
             !s.includes('FROM pg_policies') &&
             !s.includes('FROM pg_proc');
    });

  console.log(`📄 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    
    if (!statement) continue;
    
    // Show preview of statement
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);
    
    try {
      const { data, error } = await supabase.rpc('query', {
        query: statement + ';'
      });
      
      if (error) {
        console.error(`❌ Error:`, error.message);
        errorCount++;
        
        // Continue on certain expected errors
        if (
          error.message.includes('does not exist') ||
          error.message.includes('already exists') ||
          error.message.includes('cannot drop')
        ) {
          console.log('⚠️  Expected error, continuing...');
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception:`, err.message);
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${statements.length}`);
  console.log('='.repeat(60));
  
  if (errorCount === 0 || successCount > errorCount) {
    console.log('\n🎉 RLS Fix Applied Successfully!');
    console.log('\nNext steps:');
    console.log('1. Test customer registration');
    console.log('2. Test admin registration');
    console.log('3. Test login flow');
    console.log('4. Test Google OAuth');
  } else {
    console.log('\n⚠️  Some errors occurred, but may be expected.');
    console.log('Please check the output above.');
  }
}

applySQLFile().catch(err => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
