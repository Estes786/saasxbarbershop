#!/usr/bin/env node

/**
 * PHASE 1 & 2 VERIFICATION SCRIPT
 * Menganalisis database schema untuk memverifikasi status Multi-Location Support
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPhaseStatus() {
  console.log('🔍 ANALYZING PHASE 1 & 2 STATUS...\n');
  
  // ==========================================
  // PHASE 1: DATABASE SCHEMA CHECKS
  // ==========================================
  console.log('📊 PHASE 1: DATABASE SCHEMA VERIFICATION\n');
  
  const checks = {
    phase1: {
      tables: [],
      columns: [],
      policies: [],
      data: []
    },
    phase2: {
      apis: []
    }
  };
  
  try {
    // 1. Check if 'branches' table exists
    console.log('✓ Checking branches table...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .limit(5);
    
    if (!branchesError) {
      checks.phase1.tables.push('✅ branches table exists');
      checks.phase1.data.push(`   Found ${branches?.length || 0} branches`);
      if (branches && branches.length > 0) {
        console.log(`   📍 Branches found: ${branches.map(b => b.branch_name).join(', ')}`);
      }
    } else {
      checks.phase1.tables.push('❌ branches table NOT found');
      console.log('   ⚠️  Error:', branchesError.message);
    }
    
    // 2. Check capsters table for branch_id column
    console.log('\n✓ Checking capsters.branch_id column...');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('id, capster_name, branch_id, barbershop_id')
      .limit(5);
    
    if (!capstersError && capsters) {
      const hasBranchId = capsters.some(c => 'branch_id' in c);
      if (hasBranchId) {
        checks.phase1.columns.push('✅ capsters.branch_id column exists');
        const assignedCapsters = capsters.filter(c => c.branch_id !== null);
        checks.phase1.data.push(`   ${assignedCapsters.length}/${capsters.length} capsters assigned to branches`);
        console.log(`   👨‍💼 Capsters with branch assignment: ${assignedCapsters.length}`);
      } else {
        checks.phase1.columns.push('❌ capsters.branch_id column NOT found');
      }
    } else {
      checks.phase1.columns.push('⚠️  Cannot check capsters.branch_id');
      console.log('   ⚠️  Error:', capstersError?.message);
    }
    
    // 3. Check bookings table for branch_id column
    console.log('\n✓ Checking bookings.branch_id column...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, branch_id')
      .limit(5);
    
    if (!bookingsError && bookings) {
      const hasBranchId = bookings.some(b => 'branch_id' in b);
      if (hasBranchId) {
        checks.phase1.columns.push('✅ bookings.branch_id column exists');
      } else {
        checks.phase1.columns.push('❌ bookings.branch_id column NOT found');
      }
    } else {
      checks.phase1.columns.push('⚠️  Cannot check bookings.branch_id');
    }
    
    // 4. Check service_catalog for branch_id
    console.log('\n✓ Checking service_catalog.branch_id column...');
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('id, service_name, branch_id')
      .limit(5);
    
    if (!servicesError && services) {
      const hasBranchId = services.some(s => 'branch_id' in s);
      if (hasBranchId) {
        checks.phase1.columns.push('✅ service_catalog.branch_id column exists');
      } else {
        checks.phase1.columns.push('❌ service_catalog.branch_id column NOT found');
      }
    } else {
      checks.phase1.columns.push('⚠️  Cannot check service_catalog.branch_id');
    }
    
    // 5. Check user_profiles for preferred_branch_id
    console.log('\n✓ Checking user_profiles.preferred_branch_id column...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, preferred_branch_id')
      .limit(5);
    
    if (!profilesError && profiles) {
      const hasBranchId = profiles.some(p => 'preferred_branch_id' in p);
      if (hasBranchId) {
        checks.phase1.columns.push('✅ user_profiles.preferred_branch_id column exists');
      } else {
        checks.phase1.columns.push('❌ user_profiles.preferred_branch_id column NOT found');
      }
    } else {
      checks.phase1.columns.push('⚠️  Cannot check user_profiles.preferred_branch_id');
    }
    
    // ==========================================
    // PHASE 2: API ENDPOINTS CHECK
    // ==========================================
    console.log('\n\n📡 PHASE 2: API ENDPOINTS VERIFICATION\n');
    
    // Check if API routes exist in filesystem
    const fs = require('fs');
    const path = require('path');
    
    const apiRoutes = [
      'app/api/admin/branches/route.ts',
      'app/api/admin/branches/[id]/route.ts',
      'app/api/admin/branches/[id]/capsters/route.ts'
    ];
    
    apiRoutes.forEach(route => {
      const fullPath = path.join(__dirname, route);
      if (fs.existsSync(fullPath)) {
        checks.phase2.apis.push(`✅ ${route} exists`);
      } else {
        checks.phase2.apis.push(`❌ ${route} NOT found`);
      }
    });
    
    // ==========================================
    // FINAL REPORT
    // ==========================================
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📋 FINAL VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🔹 PHASE 1: DATABASE SCHEMA');
    console.log('───────────────────────────────────────────────────────────');
    console.log('Tables:');
    checks.phase1.tables.forEach(t => console.log(`  ${t}`));
    console.log('\nColumns:');
    checks.phase1.columns.forEach(c => console.log(`  ${c}`));
    console.log('\nData Status:');
    checks.phase1.data.forEach(d => console.log(`  ${d}`));
    
    console.log('\n\n🔹 PHASE 2: BACKEND APIs');
    console.log('───────────────────────────────────────────────────────────');
    checks.phase2.apis.forEach(a => console.log(`  ${a}`));
    
    // Calculate completion status
    const phase1Tables = checks.phase1.tables.filter(t => t.startsWith('✅')).length;
    const phase1Columns = checks.phase1.columns.filter(c => c.startsWith('✅')).length;
    const phase2APIs = checks.phase2.apis.filter(a => a.startsWith('✅')).length;
    
    const phase1Total = checks.phase1.tables.length + checks.phase1.columns.length;
    const phase1Complete = phase1Tables + phase1Columns;
    const phase1Percentage = phase1Total > 0 ? Math.round((phase1Complete / phase1Total) * 100) : 0;
    
    const phase2Total = checks.phase2.apis.length;
    const phase2Percentage = phase2Total > 0 ? Math.round((phase2APIs / phase2Total) * 100) : 0;
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 COMPLETION STATUS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nPHASE 1 (Database Schema): ${phase1Percentage}% Complete`);
    console.log(`  ✓ ${phase1Complete}/${phase1Total} checks passed`);
    console.log(`\nPHASE 2 (Backend APIs): ${phase2Percentage}% Complete`);
    console.log(`  ✓ ${phase2APIs}/${phase2Total} API routes found`);
    
    // Recommendations
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (phase1Percentage === 100 && phase2Percentage === 100) {
      console.log('✅ PHASE 1 & 2 COMPLETE!');
      console.log('   Ready to proceed to PHASE 3 (Frontend Components)\n');
      console.log('   Next steps:');
      console.log('   1. Admin branch management dashboard');
      console.log('   2. Customer branch selector');
      console.log('   3. Branch analytics');
    } else {
      console.log('⚠️  PHASES NOT YET COMPLETE\n');
      
      if (phase1Percentage < 100) {
        console.log('   PHASE 1 Issues:');
        checks.phase1.tables.filter(t => !t.startsWith('✅')).forEach(t => console.log(`   - ${t}`));
        checks.phase1.columns.filter(c => !c.startsWith('✅')).forEach(c => console.log(`   - ${c}`));
        console.log('\n   → Need to apply Phase 1 migration script');
      }
      
      if (phase2Percentage < 100) {
        console.log('\n   PHASE 2 Issues:');
        checks.phase2.apis.filter(a => !a.startsWith('✅')).forEach(a => console.log(`   - ${a}`));
        console.log('\n   → Need to create Phase 2 API endpoints');
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error(error);
  }
}

// Run the check
checkPhaseStatus().then(() => {
  console.log('✓ Verification complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
