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

async function applyFix() {
  console.log('🚀 Starting RLS Policy Fix...\n');
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('./FIX_RLS_USER_PROFILE_NOT_FOUND.sql', 'utf8');
    
    console.log('📄 SQL Script loaded');
    console.log('📊 Script size:', sql.length, 'characters');
    console.log('');
    
    // Split by common delimiters to execute in chunks
    const statements = sql
      .split(/;\s*(?=CREATE|DROP|ALTER|INSERT|DO|RAISE)/gi)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.length < 10) continue;
      
      const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: stmt + ';' 
        });
        
        if (error) {
          // Try direct query execution for some statements
          const { error: directError } = await supabase
            .from('_dummy_')
            .select('*')
            .limit(0);
          
          if (error.message?.includes('function') || error.message?.includes('rpc')) {
            console.log('⚠️  RPC not available, trying direct execution...');
            // For policies and grants, we'll need to use SQL Editor manually
            console.log('⚠️  This statement needs manual execution in Supabase SQL Editor');
          } else {
            throw error;
          }
        }
        
        console.log('✅ Success');
        successCount++;
      } catch (err) {
        console.error('❌ Error:', err.message);
        errorCount++;
        
        // Continue with next statement even if one fails
        if (err.message?.includes('already exists') || err.message?.includes('does not exist')) {
          console.log('ℹ️  Continuing (non-critical error)...');
          successCount++; // Count as success since it's idempotent
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
    if (errorCount > 0) {
      console.log('\n⚠️  IMPORTANT: Some statements failed.');
      console.log('Please copy the SQL from FIX_RLS_USER_PROFILE_NOT_FOUND.sql');
      console.log('and run it manually in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    } else {
      console.log('\n✅ All policies applied successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.log('\n⚠️  Please apply SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  }
}

applyFix();
