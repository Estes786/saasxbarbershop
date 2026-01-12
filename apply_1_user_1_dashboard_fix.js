require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('\n🔧 APPLYING 1 USER = 1 DASHBOARD FIX\n');
  console.log('='.repeat(80));

  // Read SQL file
  const sqlContent = fs.readFileSync('./FIX_1_USER_1_DASHBOARD_ISOLATED_DATA.sql', 'utf8');
  
  console.log('\n📄 SQL Script:');
  console.log(sqlContent.substring(0, 500) + '...\n');

  console.log('⚠️  IMPORTANT: This script needs to be run in Supabase SQL Editor');
  console.log('    because it requires DDL operations (ALTER TABLE, CREATE POLICY, etc.)');
  console.log('');
  console.log('📋 INSTRUCTIONS:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
  console.log('   2. Paste the contents of: FIX_1_USER_1_DASHBOARD_ISOLATED_DATA.sql');
  console.log('   3. Click "Run" button');
  console.log('   4. Verify success messages');
  console.log('');
  console.log('✅ After applying SQL fix, run: node verify_1_user_1_dashboard.js');
  console.log('');
  console.log('='.repeat(80));
}

main().catch(console.error);
