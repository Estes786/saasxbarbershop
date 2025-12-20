const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase dengan service role key untuk bypass RLS
const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function execSQL(query) {
  try {
    // Method 1: Try using direct query
    const { data, error, status, statusText } = await supabase
      .rpc('exec', { sql: query })
      .select();
    
    return { data, error, status, statusText };
  } catch (err) {
    return { error: err, status: 500 };
  }
}

async function main() {
  console.log('🔧 Applying SQL Fixes Directly to Supabase...\n');
  console.log('=' .repeat(70));
  
  // Read SQL file
  const sqlContent = fs.readFileSync('apply_all_fixes.sql', 'utf8');
  
  // Split into individual statements (crude but effective)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => 
      s.length > 0 && 
      !s.startsWith('--') && 
      !s.startsWith('SELECT') && // Skip verification queries for now
      !s.includes('FROM pg_')
    );
  
  console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
    
    console.log(`\n[${i+1}/${statements.length}] ${preview}...`);
    
    const result = await execSQL(stmt + ';');
    
    if (result.error) {
      console.log(`  ⚠️  ${result.error.message || JSON.stringify(result.error)}`);
    } else {
      console.log(`  ✅ Success`);
    }
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n✅ SQL Application Attempted!\n');
  console.log('⚠️  Note: Some RPC calls might fail if exec function doesn\'t exist.');
  console.log('📌 If you see errors above, please apply apply_all_fixes.sql manually');
  console.log('   via Supabase SQL Editor at:');
  console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
}

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.log('\n📌 Please apply apply_all_fixes.sql manually via Supabase SQL Editor');
  process.exit(1);
});
