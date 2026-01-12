// Direct SQL execution to Supabase using service key
const fs = require('fs');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function executeSQLDirect() {
  console.log('🚀 Executing SQL via Supabase REST API...\n');

  // Read SQL file
  const sqlContent = fs.readFileSync('./IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql', 'utf8');
  
  // Split into manageable chunks (execute DO blocks separately)
  const doBlocks = sqlContent.match(/DO \$\$[\s\S]*?END \$\$;/gi) || [];
  const createStatements = sqlContent.match(/CREATE [\s\S]*?;/gi) || [];
  const insertStatements = sqlContent.match(/INSERT INTO[\s\S]*?;/gi) || [];
  const deleteStatements = sqlContent.match(/DELETE FROM[\s\S]*?;/gi) || [];
  
  console.log(`📝 Found ${doBlocks.length} DO blocks`);
  console.log(`📝 Found ${createStatements.length} CREATE statements`);
  console.log(`📝 Found ${insertStatements.length} INSERT statements`);
  console.log(`📝 Found ${deleteStatements.length} DELETE statements\n`);

  console.log('⚠️  Direct SQL execution via REST API is limited.');
  console.log('📋 Please execute the SQL manually:');
  console.log('');
  console.log('✨ EASIEST METHOD - Copy & Paste:');
  console.log('━'.repeat(60));
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('');
  console.log('2. Open this file in text editor:');
  console.log('   IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
  console.log('');
  console.log('3. Copy ALL content (Ctrl+A, Ctrl+C)');
  console.log('');
  console.log('4. Paste into SQL Editor and click RUN');
  console.log('');
  console.log('5. You should see success messages in the output');
  console.log('');
  console.log('✅ Expected output:');
  console.log('   - "Table access_keys created successfully"');
  console.log('   - "ACCESS KEY SYSTEM DEPLOYMENT COMPLETE!"');
  console.log('   - Shows 3 access keys (CUSTOMER, CAPSTER, ADMIN)');
  console.log('━'.repeat(60));
  console.log('');
  console.log('💡 ALTERNATIVE - Use psql (if you have database password):');
  console.log('   psql -h aws-0-ap-southeast-1.pooler.supabase.com \\');
  console.log('        -p 6543 \\');
  console.log('        -U postgres.qwqmhvwqeynnyxaecqzw \\');
  console.log('        -d postgres \\');
  console.log('        -f IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
  console.log('');
  console.log('⏳ After execution, run: node verify_access_keys.js');
  console.log('');
}

executeSQLDirect();
