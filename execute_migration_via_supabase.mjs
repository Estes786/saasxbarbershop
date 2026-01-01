#!/usr/bin/env node

/**
 * Execute Phase 1 Migration using @supabase/supabase-js
 * This uses raw SQL queries via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatement(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkMigrationStatus() {
  console.log('🔍 Checking current migration status...\n');
  
  try {
    // Check if branches table exists
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'branches')
      .single();
    
    if (tables) {
      console.log('⚠️  branches table already exists - migration may have been applied');
      console.log('   Checking other columns...\n');
    } else {
      console.log('✅ branches table not found - ready for migration\n');
    }
  } catch (error) {
    console.log('ℹ️  Unable to check status via REST API, proceeding with migration\n');
  }
}

async function applyMigrationManually() {
  console.log('🚀 APPLYING PHASE 1: MULTI-LOCATION SUPPORT\n');
  console.log('=' .repeat(80));
  
  try {
    // Read SQL file
    const sqlContent = readFileSync('01_multi_location_phase1_migration.sql', 'utf8');
    
    console.log('\n📄 Migration file loaded');
    console.log(`   Size: ${Math.round(sqlContent.length / 1024)} KB`);
    
    console.log('\n❌ Direct SQL execution not available via Supabase JS client');
    console.log('   Supabase REST API does not support arbitrary SQL execution\n');
    
    console.log('=' .repeat(80));
    console.log('\n📋 PLEASE APPLY MIGRATION MANUALLY:\n');
    console.log('🔧 Using Supabase Dashboard (EASIEST METHOD):\n');
    console.log('1. Open: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('2. Copy entire content from: 01_multi_location_phase1_migration.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "RUN" button');
    console.log('5. Wait for execution (should see success messages)\n');
    
    console.log('=' .repeat(80));
    console.log('\n✅ EXPECTED OUTPUT AFTER SUCCESSFUL MIGRATION:\n');
    console.log('   ✅ Table branches created successfully');
    console.log('   ✅ Column branch_id added to capsters table');
    console.log('   ✅ Column branch_id added to bookings table');
    console.log('   ✅ Column preferred_branch_id added to customers table');
    console.log('   ✅ Indexes created');
    console.log('   ✅ RLS policies created');
    console.log('   ✅ Default branches created for existing barbershops');
    console.log('   🎉 PHASE 1 MIGRATION COMPLETE!\n');
    
    console.log('=' .repeat(80));
    console.log('\n📝 VERIFICATION:\n');
    console.log('After applying migration, you can verify by running:');
    console.log('  SELECT COUNT(*) FROM branches;\n');
    console.log('This should return the number of branches created.\n');
    
    console.log('=' .repeat(80));
    console.log('\n📁 FILE READY FOR MANUAL APPLICATION:');
    console.log('   📄 /home/user/webapp/01_multi_location_phase1_migration.sql\n');
    
    // Create a quick copy command for easy access
    console.log('💡 TIP: You can view the SQL content with:');
    console.log('   cat /home/user/webapp/01_multi_location_phase1_migration.sql\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  await checkMigrationStatus();
  await applyMigrationManually();
  
  console.log('=' .repeat(80));
  console.log('\n🎯 NEXT STEPS AFTER MANUAL MIGRATION:\n');
  console.log('1. Apply SQL in Supabase Dashboard SQL Editor');
  console.log('2. Verify migration success (check for success messages)');
  console.log('3. Test branch creation via API');
  console.log('4. Continue to Phase 2: Backend APIs implementation');
  console.log('5. Continue to Phase 3: Frontend Components\n');
}

main().catch(console.error);
