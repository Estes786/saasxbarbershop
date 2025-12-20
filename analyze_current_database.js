#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function analyzeCurrentState() {
  console.log('🔍 Analyzing Current Database State...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check tables
    console.log('📊 Tables in public schema:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename;
        ` 
      });
    
    if (tablesError) {
      // Try alternative method
      const { data: altTables, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (!altError && altTables) {
        console.log('Tables:', altTables);
      } else {
        console.log('❌ Error fetching tables:', tablesError, altError);
      }
    } else {
      console.log(tables);
    }

    // 2. Check user_profiles table structure
    console.log('\n📋 User Profiles Table Structure:');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Error:', profilesError.message);
    } else {
      console.log('✅ Table exists, sample structure:', profiles);
    }

    // 3. Check barbershop_customers table structure
    console.log('\n💈 Barbershop Customers Table Structure:');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.log('❌ Error:', customersError.message);
    } else {
      console.log('✅ Table exists, sample structure:', customers);
    }

    // 4. Check admin_profiles table structure
    console.log('\n👤 Admin Profiles Table Structure:');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_profiles')
      .select('*')
      .limit(1);
    
    if (adminsError) {
      console.log('❌ Error:', adminsError.message);
    } else {
      console.log('✅ Table exists, sample structure:', admins);
    }

    // 5. Test registration flow (without actually creating user)
    console.log('\n🔐 Authentication Methods Available:');
    const { data: authMethods } = await supabase.auth.getSession();
    console.log('Session status:', authMethods);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

analyzeCurrentState().then(() => {
  console.log('\n✅ Analysis complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Analysis failed:', err);
  process.exit(1);
});
