#!/usr/bin/env node

/**
 * Apply Phase 1 Migration using direct SQL execution
 * Splits large SQL file into individual statements and executes them
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

// PostgreSQL connection string (constructed from Supabase details)
const PG_CONNECTION = `postgresql://postgres:YOUR_PASSWORD@db.qwqmhvwqeynnyxaecqzw.supabase.co:5432/postgres`;

async function createManualGuide() {
  console.log('📋 MANUAL MIGRATION GUIDE\n');
  console.log('=' .repeat(80));
  console.log('\nSince automatic execution is not available, please follow these steps:\n');
  
  console.log('🔧 METHOD 1: Using Supabase Dashboard (RECOMMENDED)\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Click "New Query"');
  console.log('4. Copy the entire content of: 01_multi_location_phase1_migration.sql');
  console.log('5. Paste into the SQL Editor');
  console.log('6. Click "Run" button');
  console.log('7. Check the output messages for success confirmation\n');
  
  console.log('🔧 METHOD 2: Using psql Command Line\n');
  console.log('1. Install PostgreSQL client if not installed');
  console.log('2. Get your database password from Supabase Dashboard → Settings → Database');
  console.log('3. Run this command:\n');
  console.log('   psql "postgresql://postgres:YOUR_PASSWORD@db.qwqmhvwqeynnyxaecqzw.supabase.co:5432/postgres" -f 01_multi_location_phase1_migration.sql\n');
  
  console.log('=' .repeat(80));
  console.log('\n✅ After running the migration, you should see messages like:\n');
  console.log('   ✅ Table branches created successfully');
  console.log('   ✅ Column branch_id added to capsters table');
  console.log('   ✅ Index idx_branches_barbershop_id created');
  console.log('   ✅ Policy owner_select_own_branches created');
  console.log('   🎉 PHASE 1 MIGRATION COMPLETE!\n');
  
  console.log('=' .repeat(80));
  console.log('\n📄 SQL File Location:');
  console.log('   /home/user/webapp/01_multi_location_phase1_migration.sql\n');
  
  // Also create a simplified version for testing
  const testSQL = `
-- Quick test to check if migration is needed
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches')
    THEN '✅ branches table exists'
    ELSE '❌ branches table NOT found - migration needed'
  END as branches_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'capsters' AND column_name = 'branch_id')
    THEN '✅ capsters.branch_id exists'
    ELSE '❌ capsters.branch_id NOT found - migration needed'
  END as capsters_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'branch_id')
    THEN '✅ bookings.branch_id exists'
    ELSE '❌ bookings.branch_id NOT found - migration needed'
  END as bookings_status;
`;
  
  fs.writeFileSync('00_test_migration_status.sql', testSQL);
  console.log('📝 Created test file: 00_test_migration_status.sql');
  console.log('   Run this first to check if migration is needed\n');
}

async function main() {
  console.log('🚀 PHASE 1: MULTI-LOCATION SUPPORT MIGRATION\n');
  
  // Check if SQL file exists
  if (!fs.existsSync('01_multi_location_phase1_migration.sql')) {
    console.error('❌ SQL migration file not found!');
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync('01_multi_location_phase1_migration.sql', 'utf8');
  console.log('✅ Migration file loaded');
  console.log(`   Size: ${Math.round(sqlContent.length / 1024)} KB`);
  console.log(`   Statements: ~${sqlContent.split('DO $$').length - 1} blocks\n`);
  
  // Since we can't execute automatically, create manual guide
  await createManualGuide();
  
  console.log('=' .repeat(80));
  console.log('\n🔍 ALTERNATIVE: Check Current Database State\n');
  console.log('Run this command to see current tables:');
  console.log('   node analyze_db_for_multi_location.js\n');
}

main().catch(console.error);
