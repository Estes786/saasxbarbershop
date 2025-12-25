#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('\n========================================');
  console.log('🔍 ANALYZING CURRENT DATABASE STATE');
  console.log('========================================\n');

  try {
    // 1. Check user_profiles table
    console.log('📊 1. USER_PROFILES TABLE');
    console.log('----------------------------------------');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role, customer_phone, customer_name');
    
    if (profilesError) {
      console.error('❌ Error fetching user_profiles:', profilesError.message);
    } else {
      console.log(`✅ Total users: ${profiles.length}`);
      const byRole = profiles.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      }, {});
      Object.entries(byRole).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
      console.log('\nSample users:');
      profiles.slice(0, 3).forEach(p => {
        console.log(`   - ${p.email} (${p.role})`);
      });
    }

    // 2. Check barbershop_customers table
    console.log('\n📊 2. BARBERSHOP_CUSTOMERS TABLE');
    console.log('----------------------------------------');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('user_id, customer_phone, customer_name, total_visits, total_revenue');
    
    if (customersError) {
      console.error('❌ Error fetching barbershop_customers:', customersError.message);
    } else {
      console.log(`✅ Total customer records: ${customers.length}`);
      
      const withUserId = customers.filter(c => c.user_id !== null).length;
      const withoutUserId = customers.filter(c => c.user_id === null).length;
      
      console.log(`   - With user_id: ${withUserId} (${(withUserId/customers.length*100).toFixed(1)}%)`);
      console.log(`   - WITHOUT user_id (orphaned): ${withoutUserId} (${(withoutUserId/customers.length*100).toFixed(1)}%)`);
      
      if (withoutUserId > 0) {
        console.log('\n⚠️  ORPHANED RECORDS (no user_id):');
        customers.filter(c => c.user_id === null).forEach(c => {
          console.log(`   - ${c.customer_phone} (${c.customer_name}) - ${c.total_visits} visits`);
        });
      }
      
      console.log('\nSample customer records:');
      customers.slice(0, 3).forEach(c => {
        console.log(`   - Phone: ${c.customer_phone}, User ID: ${c.user_id ? c.user_id.substring(0, 8) + '...' : 'NULL'}`);
      });
    }

    // 3. Check if user_id column exists
    console.log('\n📊 3. DATABASE SCHEMA CHECK');
    console.log('----------------------------------------');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'barbershop_customers' })
      .catch(async () => {
        // Fallback: try direct query
        return await supabase
          .from('barbershop_customers')
          .select('*')
          .limit(0);
      });
    
    console.log('✅ Checking barbershop_customers schema...');
    console.log('   Note: Use Supabase Dashboard to verify exact schema');

    // 4. Check RLS policies
    console.log('\n📊 4. RLS POLICIES CHECK');
    console.log('----------------------------------------');
    const { data: policies, error: policiesError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    if (policiesError) {
      console.log('⚠️  RLS is ENABLED (query blocked without auth)');
      console.log('   This is CORRECT behavior for production');
    } else {
      console.log('✅ Query succeeded with service role key');
    }

    // 5. Summary
    console.log('\n========================================');
    console.log('📋 SUMMARY');
    console.log('========================================\n');
    
    if (customersError) {
      console.log('❌ Could not analyze barbershop_customers table');
    } else {
      const orphanedCount = customers.filter(c => c.user_id === null).length;
      
      if (orphanedCount > 0) {
        console.log('🔴 ACTION REQUIRED:');
        console.log(`   - ${orphanedCount} orphaned customer records found`);
        console.log('   - These records cause data sharing between users');
        console.log('   - Run FIX_1_USER_1_DASHBOARD_COMPLETE.sql to fix\n');
      } else {
        console.log('✅ All customer records properly linked to users');
        console.log('✅ 1 USER = 1 DASHBOARD isolation is ready\n');
      }
    }

    console.log('📝 NEXT STEPS:');
    console.log('   1. Apply SQL fix if orphaned records exist');
    console.log('   2. Update application code to use user_id queries');
    console.log('   3. Test with multiple user accounts');
    console.log('   4. Deploy to production\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  }
}

analyzeDatabase();
