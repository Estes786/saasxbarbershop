#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function applySQLFix() {
  console.log('\n🚀 APPLYING 1 USER = 1 DASHBOARD FIX...\n');
  console.log('========================================');
  
  try {
    // STEP 1: Analyze current state
    console.log('\n📊 STEP 1: Analyzing current state...');
    
    const { data: customersBefore, error: beforeError } = await supabase
      .from('barbershop_customers')
      .select('user_id, customer_phone, customer_name');
    
    if (beforeError) throw beforeError;
    
    const totalBefore = customersBefore.length;
    const linkedBefore = customersBefore.filter(c => c.user_id !== null).length;
    const orphanedBefore = customersBefore.filter(c => c.user_id === null).length;
    
    console.log(`Total customers: ${totalBefore}`);
    console.log(`Linked: ${linkedBefore} (${(linkedBefore/totalBefore*100).toFixed(1)}%)`);
    console.log(`Orphaned: ${orphanedBefore} (${(orphanedBefore/totalBefore*100).toFixed(1)}%)`);
    
    // STEP 2: Fix orphaned records
    if (orphanedBefore > 0) {
      console.log('\n📊 STEP 2: Fixing orphaned records...');
      
      // Get orphaned customers
      const orphaned = customersBefore.filter(c => c.user_id === null);
      
      console.log(`Found ${orphaned.length} orphaned records`);
      
      // Match each orphaned customer to user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, customer_phone, role')
        .eq('role', 'customer');
      
      let fixedCount = 0;
      
      for (const customer of orphaned) {
        // Find matching user profile
        const matchingProfile = profiles.find(p => p.customer_phone === customer.customer_phone);
        
        if (matchingProfile) {
          // Update customer record with user_id
          const { error: updateError } = await supabase
            .from('barbershop_customers')
            .update({ 
              user_id: matchingProfile.id,
              updated_at: new Date().toISOString()
            })
            .eq('customer_phone', customer.customer_phone)
            .is('user_id', null);
          
          if (updateError) {
            console.log(`   ⚠️  Failed to link ${customer.customer_phone}: ${updateError.message}`);
          } else {
            fixedCount++;
            console.log(`   ✅ Linked ${customer.customer_name} (${customer.customer_phone}) to user ${matchingProfile.id}`);
          }
        } else {
          console.log(`   ⚠️  No matching user_profile for ${customer.customer_phone}`);
        }
      }
      
      console.log(`\n✅ Fixed ${fixedCount} out of ${orphanedBefore} orphaned records`);
    } else {
      console.log('\n📊 STEP 2: No orphaned records - skipping fix');
    }
    
    // STEP 3: Verify results
    console.log('\n📊 STEP 3: Verifying results...');
    
    const { data: customersAfter, error: afterError } = await supabase
      .from('barbershop_customers')
      .select('user_id, customer_phone, customer_name');
    
    if (afterError) throw afterError;
    
    const totalAfter = customersAfter.length;
    const linkedAfter = customersAfter.filter(c => c.user_id !== null).length;
    const orphanedAfter = customersAfter.filter(c => c.user_id === null).length;
    
    console.log('\n========================================');
    console.log('✅ FIX COMPLETED!');
    console.log('========================================');
    console.log('BEFORE:');
    console.log(`   Total: ${totalBefore}`);
    console.log(`   Linked: ${linkedBefore} (${(linkedBefore/totalBefore*100).toFixed(1)}%)`);
    console.log(`   Orphaned: ${orphanedBefore} (${(orphanedBefore/totalBefore*100).toFixed(1)}%)`);
    console.log('');
    console.log('AFTER:');
    console.log(`   Total: ${totalAfter}`);
    console.log(`   Linked: ${linkedAfter} (${(linkedAfter/totalAfter*100).toFixed(1)}%)`);
    console.log(`   Orphaned: ${orphanedAfter} (${(orphanedAfter/totalAfter*100).toFixed(1)}%)`);
    console.log('');
    console.log(`📊 Fixed: ${orphanedBefore - orphanedAfter} records`);
    console.log('========================================');
    
    if (orphanedAfter === 0) {
      console.log('\n🎉 SUCCESS! All customers linked to users');
      console.log('✅ 1 USER = 1 ROLE = 1 DASHBOARD achieved!');
      console.log('');
      console.log('📝 NEXT STEPS:');
      console.log('   1. Update application code to use user_id');
      console.log('   2. Test with multiple users');
      console.log('   3. Deploy to production');
    } else {
      console.log(`\n⚠️  Warning: ${orphanedAfter} orphaned records remaining`);
      console.log('   These records have no matching user_profiles');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run fix
applySQLFix();
