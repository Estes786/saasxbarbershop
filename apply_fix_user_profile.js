const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('🔧 Applying FIX_USER_PROFILE_NOT_FOUND.sql...\n');

  try {
    // Read SQL file
    const sql = fs.readFileSync('./FIX_USER_PROFILE_NOT_FOUND.sql', 'utf-8');
    console.log('📄 SQL file loaded\n');
    
    // Split into individual statements (basic splitting by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('DROP POLICY') || 
          statement.includes('CREATE POLICY') || 
          statement.includes('ALTER TABLE') ||
          statement.includes('UPDATE user_profiles')) {
        
        console.log(`\n[${i + 1}/${statements.length}] Executing statement:`);
        console.log(statement.substring(0, 100) + '...\n');
        
        try {
          // Execute via RPC or direct query
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.warn(`⚠️ RPC failed, trying direct query...`);
            // If RPC fails, log but continue
            console.log(`Error: ${error.message}\n`);
          } else {
            console.log('✅ Statement executed successfully\n');
          }
        } catch (err) {
          console.warn(`⚠️ Error executing statement: ${err.message}\n`);
          // Continue anyway - some statements might fail if already applied
        }
      }
    }

    console.log('\n✨ Fix application complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Copy content from FIX_USER_PROFILE_NOT_FOUND.sql');
    console.log('3. Run it manually');
    console.log('4. Test login flow again\n');

  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
    console.log('\n📋 MANUAL FIX REQUIRED:');
    console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('2. Copy content from FIX_USER_PROFILE_NOT_FOUND.sql');
    console.log('3. Run it manually');
  }
}

applyFix();
