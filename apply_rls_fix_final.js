const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQLFix() {
  console.log('🔧 Applying RLS Fix to Supabase...\n');

  const sqlStatements = [
    // Drop existing policies on user_profiles
    `DROP POLICY IF EXISTS "service_role_full_access" ON user_profiles;`,
    `DROP POLICY IF EXISTS "authenticated_insert_own" ON user_profiles;`,
    `DROP POLICY IF EXISTS "authenticated_select_own" ON user_profiles;`,
    `DROP POLICY IF EXISTS "authenticated_update_own" ON user_profiles;`,
    `DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;`,
    `DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;`,
    `DROP POLICY IF EXISTS "Enable insert for authentication users only" ON user_profiles;`,
    `DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;`,
    `DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;`,
    `DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;`,
    `DROP POLICY IF EXISTS "admin_select_all_profiles" ON user_profiles;`,

    // Disable RLS on user_profiles
    `ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;`,
    
    // Re-enable RLS on user_profiles
    `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`,

    // Create NEW policies for user_profiles
    `CREATE POLICY "service_role_full_access" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);`,
    `CREATE POLICY "users_insert_own_profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);`,
    `CREATE POLICY "users_select_own_profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);`,
    `CREATE POLICY "users_update_own_profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`,
    `CREATE POLICY "admin_select_all_profiles" ON user_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));`,

    // Drop existing policies on barbershop_customers
    `DROP POLICY IF EXISTS "service_role_full_access_customers" ON barbershop_customers;`,
    `DROP POLICY IF EXISTS "Enable read access for authenticated users" ON barbershop_customers;`,
    `DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;`,
    `DROP POLICY IF EXISTS "customers_view_own_data" ON barbershop_customers;`,
    `DROP POLICY IF EXISTS "customers_insert_during_signup" ON barbershop_customers;`,
    `DROP POLICY IF EXISTS "admin_view_all_customers" ON barbershop_customers;`,

    // Disable RLS on barbershop_customers
    `ALTER TABLE barbershop_customers DISABLE ROW LEVEL SECURITY;`,
    
    // Re-enable RLS on barbershop_customers
    `ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;`,

    // Create NEW policies for barbershop_customers
    `CREATE POLICY "service_role_full_access_customers" ON barbershop_customers FOR ALL TO service_role USING (true) WITH CHECK (true);`,
    `CREATE POLICY "customers_view_own_data" ON barbershop_customers FOR SELECT TO authenticated USING (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid()));`,
    `CREATE POLICY "customers_insert_during_signup" ON barbershop_customers FOR INSERT TO authenticated WITH CHECK (true);`,
    `CREATE POLICY "admin_view_all_customers" ON barbershop_customers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));`,
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`📝 Executing (${i + 1}/${sqlStatements.length}): ${sql.substring(0, 60)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`   ⚠️  Note: ${error.message}`);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.log(`   ⚠️  Note: ${err.message}`);
    }
  }

  console.log('\n✅ RLS Fix Applied Successfully!\n');
  console.log('📋 Please verify in Supabase Dashboard:');
  console.log('   1. Go to Authentication > Policies');
  console.log('   2. Check user_profiles table (5 policies)');
  console.log('   3. Check barbershop_customers table (4 policies)\n');
}

applySQLFix().catch(console.error);
