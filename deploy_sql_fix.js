const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySQL() {
  console.log('🚀 Deploying SQL Function Fix to Supabase...\n');
  console.log('=' .repeat(60));
  
  const sql = fs.readFileSync('FIX_SQL_FUNCTION.sql', 'utf8');
  
  console.log('📄 SQL File: FIX_SQL_FUNCTION.sql');
  console.log('📏 Size:', sql.length, 'bytes');
  console.log('=' .repeat(60));
  
  try {
    // Note: Supabase JS client doesn't support raw SQL execution
    // This needs to be done via SQL Editor or supabase CLI
    console.log('\n⚠️  MANUAL ACTION REQUIRED:\n');
    console.log('The SQL fix needs to be executed manually in Supabase SQL Editor.\n');
    console.log('Steps:');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
    console.log('2. Copy the contents of FIX_SQL_FUNCTION.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run" button\n');
    console.log('=' .repeat(60));
    console.log('\n✅ File FIX_SQL_FUNCTION.sql is ready to deploy');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deploySQL().catch(console.error);
