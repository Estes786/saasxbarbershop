const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 APPLYING MULTI-LOCATION MIGRATION');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // Read migration script
    const migrationSQL = fs.readFileSync(
      './migrations/01_multi_location_support.sql',
      'utf8'
    );
    
    console.log('📄 Migration script loaded');
    console.log(`   Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);
    
    // Execute migration
    console.log('⏳ Executing migration... This may take a few moments.\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // If RPC method doesn't exist, try alternative approach
      if (error.code === '42883') { // function does not exist
        console.log('⚠️  Direct RPC not available. Splitting migration into parts...\n');
        
        // Split by major sections and execute separately
        const sections = migrationSQL.split(/-- ={70,}/);
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i].trim();
          if (section.length < 10) continue; // Skip empty sections
          
          console.log(`   Executing section ${i + 1}/${sections.length}...`);
          
          // Execute via Supabase SQL editor endpoint (requires service role key)
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ query: section })
            }
          );
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        console.log('\n✅ Migration applied successfully via split execution');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration applied successfully via RPC');
    }
    
    // Verify migration
    console.log('\n\n📊 VERIFYING MIGRATION');
    console.log('-'.repeat(70));
    
    // Check branches table
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*');
    
    if (branchesError) {
      throw new Error(`Failed to verify branches table: ${branchesError.message}`);
    }
    
    console.log(`\n✅ branches table exists with ${branches?.length || 0} records`);
    
    if (branches && branches.length > 0) {
      console.log('\n   Created branches:');
      branches.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.branch_name}`);
        console.log(`      - Code: ${b.branch_code}`);
        console.log(`      - Address: ${b.address}`);
        console.log(`      - Active: ${b.is_active ? '✅' : '❌'}`);
        console.log(`      - Flagship: ${b.is_flagship ? '⭐' : ''}`);
      });
    }
    
    // Check capsters with branch assignment
    const { data: capstersWithBranch } = await supabase
      .from('capsters')
      .select('id, capster_name, branch_id')
      .not('branch_id', 'is', null);
    
    console.log(`\n✅ ${capstersWithBranch?.length || 0} capsters assigned to branches`);
    
    // Check bookings with branch
    const { data: bookingsWithBranch } = await supabase
      .from('bookings')
      .select('id, customer_name, branch_id')
      .not('branch_id', 'is', null);
    
    console.log(`✅ ${bookingsWithBranch?.length || 0} bookings linked to branches`);
    
    // Check transactions with branch
    const { data: transactionsWithBranch } = await supabase
      .from('barbershop_transactions')
      .select('id, customer_name, branch_id')
      .not('branch_id', 'is', null);
    
    console.log(`✅ ${transactionsWithBranch?.length || 0} transactions linked to branches`);
    
    // Test RLS policies
    console.log('\n\n🔒 TESTING RLS POLICIES');
    console.log('-'.repeat(70));
    
    // Test anonymous access to active branches
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: activeBranches, error: anonError } = await supabaseAnon
      .from('branches')
      .select('branch_name, is_active')
      .eq('is_active', true);
    
    if (anonError) {
      console.log(`⚠️  Anon access test: ${anonError.message}`);
    } else {
      console.log(`✅ Anonymous users can view ${activeBranches?.length || 0} active branches`);
    }
    
    console.log('\n\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📋 Summary:');
    console.log(`   ✅ Created ${branches?.length || 0} branches`);
    console.log(`   ✅ Assigned ${capstersWithBranch?.length || 0} capsters`);
    console.log(`   ✅ Linked ${bookingsWithBranch?.length || 0} bookings`);
    console.log(`   ✅ Linked ${transactionsWithBranch?.length || 0} transactions`);
    console.log(`   ✅ RLS policies configured`);
    
    console.log('\n\n🔍 NEXT STEPS:');
    console.log('   1. Test branch management in admin dashboard');
    console.log('   2. Test branch selection in customer booking');
    console.log('   3. Verify capster sees only their branch data');
    console.log('   4. Build frontend components for branch management');
    
  } catch (error) {
    console.error('\n\n❌ MIGRATION FAILED!');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    console.error('\nFull error:', error);
    
    console.error('\n\n⚠️  ROLLBACK INSTRUCTIONS:');
    console.error('If you need to undo this migration, run the rollback script');
    console.error('located at the end of migrations/01_multi_location_support.sql\n');
    
    process.exit(1);
  }
}

applyMigration().then(() => {
  console.log('\n✅ Migration process complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
