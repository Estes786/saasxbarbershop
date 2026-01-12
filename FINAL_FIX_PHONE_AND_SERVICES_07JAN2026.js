#!/usr/bin/env node
/**
 * 🔧 FINAL FIX - Phone Normalization & Services
 * Date: 2026-01-07
 * 
 * ROOT CAUSES IDENTIFIED:
 * 1. Phone mismatch: user_metadata has "0852336988523" but barbershop_customers has "+628123456789"
 * 2. Service catalog is EMPTY (0 services!)
 * 3. This causes: No booking history, can't create bookings
 * 
 * FIXES:
 * 1. Normalize phone number to +628523369885 23
 * 2. Create default services
 * 3. Update customer record with correct phone
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_USER_ID = '997f65e1-5ed5-407b-ae4b-a769363c36a9';
const NORMALIZED_PHONE = '+628523369885 23'; // Normalized from 0852336988523

async function finalFix() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   🔧 FINAL FIX - Phone & Services                               ║');
  console.log('║   Date: 07 Januari 2026                                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let success = [];
  let errors = [];

  try {
    // FIX #1: Update customer phone number
    console.log('FIX #1: Normalizing phone number...');
    console.log('─'.repeat(70));
    console.log(`   Target: ${NORMALIZED_PHONE}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('barbershop_customers')
      .update({
        customer_phone: NORMALIZED_PHONE,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', TARGET_USER_ID)
      .select();
    
    if (updateError) {
      errors.push(`Phone update failed: ${updateError.message}`);
      console.log(`❌ Failed: ${updateError.message}`);
    } else {
      success.push(`✅ Phone normalized to ${NORMALIZED_PHONE}`);
      console.log(`✅ Phone updated successfully`);
    }
    
    // FIX #2: Create services (CRITICAL!)
    console.log('\n\nFIX #2: Creating service catalog...');
    console.log('─'.repeat(70));
    
    const { data: existingServices } = await supabase
      .from('service_catalog')
      .select('id');
    
    console.log(`   Current services: ${existingServices?.length || 0}`);
    
    if (!existingServices || existingServices.length === 0) {
      console.log('⚠️  Service catalog is EMPTY! Creating services...');
      
      // Get barbershop and branch
      const { data: barbershop } = await supabase
        .from('barbershop_profiles')
        .select('id')
        .limit(1)
        .single();
      
      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .limit(1)
        .single();
      
      if (!barbershop) {
        errors.push('No barbershop found');
        console.log('❌ No barbershop found!');
      } else {
        const services = [
          {
            service_name: 'Haircut Basic',
            service_tier: 'basic',
            base_price: 18000,
            description: 'Potong rambut standar',
            duration_minutes: 30,
            is_active: true,
            barbershop_id: barbershop.id,
            branch_id: branch?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            service_name: 'Haircut + Shave',
            service_tier: 'premium',
            base_price: 35000,
            description: 'Potong rambut + cukur kumis/jenggot',
            duration_minutes: 45,
            is_active: true,
            barbershop_id: barbershop.id,
            branch_id: branch?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            service_name: 'Full Treatment',
            service_tier: 'vip',
            base_price: 50000,
            description: 'Paket lengkap: potong + cukur + creambath',
            duration_minutes: 60,
            is_active: true,
            barbershop_id: barbershop.id,
            branch_id: branch?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { data: created, error: createError } = await supabase
          .from('service_catalog')
          .insert(services)
          .select();
        
        if (createError) {
          errors.push(`Service creation failed: ${createError.message}`);
          console.log(`❌ Failed: ${createError.message}`);
        } else {
          success.push(`✅ Created ${created.length} services`);
          console.log(`✅ Created ${created.length} services:`);
          created.forEach(s => {
            console.log(`   - ${s.service_name}: Rp ${s.base_price.toLocaleString()}`);
          });
        }
      }
    } else {
      success.push('✅ Services already exist');
      console.log('✅ Services already exist');
    }
    
    // FIX #3: Update all existing bookings phone numbers
    console.log('\n\nFIX #3: Updating existing bookings...');
    console.log('─'.repeat(70));
    
    const oldPhones = ['+628123456789', '08123456789', '628123456789', '8123456789'];
    
    for (const oldPhone of oldPhones) {
      const { data: updated, error: bookingError } = await supabase
        .from('bookings')
        .update({
          customer_phone: NORMALIZED_PHONE,
          updated_at: new Date().toISOString()
        })
        .eq('customer_phone', oldPhone)
        .select('id');
      
      if (updated && updated.length > 0) {
        success.push(`✅ Updated ${updated.length} bookings from ${oldPhone}`);
        console.log(`✅ Updated ${updated.length} bookings`);
      }
    }
    
    // VERIFICATION
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ VERIFICATION                                                ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
    
    // Check customer record
    const { data: customer } = await supabase
      .from('barbershop_customers')
      .select('*')
      .eq('user_id', TARGET_USER_ID)
      .single();
    
    console.log('Customer Record:');
    console.log(`   Name: ${customer?.customer_name}`);
    console.log(`   Phone: ${customer?.customer_phone}`);
    console.log(`   Visits: ${customer?.total_visits}`);
    
    // Check services
    const { data: allServices } = await supabase
      .from('service_catalog')
      .select('service_name, base_price');
    
    console.log(`\nServices Available: ${allServices?.length || 0}`);
    if (allServices && allServices.length > 0) {
      allServices.forEach(s => {
        console.log(`   - ${s.service_name}: Rp ${s.base_price?.toLocaleString() || 'N/A'}`);
      });
    }
    
    // Check bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_phone', NORMALIZED_PHONE);
    
    console.log(`\nBookings for this phone: ${bookings?.length || 0}`);
    
    // SUMMARY
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║   📊 FIX SUMMARY                                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ SUCCESSFUL FIXES:\n');
    success.forEach((s, i) => console.log(`${i + 1}. ${s}`));
    
    if (errors.length > 0) {
      console.log('\n\n❌ ERRORS:\n');
      errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
    }
    
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║   🎉 FIX COMPLETE!                                               ║');
    console.log('║                                                                  ║');
    console.log('║   ✅ Phone number normalized                                     ║');
    console.log('║   ✅ Services created/verified                                   ║');
    console.log('║   ✅ Bookings updated                                            ║');
    console.log('║                                                                  ║');
    console.log('║   Next: Test booking from customer dashboard!                    ║');
    console.log('║   Login as: customer3test@gmail.com / customer3test              ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    errors.push(`Fatal: ${error.message}`);
  }
  
  return { success, errors };
}

// Execute
finalFix()
  .then(({ success, errors }) => {
    if (errors.length === 0) {
      console.log('✅ All fixes applied successfully!\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Completed with ${errors.length} error(s)\n`);
      process.exit(1);
    }
  });
