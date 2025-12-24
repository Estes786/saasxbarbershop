const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAccessKeys() {
  console.log('🔍 Checking access_keys table...\n');
  
  const { data: keys, error } = await supabase
    .from('access_keys')
    .select('*');
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log('❌ Table access_keys does NOT exist\n');
      console.log('📝 SQL SCRIPT NEEDS TO BE RUN MANUALLY:');
      console.log('   1. Open Supabase Dashboard: https://qwqmhvwqeynnyxaecqzw.supabase.co');
      console.log('   2. Go to: SQL Editor');
      console.log('   3. Copy & Paste file: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
      console.log('   4. Click "Run"\n');
      return false;
    } else {
      console.log('❌ Error:', error.message);
      return false;
    }
  }
  
  if (keys && keys.length > 0) {
    console.log(`✅ Table exists with ${keys.length} access keys:\n`);
    keys.forEach(key => {
      const usageStr = key.max_uses ? `${key.current_uses}/${key.max_uses}` : `${key.current_uses} (unlimited)`;
      const statusStr = key.is_active ? '✅ Active' : '❌ Inactive';
      console.log(`   🔑 ${key.role.toUpperCase()}: ${key.access_key}`);
      console.log(`      Uses: ${usageStr}`);
      console.log(`      Status: ${statusStr}\n`);
    });
    console.log('✅ ACCESS KEY SYSTEM IS READY!\n');
    return true;
  } else {
    console.log('⚠️  Table exists but NO keys found\n');
    console.log('Need to insert seed data manually or run SQL script.');
    return false;
  }
}

checkAccessKeys();
