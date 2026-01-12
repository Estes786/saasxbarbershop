#!/usr/bin/env node
/**
 * Final Verification of Phase 1 Multi-Location Status
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPhase1Final() {
  console.log('\n🔍 FINAL PHASE 1 VERIFICATION\n');
  console.log('=' .repeat(60));
  
  const results = {
    branchesTable: false,
    capstersHasBranch: false,
    bookingsHasBranch: false,
    userProfilesHasPreferredBranch: false,
    branchCount: 0,
    capstersWithBranch: 0,
    bookingsWithBranch: 0,
    userCount: 0
  };

  try {
    // 1. Check branches table
    console.log('\n1️⃣  branches table');
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*');
    
    if (!branchError && branches) {
      results.branchesTable = true;
      results.branchCount = branches.length;
      console.log(`   ✅ EXISTS with ${results.branchCount} branches`);
      branches.forEach((b, i) => {
        console.log(`      ${i + 1}. ${b.branch_name || b.name} (${b.is_main_branch ? 'Main' : 'Branch'})`);
      });
    }

    // 2. Check capsters.branch_id
    console.log('\n2️⃣  capsters.branch_id');
    const { data: capsters, count: capsterCount } = await supabase
      .from('capsters')
      .select('id, capster_name, branch_id', { count: 'exact' })
      .not('branch_id', 'is', null);
    
    if (capsters) {
      results.capstersHasBranch = true;
      results.capstersWithBranch = capsterCount || 0;
      console.log(`   ✅ EXISTS with ${results.capstersWithBranch} capsters assigned`);
    }

    // 3. Check bookings.branch_id
    console.log('\n3️⃣  bookings.branch_id');
    const { data: bookings, count: bookingCount } = await supabase
      .from('bookings')
      .select('id, branch_id', { count: 'exact' })
      .not('branch_id', 'is', null);
    
    if (bookings !== null) {
      results.bookingsHasBranch = true;
      results.bookingsWithBranch = bookingCount || 0;
      console.log(`   ✅ EXISTS with ${results.bookingsWithBranch} bookings assigned`);
    }

    // 4. Check user_profiles.preferred_branch_id (KEY CHECK!)
    console.log('\n4️⃣  user_profiles.preferred_branch_id');
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, customer_name, preferred_branch_id')
      .limit(3);
    
    if (!userError && users) {
      results.userProfilesHasPreferredBranch = true;
      results.userCount = users.length;
      console.log(`   ✅ EXISTS (checked ${results.userCount} users)`);
      
      // Show sample data
      users.forEach((u, i) => {
        const name = u.full_name || u.customer_name || 'Unknown';
        const hasBranch = u.preferred_branch_id ? '✅' : '○';
        console.log(`      ${i + 1}. ${name} ${hasBranch}`);
      });
    } else {
      console.log(`   ❌ NOT FOUND or ERROR: ${userError?.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 PHASE 1 STATUS SUMMARY:\n');
    
    const checks = [
      results.branchesTable,
      results.capstersHasBranch,
      results.bookingsHasBranch,
      results.userProfilesHasPreferredBranch
    ];
    
    const passed = checks.filter(Boolean).length;
    const total = checks.length;
    
    console.log(`   ✅ Required checks: ${passed}/${total}`);
    console.log(`   📦 Branches: ${results.branchCount}`);
    console.log(`   👨‍💼 Capsters with branch: ${results.capstersWithBranch}`);
    console.log(`   📅 Bookings with branch: ${results.bookingsWithBranch}`);
    console.log(`   👤 Users (can set preference): ${results.userCount}+`);
    
    console.log('\n' + '='.repeat(60));
    
    if (passed === total) {
      console.log('\n✅✅✅ PHASE 1 COMPLETE! ✅✅✅\n');
      console.log('🎉 All multi-location database schema in place!\n');
      console.log('📝 New Features Enabled:');
      console.log('   ✅ Multiple Branch Management');
      console.log('   ✅ Branch-Specific Capster Assignment');
      console.log('   ✅ Location-Aware Booking');
      console.log('   ✅ Per-Branch Analytics Foundation');
      console.log('   ✅ User Preferred Branch Selection\n');
      console.log('🚀 READY FOR PHASE 2: Backend APIs');
      console.log('   Next: Implement /api/admin/branches endpoints\n');
      return true;
    } else {
      console.log('\n⚠️  PHASE 1 INCOMPLETE\n');
      console.log(`Missing: ${total - passed} requirement(s)\n`);
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

verifyPhase1Final()
  .then(isComplete => process.exit(isComplete ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
