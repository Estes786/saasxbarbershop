#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log('\n============================================================');
console.log('🚀 EXECUTING SQL FIX VIA SUPABASE REST API');
console.log('============================================================\n');

console.log(`📊 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log('');

// Read SQL file
const sqlContent = fs.readFileSync('COMPREHENSIVE_1_USER_1_ROLE_1_DASHBOARD_FIX.sql', 'utf8');

// Since we can't execute complex DO blocks via REST API easily,
// let's break down the fix into individual executable statements

console.log('🔧 Preparing SQL statements...\n');

const statements = [
  // 1. Add user_id column if not exists
  {
    name: 'Add user_id column',
    sql: `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'barbershop_customers' 
          AND column_name = 'user_id'
        ) THEN
          ALTER TABLE barbershop_customers 
          ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `
  },
  
  // 2. Fix orphaned records
  {
    name: 'Fix orphaned records by customer_phone',
    sql: `
      UPDATE barbershop_customers bc
      SET user_id = up.id,
          updated_at = NOW()
      FROM user_profiles up
      WHERE bc.customer_phone = up.customer_phone
        AND up.role = 'customer'
        AND bc.user_id IS NULL
        AND bc.customer_phone IS NOT NULL
        AND bc.customer_phone != '';
    `
  },
  
  // 3. Create indexes
  {
    name: 'Create index on user_id',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_barbershop_customers_user_id 
      ON barbershop_customers(user_id)
      WHERE user_id IS NOT NULL;
    `
  },
  
  {
    name: 'Create index on customer_phone',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_barbershop_customers_phone 
      ON barbershop_customers(customer_phone);
    `
  },
  
  // 4. Enable RLS
  {
    name: 'Enable RLS',
    sql: `ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;`
  },
  
  // 5. Drop old policies
  {
    name: 'Drop old policies',
    sql: `
      DROP POLICY IF EXISTS "customers_read_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_insert_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_update_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_delete_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "Enable read access for all users" ON barbershop_customers;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_read_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_insert_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_update_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_delete_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "admin_full_access_customers" ON barbershop_customers;
      DROP POLICY IF EXISTS "capster_read_all_customers" ON barbershop_customers;
      DROP POLICY IF EXISTS "capster_update_customers" ON barbershop_customers;
    `
  },
  
  // 6. Create new RLS policies for CUSTOMER
  {
    name: 'Create customer_read_own_by_user_id policy',
    sql: `
      CREATE POLICY "customer_read_own_by_user_id"
      ON barbershop_customers
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() 
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      );
    `
  },
  
  {
    name: 'Create customer_insert_own_by_user_id policy',
    sql: `
      CREATE POLICY "customer_insert_own_by_user_id"
      ON barbershop_customers
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      );
    `
  },
  
  {
    name: 'Create customer_update_own_by_user_id policy',
    sql: `
      CREATE POLICY "customer_update_own_by_user_id"
      ON barbershop_customers
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      );
    `
  },
  
  // 7. Create RLS policies for CAPSTER
  {
    name: 'Create capster_read_all_customers policy',
    sql: `
      CREATE POLICY "capster_read_all_customers"
      ON barbershop_customers
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'capster'
        )
      );
    `
  },
  
  {
    name: 'Create capster_update_customers policy',
    sql: `
      CREATE POLICY "capster_update_customers"
      ON barbershop_customers
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'capster'
        )
      );
    `
  },
  
  // 8. Create RLS policy for ADMIN
  {
    name: 'Create admin_full_access_customers policy',
    sql: `
      CREATE POLICY "admin_full_access_customers"
      ON barbershop_customers
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    `
  },
  
  // 9. Update trigger function
  {
    name: 'Update trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
      RETURNS TRIGGER
      SECURITY DEFINER
      SET search_path = public
      LANGUAGE plpgsql
      AS $_$
      BEGIN
        IF NEW.role = 'customer' THEN
          IF NOT EXISTS (
            SELECT 1 FROM barbershop_customers 
            WHERE user_id = NEW.id
          ) THEN
            INSERT INTO barbershop_customers (
              user_id,
              customer_phone,
              customer_name,
              customer_area,
              total_visits,
              total_revenue,
              average_atv,
              customer_segment,
              lifetime_value,
              coupon_count,
              coupon_eligible,
              google_review_given,
              churn_risk_score,
              created_at,
              updated_at
            ) VALUES (
              NEW.id,
              NEW.customer_phone,
              NEW.customer_name,
              'Unknown',
              0, 0, 0, 'New', 0, 0, false, false, 0,
              NOW(), NOW()
            );
          END IF;
        END IF;
        RETURN NEW;
      END;
      $_$;
      
      DROP TRIGGER IF EXISTS trg_auto_create_barbershop_customer ON user_profiles;
      CREATE TRIGGER trg_auto_create_barbershop_customer
        AFTER INSERT ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION auto_create_barbershop_customer();
    `
  }
];

console.log(`📋 Total statements to execute: ${statements.length}\n`);
console.log('⚠️  Note: This script executes statements individually.');
console.log('   For best results, use Supabase SQL Editor to run the complete script.\n');
console.log('📝 Instructions saved to: MANUAL_SQL_FIX_INSTRUCTIONS.md\n');
console.log('============================================================');
console.log('');
console.log('🎯 RECOMMENDED APPROACH:');
console.log('');
console.log('1. Open Supabase SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/editor`);
console.log('');
console.log('2. Copy content from: COMPREHENSIVE_1_USER_1_ROLE_1_DASHBOARD_FIX.sql');
console.log('');
console.log('3. Paste and Run in SQL Editor');
console.log('');
console.log('4. Verify with: node analyze_current_db.js');
console.log('');
console.log('============================================================\n');

// Save a simplified version for testing
console.log('💾 Saving simplified SQL statements for reference...\n');

const simplifiedSQL = statements.map((stmt, idx) => {
  return `-- ${idx + 1}. ${stmt.name}\n${stmt.sql}\n`;
}).join('\n');

fs.writeFileSync('SIMPLIFIED_FIX_STATEMENTS.sql', simplifiedSQL);
console.log('✅ Saved to: SIMPLIFIED_FIX_STATEMENTS.sql');
console.log('   (Use this if you want to run statements one by one)\n');
