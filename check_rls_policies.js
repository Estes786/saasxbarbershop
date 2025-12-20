#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRLSPolicies() {
  console.log('🔐 Checking RLS Policies...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check RLS policies using SQL query
    const { data, error } = await supabase.rpc('exec_sql_rls_check', {
      query: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `
    });

    if (error) {
      console.log('Using direct table query instead...\n');
      
      // Check user_profiles RLS
      console.log('📋 Testing user_profiles access:');
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5);
      
      if (profileError) {
        console.log('❌ Error:', profileError);
      } else {
        console.log('✅ Can access user_profiles:', profiles.length, 'rows');
      }

      // Check barbershop_customers RLS
      console.log('\n💈 Testing barbershop_customers access:');
      const { data: customers, error: customerError } = await supabase
        .from('barbershop_customers')
        .select('*')
        .limit(5);
      
      if (customerError) {
        console.log('❌ Error:', customerError);
      } else {
        console.log('✅ Can access barbershop_customers:', customers.length, 'rows');
      }

      // Try to check if admin_profiles exists
      console.log('\n👤 Testing admin_profiles table existence:');
      const { data: admins, error: adminError } = await supabase
        .from('admin_profiles')
        .select('*')
        .limit(1);
      
      if (adminError) {
        console.log('❌ Table does not exist or has RLS issues:', adminError.message);
        console.log('\n⚠️  ISSUE IDENTIFIED: admin_profiles table is missing!');
      } else {
        console.log('✅ Can access admin_profiles:', admins.length, 'rows');
      }

    } else {
      console.log('✅ RLS Policies:', data);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

checkRLSPolicies().then(() => {
  console.log('\n✅ RLS check complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ RLS check failed:', err);
  process.exit(1);
});
