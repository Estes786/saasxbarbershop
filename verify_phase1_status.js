#!/usr/bin/env node
/**
 * Verify Phase 1 Multi-Location Status
 * Checks if Phase 1 migration has been completed
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPhase1Status() {
  console.log('\n🔍 VERIFYING PHASE 1 MULTI-LOCATION STATUS\n');
  console.log('=' .repeat(60));
  
  const checks = {
    branchesTableExists: false,
    capstersHasBranchId: false,
    bookingsHasBranchId: false,
    customersHasPreferredBranchId: false,
    branchCount: 0,
    capstersWithBranch: 0,
    bookingsWithBranch: 0
  };

  try {
    // Check 1: branches table exists
    console.log('\n1️⃣  Checking if branches table exists...');
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .limit(1);
    
    if (!branchError) {
      checks.branchesTableExists = true;
      console.log('   ✅ branches table EXISTS');
      
      // Count branches
      const { count } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true });
      checks.branchCount = count || 0;
      console.log(`   📊 Total branches: ${checks.branchCount}`);
    } else {
      console.log('   ❌ branches table NOT FOUND');
      console.log(`   Error: ${branchError.message}`);
    }

    // Check 2: capsters has branch_id column
    console.log('\n2️⃣  Checking if capsters table has branch_id...');
    const { data: capsters, error: capsterError } = await supabase
      .from('capsters')
      .select('id, branch_id')
      .limit(1);
    
    if (!capsterError && capsters) {
      checks.capstersHasBranchId = true;
      console.log('   ✅ capsters.branch_id column EXISTS');
      
      // Count capsters with branch
      const { count } = await supabase
        .from('capsters')
        .select('*', { count: 'exact', head: true })
        .not('branch_id', 'is', null);
      checks.capstersWithBranch = count || 0;
      console.log(`   📊 Capsters with branch: ${checks.capstersWithBranch}`);
    } else {
      console.log('   ❌ capsters.branch_id column NOT FOUND');
    }

    // Check 3: bookings has branch_id column
    console.log('\n3️⃣  Checking if bookings table has branch_id...');
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, branch_id')
      .limit(1);
    
    if (!bookingError && bookings) {
      checks.bookingsHasBranchId = true;
      console.log('   ✅ bookings.branch_id column EXISTS');
      
      // Count bookings with branch
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .not('branch_id', 'is', null);
      checks.bookingsWithBranch = count || 0;
      console.log(`   📊 Bookings with branch: ${checks.bookingsWithBranch}`);
    } else {
      console.log('   ❌ bookings.branch_id column NOT FOUND');
    }

    // Check 4: customers has preferred_branch_id column
    console.log('\n4️⃣  Checking if customers table has preferred_branch_id...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, preferred_branch_id')
      .limit(1);
    
    if (!customerError && customers) {
      checks.customersHasPreferredBranchId = true;
      console.log('   ✅ customers.preferred_branch_id column EXISTS');
    } else {
      console.log('   ❌ customers.preferred_branch_id column NOT FOUND');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 PHASE 1 STATUS SUMMARY:\n');
    
    const allChecks = [
      checks.branchesTableExists,
      checks.capstersHasBranchId,
      checks.bookingsHasBranchId,
      checks.customersHasPreferredBranchId
    ];
    
    const passedChecks = allChecks.filter(Boolean).length;
    const totalChecks = allChecks.length;
    
    console.log(`   ✅ Checks passed: ${passedChecks}/${totalChecks}`);
    console.log(`   📦 Branches created: ${checks.branchCount}`);
    console.log(`   👨‍💼 Capsters with branch: ${checks.capstersWithBranch}`);
    console.log(`   📅 Bookings with branch: ${checks.bookingsWithBranch}`);
    
    console.log('\n' + '='.repeat(60));
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 PHASE 1 COMPLETE!');
      console.log('✅ All database schema changes are in place');
      console.log('✅ Ready for Phase 2: Backend APIs\n');
      return true;
    } else {
      console.log('\n⚠️  PHASE 1 INCOMPLETE!');
      console.log('❌ Some database schema changes are missing');
      console.log('📝 You need to apply the migration script first\n');
      console.log('Run this command in Supabase SQL Editor:');
      console.log('   👉 Copy content from: 01_multi_location_phase1_migration.sql\n');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR during verification:', error.message);
    console.error('\nFull error:', error);
    return false;
  }
}

// Run verification
verifyPhase1Status()
  .then(isComplete => {
    process.exit(isComplete ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
