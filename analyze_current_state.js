require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeCurrentState() {
  console.log('🔍 ANALYZING SUPABASE CURRENT STATE\n');
  
  try {
    // 1. Check tables
    console.log('1️⃣ Checking Tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('   ❌ Error checking tables:', tablesError.message);
    } else {
      console.log('   ✅ Tables found:', tables?.map(t => t.table_name) || []);
    }

    // 2. Check user_profiles schema
    console.log('\n2️⃣ Checking user_profiles schema...');
    const { data: profileCols, error: profileError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'user_profiles' AND table_schema = 'public'
              ORDER BY ordinal_position;` 
      });
    
    if (profileError) {
      console.log('   ⚠️ Cannot check schema via RPC:', profileError.message);
      // Try direct query
      const { data: profiles, error: directError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.log('   ❌ user_profiles table error:', directError.message);
      } else {
        console.log('   ✅ user_profiles accessible, sample data:', profiles);
      }
    } else {
      console.log('   ✅ user_profiles columns:', profileCols);
    }

    // 3. Check RLS policies
    console.log('\n3️⃣ Checking RLS Policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT schemaname, tablename, policyname, roles, cmd, qual 
              FROM pg_policies 
              WHERE schemaname = 'public'
              ORDER BY tablename, policyname;`
      });
    
    if (policiesError) {
      console.log('   ⚠️ Cannot check policies via RPC:', policiesError.message);
    } else {
      console.log('   ✅ Current RLS policies:');
      console.log(JSON.stringify(policies, null, 2));
    }

    // 4. Check auth.users
    console.log('\n4️⃣ Checking auth.users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('   ❌ Error listing users:', usersError.message);
    } else {
      console.log(`   ✅ Total users: ${users?.length || 0}`);
      users?.forEach(user => {
        console.log(`      - ${user.email} (${user.role || 'no role'})`);
      });
    }

    // 5. Check barbershop_customers
    console.log('\n5️⃣ Checking barbershop_customers...');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.log('   ❌ Error:', customersError.message);
    } else {
      console.log(`   ✅ Total records: ${customers?.length || 0}`);
      console.log('   Sample:', customers);
    }

    // 6. Check barbershop_admins
    console.log('\n6️⃣ Checking barbershop_admins...');
    const { data: admins, error: adminsError } = await supabase
      .from('barbershop_admins')
      .select('*')
      .limit(5);
    
    if (adminsError) {
      console.log('   ❌ Error:', adminsError.message);
    } else {
      console.log(`   ✅ Total records: ${admins?.length || 0}`);
      console.log('   Sample:', admins);
    }

    console.log('\n✅ ANALYSIS COMPLETE\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

analyzeCurrentState();
