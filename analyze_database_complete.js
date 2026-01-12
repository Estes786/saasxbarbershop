#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('\n🔍 ANALYZING SUPABASE DATABASE...\n');
  console.log('========================================');
  
  try {
    // 1. Check barbershop_customers schema
    console.log('\n📊 TABLE: barbershop_customers');
    console.log('----------------------------------------');
    
    const { data: customers, error: custError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(5);
    
    if (custError) {
      console.log('❌ Error:', custError.message);
    } else {
      console.log('✅ Total records:', customers.length > 0 ? 'Found' : 'Empty');
      
      if (customers.length > 0) {
        console.log('\n🔑 Schema columns:');
        Object.keys(customers[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof customers[0][key]}`);
        });
        
        // Check if user_id column exists
        const hasUserId = customers[0].hasOwnProperty('user_id');
        console.log(`\n🎯 user_id column: ${hasUserId ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (hasUserId) {
          const linkedCount = customers.filter(c => c.user_id !== null).length;
          const orphanedCount = customers.filter(c => c.user_id === null).length;
          console.log(`   - Linked to users: ${linkedCount}`);
          console.log(`   - Orphaned records: ${orphanedCount}`);
        }
      }
    }
    
    // 2. Check user_profiles
    console.log('\n\n📊 TABLE: user_profiles');
    console.log('----------------------------------------');
    
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('id, email, role, customer_phone')
      .limit(10);
    
    if (profError) {
      console.log('❌ Error:', profError.message);
    } else {
      console.log(`✅ Total profiles: ${profiles.length}`);
      
      const roleCount = {};
      profiles.forEach(p => {
        roleCount[p.role] = (roleCount[p.role] || 0) + 1;
      });
      
      console.log('\n📋 Role distribution:');
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count}`);
      });
    }
    
    // 3. Check RLS policies
    console.log('\n\n🔒 RLS POLICIES: barbershop_customers');
    console.log('----------------------------------------');
    
    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'barbershop_customers');
    
    if (polError) {
      console.log('⚠️  Could not fetch policies (may need superuser)');
    } else if (policies && policies.length > 0) {
      console.log(`✅ Found ${policies.length} policies:`);
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('⚠️  No policies found');
    }
    
    // 4. Test query with user_id
    console.log('\n\n🧪 TEST: Query by user_id');
    console.log('----------------------------------------');
    
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      console.log(`Testing with user_id: ${testUserId}`);
      
      const { data: testData, error: testError } = await supabase
        .from('barbershop_customers')
        .select('*')
        .eq('user_id', testUserId)
        .maybeSingle();
      
      if (testError) {
        console.log('❌ Error:', testError.message);
      } else if (testData) {
        console.log('✅ Query successful - found customer record');
      } else {
        console.log('⚠️  No customer record for this user_id');
      }
    }
    
    // 5. Summary
    console.log('\n\n========================================');
    console.log('📋 SUMMARY');
    console.log('========================================');
    
    if (customers && customers.length > 0) {
      const hasUserId = customers[0].hasOwnProperty('user_id');
      
      if (hasUserId) {
        console.log('✅ user_id column EXISTS');
        console.log('✅ Schema ready for 1 USER = 1 DASHBOARD');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Verify RLS policies enforce user_id');
        console.log('   2. Update application code to use user_id');
        console.log('   3. Test with multiple users');
      } else {
        console.log('❌ user_id column MISSING');
        console.log('⚠️  Need to apply FIX_1_USER_1_DASHBOARD_ISOLATED_DATA.sql');
        console.log('');
        console.log('📝 Action required:');
        console.log('   Run SQL fix in Supabase SQL Editor');
      }
    } else {
      console.log('⚠️  No customer records found');
    }
    
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
  }
}

// Run analysis
analyzeDatabase();
