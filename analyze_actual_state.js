const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('🔍 ANALYZING ACTUAL SUPABASE DATABASE STATE...\n');
  console.log('=' .repeat(80));
  
  try {
    // 1. Check all tables
    console.log('\n📊 1. CHECKING ALL TABLES:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.log('❌ Error fetching tables:', tablesError.message);
    } else {
      console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
    }

    // 2. Check user_profiles structure
    console.log('\n📋 2. CHECKING user_profiles TABLE STRUCTURE:');
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_profiles' })
      .catch(async () => {
        // Fallback query
        return await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', 'user_profiles');
      });

    if (columns) {
      console.log('Columns:', columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));
    }

    // 3. Check user_profiles data
    console.log('\n👤 3. CHECKING user_profiles DATA:');
    const { data: profiles, error: profilesError, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`✅ Total profiles: ${count}`);
      if (profiles && profiles.length > 0) {
        console.log('Sample profiles:');
        profiles.slice(0, 3).forEach(p => {
          console.log(`  - ${p.email} (${p.role}) | Phone: ${p.customer_phone || 'N/A'}`);
        });
      }
    }

    // 4. Check RLS policies
    console.log('\n🔒 4. CHECKING RLS POLICIES:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_profiles');
    
    if (policiesError) {
      console.log('❌ Error fetching policies:', policiesError.message);
    } else if (policies) {
      console.log(`✅ Found ${policies.length} RLS policies on user_profiles:`);
      policies.forEach(p => {
        console.log(`  - ${p.policyname} (${p.cmd})`);
        console.log(`    USING: ${p.qual}`);
        if (p.with_check) console.log(`    WITH CHECK: ${p.with_check}`);
      });
    }

    // 5. Check triggers
    console.log('\n⚡ 5. CHECKING TRIGGERS:');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'user_profiles');
    
    if (triggersError) {
      console.log('❌ Error fetching triggers:', triggersError.message);
    } else if (triggers && triggers.length > 0) {
      console.log(`✅ Found ${triggers.length} triggers on user_profiles:`);
      triggers.forEach(t => {
        console.log(`  - ${t.trigger_name} (${t.event_manipulation})`);
      });
    } else {
      console.log('⚠️  No triggers found on user_profiles');
    }

    // 6. Check foreign keys
    console.log('\n🔗 6. CHECKING FOREIGN KEY CONSTRAINTS:');
    const { data: fkeys, error: fkeysError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'user_profiles')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (fkeysError) {
      console.log('❌ Error fetching foreign keys:', fkeysError.message);
    } else if (fkeys && fkeys.length > 0) {
      console.log(`✅ Found ${fkeys.length} foreign keys on user_profiles:`);
      fkeys.forEach(fk => {
        console.log(`  - ${fk.constraint_name}`);
      });
    } else {
      console.log('✅ No foreign key constraints (GOOD - avoids FK violations)');
    }

    // 7. Check barbershop_customers
    console.log('\n🏪 7. CHECKING barbershop_customers TABLE:');
    const { data: customers, error: customersError, count: customerCount } = await supabase
      .from('barbershop_customers')
      .select('*', { count: 'exact' });
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError.message);
    } else {
      console.log(`✅ Total customers: ${customerCount}`);
      if (customers && customers.length > 0) {
        console.log('Sample customers:');
        customers.slice(0, 3).forEach(c => {
          console.log(`  - ${c.customer_name} (${c.customer_phone}) | Visits: ${c.total_visits}`);
        });
      }
    }

    // 8. Test auth.users (if accessible)
    console.log('\n🔐 8. CHECKING auth.users:');
    const { data: authUsers, error: authError, count: authCount } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at', { count: 'exact' });
    
    if (authError) {
      console.log('⚠️  Cannot access auth.users directly:', authError.message);
      console.log('   (This is normal - requires direct SQL query)');
    } else {
      console.log(`✅ Total auth users: ${authCount}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
  }
}

analyzeDatabase();
