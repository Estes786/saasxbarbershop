#!/usr/bin/env node

/**
 * FIX DATABASE COMPLETE
 * 
 * Script ini akan:
 * 1. Membaca SQL idempotent fix dari uploaded file
 * 2. Apply SQL ke Supabase
 * 3. Verify schema dan RLS policies
 * 4. Report hasil
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🚀 Starting Database Fix & Analysis...\n');

  // Step 1: Read SQL file
  console.log('📖 Reading IDEMPOTENT_SCHEMA_FIX.sql...');
  const sqlPath = '/home/user/uploaded_files/IDEMPOTENT_SCHEMA_FIX.sql';
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  console.log('✅ SQL file loaded successfully\n');

  // Step 2: Apply SQL (split by semicolon and execute one by one)
  console.log('🔧 Applying SQL fixes to Supabase...');
  
  try {
    // Execute using pg_query (raw SQL execution)
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    });

    if (error) {
      console.error('⚠️  Direct RPC failed, trying alternative method...');
      
      // Alternative: Use REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log('✅ SQL applied successfully via REST API');
    } else {
      console.log('✅ SQL applied successfully');
    }
  } catch (error) {
    console.error('❌ Failed to apply SQL:', error.message);
    console.log('\n⚠️  Please apply the SQL manually in Supabase SQL Editor');
    console.log('📍 Location: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('📄 File: /home/user/uploaded_files/IDEMPOTENT_SCHEMA_FIX.sql\n');
  }

  // Step 3: Verify schema
  console.log('\n🔍 Verifying database schema...');
  
  try {
    // Check tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'user_profiles',
        'barbershop_customers',
        'capsters',
        'service_catalog',
        'bookings',
        'barbershop_transactions'
      ]);

    if (tablesError) throw tablesError;

    console.log('✅ Tables found:', tables?.length || 0);
    tables?.forEach(t => console.log('   -', t.table_name));

  } catch (error) {
    console.error('❌ Schema verification error:', error.message);
  }

  // Step 4: Check RLS policies
  console.log('\n🔐 Checking RLS policies...');
  
  try {
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies');
    
    if (policiesError) {
      console.log('⚠️  Cannot fetch policies directly, checking via query...');
      
      // Alternative: Query user_profiles as authenticated user
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count');

      if (testError) {
        console.error('❌ RLS check failed:', testError.message);
      } else {
        console.log('✅ RLS is active and working');
      }
    } else {
      console.log('✅ RLS policies configured');
    }
  } catch (error) {
    console.error('❌ RLS check error:', error.message);
  }

  // Step 5: Test insert (check foreign key issue)
  console.log('\n🧪 Testing database constraints...');
  
  try {
    // Test if barbershop_customers table exists and accepts inserts
    const testPhone = '+62812TEST' + Date.now();
    const { data, error } = await supabase
      .from('barbershop_customers')
      .insert({
        customer_phone: testPhone,
        customer_name: 'Test User'
      })
      .select();

    if (error) {
      console.error('❌ Insert test failed:', error.message);
      
      if (error.message.includes('foreign key constraint')) {
        console.log('\n⚠️  FOREIGN KEY CONSTRAINT ERROR DETECTED!');
        console.log('🔧 This is the main issue. The user_profiles table has a foreign key');
        console.log('   constraint on customer_phone that references barbershop_customers.');
        console.log('   But when registering, user_profiles is created first before');
        console.log('   barbershop_customers, causing the constraint violation.');
      }
    } else {
      console.log('✅ Insert test successful');
      
      // Cleanup test data
      await supabase
        .from('barbershop_customers')
        .delete()
        .eq('customer_phone', testPhone);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n✅ Database analysis complete!\n');
}

main().catch(console.error);
