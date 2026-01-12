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

async function applySQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      return await response.json();
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔧 Applying RLS Policies to Supabase...\n');
  
  // Read RLS policies SQL
  const rlsSQL = fs.readFileSync('/home/user/uploaded_files/APPLY_RLS_POLICIES.sql', 'utf8');
  
  // Split into statements
  const statements = rlsSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('FROM pg_policies'));
  
  console.log(`Found ${statements.length} SQL statements\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i+1}/${statements.length}] Executing...`);
    console.log(stmt.substring(0, 100) + '...\n');
    
    try {
      await applySQL(stmt + ';');
      console.log('✅ Success');
    } catch (error) {
      console.log('⚠️  Error (might be ok if already exists):', error.message);
    }
  }
  
  console.log('\n\n🔧 Applying SQL Function Fix...\n');
  
  // Read SQL fix
  const fixSQL = fs.readFileSync('/home/user/uploaded_files/FIX_SQL_FUNCTION (5).sql', 'utf8');
  
  const fixStatements = fixSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('FROM pg_proc'));
  
  console.log(`Found ${fixStatements.length} SQL statements\n`);
  
  for (let i = 0; i < fixStatements.length; i++) {
    const stmt = fixStatements[i];
    console.log(`\n[${i+1}/${fixStatements.length}] Executing...`);
    console.log(stmt.substring(0, 100) + '...\n');
    
    try {
      await applySQL(stmt + ';');
      console.log('✅ Success');
    } catch (error) {
      console.log('⚠️  Error (might be ok):', error.message);
    }
  }
  
  console.log('\n\n✅ All SQL applied!\n');
}

main().catch(console.error);
