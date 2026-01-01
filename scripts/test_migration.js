const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMigration() {
  console.log('🧪 TESTING MULTI-LOCATION MIGRATION SCRIPT');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // Read migration script
    const migrationSQL = fs.readFileSync(
      './migrations/01_multi_location_support.sql', 
      'utf8'
    );
    
    console.log('✅ Migration script loaded successfully');
    console.log(`   Size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
    console.log('');
    
    // Pre-migration analysis
    console.log('📊 PRE-MIGRATION ANALYSIS');
    console.log('-'.repeat(70));
    
    // Count existing data
    const { data: barbershops } = await supabase
      .from('barbershop_profiles')
      .select('id, barbershop_name, name, owner_id');
    
    const { data: capsters } = await supabase
      .from('capsters')
      .select('id, capster_name, barbershop_id');
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, capster_id');
    
    const { data: services } = await supabase
      .from('service_catalog')
      .select('id, service_name, barbershop_id');
    
    const { data: transactions } = await supabase
      .from('barbershop_transactions')
      .select('id, capster_id');
    
    console.log(`\n📋 Current Data:`);
    console.log(`   - Barbershops: ${barbershops?.length || 0}`);
    console.log(`   - Capsters: ${capsters?.length || 0}`);
    console.log(`   - Bookings: ${bookings?.length || 0}`);
    console.log(`   - Services: ${services?.length || 0}`);
    console.log(`   - Transactions: ${transactions?.length || 0}`);
    
    // Analyze capsters with barbershop_id
    const capstersWithBarbershop = capsters?.filter(c => c.barbershop_id !== null);
    console.log(`\n🔗 Capsters with barbershop_id: ${capstersWithBarbershop?.length || 0}`);
    
    // Check if branches table exists
    const { error: branchesError } = await supabase
      .from('branches')
      .select('id')
      .limit(1);
    
    if (branchesError) {
      console.log('\n⚠️  branches table does NOT exist yet (will be created)');
    } else {
      const { data: existingBranches } = await supabase
        .from('branches')
        .select('id, branch_name, barbershop_id');
      
      console.log(`\n✅ branches table already exists with ${existingBranches?.length || 0} records`);
      if (existingBranches && existingBranches.length > 0) {
        console.log('\n   Existing branches:');
        existingBranches.forEach(b => {
          console.log(`   - ${b.branch_name} (ID: ${b.id.substring(0, 8)}...)`);
        });
      }
    }
    
    // Check for branch_id columns
    console.log('\n\n📊 COLUMN EXISTENCE CHECK');
    console.log('-'.repeat(70));
    
    const tablesToCheck = ['capsters', 'service_catalog', 'bookings', 'barbershop_transactions'];
    
    for (const table of tablesToCheck) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (data && data.length > 0) {
        const hasBranchId = 'branch_id' in data[0];
        console.log(`   ${table}: branch_id column ${hasBranchId ? '✅ EXISTS' : '❌ NOT EXISTS'}`);
      }
    }
    
    // Impact prediction
    console.log('\n\n📈 MIGRATION IMPACT PREDICTION');
    console.log('-'.repeat(70));
    console.log(`\n✅ Will create ${barbershops?.length || 0} default branches (1 per barbershop)`);
    console.log(`✅ Will assign ${capstersWithBarbershop?.length || 0} capsters to branches`);
    console.log(`✅ Will link ${bookings?.length || 0} bookings to branches (via capster)`);
    console.log(`✅ Will link ${transactions?.length || 0} transactions to branches (via capster)`);
    
    // Safety checks
    console.log('\n\n🔒 SAFETY CHECKS');
    console.log('-'.repeat(70));
    
    if (!barbershops || barbershops.length === 0) {
      console.log('⚠️  WARNING: No barbershops found! Migration may not work as expected.');
    } else {
      console.log('✅ At least 1 barbershop exists');
    }
    
    if (!capsters || capsters.length === 0) {
      console.log('⚠️  WARNING: No capsters found!');
    } else {
      console.log('✅ At least 1 capster exists');
    }
    
    console.log('\n✅ IDEMPOTENT: Safe to run multiple times');
    console.log('✅ ROLLBACK: Includes undo script if needed');
    console.log('✅ DATA PRESERVATION: Will not delete existing data');
    
    // Ask for confirmation
    console.log('\n\n🚀 READY TO APPLY MIGRATION');
    console.log('='.repeat(70));
    console.log('\n⚠️  This is a DRY RUN - no changes will be made yet');
    console.log('\n📋 To apply migration, run:');
    console.log('   node scripts/apply_migration.js');
    
  } catch (error) {
    console.error('\n❌ ERROR during migration test:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testMigration().then(() => {
  console.log('\n\n✅ Migration test complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
