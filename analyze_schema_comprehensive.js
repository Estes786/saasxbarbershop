require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('\n🔍 COMPREHENSIVE SCHEMA ANALYSIS\n');
  console.log('='.repeat(80));

  // 1. List all tables
  console.log('\n1️⃣  CHECKING ALL TABLES IN public SCHEMA:');
  const { data: tables, error: tablesError } = await supabase
    .rpc('_exec_sql', { 
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    })
    .single();

  if (tablesError) {
    // Try alternative method
    const { data: altTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (altTables) {
      console.log(`✅ Found ${altTables.length} tables:`);
      altTables.forEach(t => console.log(`   - ${t.table_name}`));
    } else {
      console.log('❌ Could not fetch tables');
    }
  }

  // 2. Check user_profiles structure
  console.log('\n2️⃣  CHECKING user_profiles TABLE STRUCTURE:');
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (profileError) {
    console.log(`❌ Error: ${profileError.message}`);
    
    // Try to get column information
    const { data: columns } = await supabase.rpc('_exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
        ORDER BY ordinal_position;
      `
    }).single();
    
    if (columns) {
      console.log('   Available columns:');
      console.log(columns);
    }
  } else {
    console.log(`✅ user_profiles accessible`);
    console.log(`   Total profiles: ${profiles?.length || 0}`);
    if (profiles && profiles[0]) {
      console.log('   Columns:', Object.keys(profiles[0]).join(', '));
    }
  }

  // 3. Check access_keys table
  console.log('\n3️⃣  CHECKING access_keys TABLE:');
  const { data: accessKeys, error: akError } = await supabase
    .from('access_keys')
    .select('*');

  if (akError) {
    console.log(`❌ Error: ${akError.message}`);
  } else {
    console.log(`✅ Found ${accessKeys?.length || 0} access keys`);
    if (accessKeys && accessKeys.length > 0) {
      accessKeys.forEach(ak => {
        console.log(`   - Role: ${ak.role}, Key: ${ak.access_key}, Valid: ${ak.is_valid}, Usage: ${ak.usage_count}/${ak.max_usage || 'unlimited'}`);
      });
    }
  }

  // 4. Check triggers
  console.log('\n4️⃣  CHECKING TRIGGERS:');
  try {
    // We cannot directly query pg_trigger, so just document expected triggers
    console.log('   Expected triggers:');
    console.log('   - on_auth_user_created → auto_create_user_profile()');
    console.log('   - trg_auto_create_barbershop_customer → auto_create_barbershop_customer()');
    console.log('   Note: Cannot verify triggers without superuser access');
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // 5. Count auth users vs profiles
  console.log('\n5️⃣  DATA CONSISTENCY CHECK:');
  const { count: authCount } = await supabase.auth.admin.listUsers();
  const { count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`   Auth users: ${authCount || 0}`);
  console.log(`   User profiles: ${profileCount || 0}`);
  console.log(`   Gap: ${(authCount || 0) - (profileCount || 0)} orphaned users`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Schema analysis complete!\n');
}

main().catch(console.error);
