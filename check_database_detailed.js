const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDatabase() {
  console.log('\n🔍 PEMERIKSAAN DATABASE MENYELURUH\n');
  
  // 1. Cek tabel user_profiles
  console.log('1️⃣ Checking user_profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (profilesError) {
    console.error('❌ user_profiles error:', profilesError);
  } else {
    console.log('✅ user_profiles accessible');
    console.log('   Columns:', Object.keys(profiles[0] || {}));
  }

  // 2. Cek RLS policies untuk user_profiles
  console.log('\n2️⃣ Checking RLS policies for user_profiles...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', { 
      query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
              FROM pg_policies 
              WHERE tablename = 'user_profiles';` 
    })
    .catch(async () => {
      // Fallback: use direct query
      return await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_profiles');
    });

  if (policiesError) {
    console.error('❌ Cannot check policies:', policiesError.message);
  } else {
    console.log('✅ RLS Policies:', policies?.length || 0);
  }

  // 3. Cek apakah RLS enabled
  console.log('\n3️⃣ Checking RLS status...');
  const { data: rlsStatus } = await supabase
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('tablename', 'user_profiles')
    .single()
    .catch(() => ({ data: null }));
  
  if (rlsStatus) {
    console.log('✅ RLS Status:', rlsStatus.rowsecurity ? 'ENABLED ✓' : 'DISABLED ✗');
  }

  // 4. Test direct insert dengan service role
  console.log('\n4️⃣ Testing direct insert with service_role...');
  const testUserId = 'test-' + Date.now();
  const { data: insertTest, error: insertError } = await supabase
    .from('user_profiles')
    .insert({
      id: testUserId,
      email: `test${Date.now()}@example.com`,
      full_name: 'Test User',
      user_role: 'customer'
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Direct insert FAILED:', insertError);
  } else {
    console.log('✅ Direct insert SUCCESS');
    // Cleanup
    await supabase.from('user_profiles').delete().eq('id', testUserId);
  }

  // 5. Cek auth.users
  console.log('\n5️⃣ Checking auth.users accessibility...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Cannot access auth.users:', authError);
  } else {
    console.log('✅ auth.users accessible, total users:', authUsers.users.length);
  }

  // 6. Cek trigger function
  console.log('\n6️⃣ Checking trigger functions...');
  const { data: triggers } = await supabase
    .from('pg_trigger')
    .select('*')
    .like('tgname', '%user%')
    .catch(() => ({ data: [] }));
  
  console.log('✅ Found triggers:', triggers?.length || 0);
}

checkDatabase().then(() => {
  console.log('\n✅ Database check complete\n');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
