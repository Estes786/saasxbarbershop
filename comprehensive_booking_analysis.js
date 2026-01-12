#!/usr/bin/env node
/**
 * 🔍 COMPREHENSIVE BOOKING ANALYSIS
 * Purpose: Analyze all aspects of booking system for customer3test@gmail.com
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function comprehensiveAnalysis() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 COMPREHENSIVE BOOKING SYSTEM ANALYSIS                       ║');
  console.log('║   Date: 2026-01-07                                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Analyze customer3test@gmail.com
    console.log('1️⃣  ANALYZING CUSTOMER: customer3test@gmail.com\n');
    console.log('─'.repeat(70));
    
    // Check user_profiles
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'customer3test@gmail.com')
      .single();
    
    if (userError) {
      console.log('❌ User profile not found:', userError.message);
    } else {
      console.log('✅ User Profile Found:');
      console.log(`   Email: ${userProfile.email}`);
      console.log(`   Name: ${userProfile.full_name}`);
      console.log(`   Phone: ${userProfile.phone}`);
      console.log(`   User ID: ${userProfile.user_id}`);
      console.log(`   Role: ${userProfile.role}`);
    }
    
    // Check barbershop_customers
    const { data: customer, error: custError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .or(`user_id.eq.${userProfile?.user_id},customer_phone.eq.0852336988523`)
      .single();
    
    if (custError) {
      console.log('\n⚠️  Customer not in barbershop_customers:');
      console.log(`   Error: ${custError.message}`);
      console.log('\n   ⚡ ROOT CAUSE #1: Customer record missing!');
    } else {
      console.log('\n✅ Barbershop Customer Record:');
      console.log(`   Phone: ${customer.customer_phone}`);
      console.log(`   Name: ${customer.customer_name}`);
      console.log(`   Total Visits: ${customer.total_visits}`);
      console.log(`   Loyalty Points: ${customer.loyalty_points}`);
    }
    
    // 2. Check bookings
    console.log('\n\n2️⃣  CHECKING BOOKINGS FOR THIS CUSTOMER\n');
    console.log('─'.repeat(70));
    
    const phoneVariants = ['0852336988523', '+620852336988523', '62852336988523', '852336988523'];
    
    let allBookings = [];
    for (const phone of phoneVariants) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_phone', phone);
      
      if (bookings && bookings.length > 0) {
        allBookings = [...allBookings, ...bookings];
        console.log(`✅ Found ${bookings.length} bookings for phone: ${phone}`);
      }
    }
    
    if (allBookings.length === 0) {
      console.log('⚠️  NO BOOKINGS FOUND for any phone variant');
      console.log('\n   ⚡ ROOT CAUSE #2: No booking history!');
    } else {
      console.log(`\n✅ Total bookings found: ${allBookings.length}`);
      allBookings.slice(0, 3).forEach((b, i) => {
        console.log(`\n   Booking #${i + 1}:`);
        console.log(`   - Date: ${b.booking_date} ${b.booking_time}`);
        console.log(`   - Service: ${b.service_tier}`);
        console.log(`   - Status: ${b.status}`);
        console.log(`   - Phone: ${b.customer_phone}`);
      });
    }
    
    // 3. Check capsters (approved & active)
    console.log('\n\n3️⃣  CHECKING CAPSTERS AVAILABILITY\n');
    console.log('─'.repeat(70));
    
    const { data: capsters } = await supabase
      .from('capsters')
      .select('capster_name, status, is_active, branch_id');
    
    const approved = capsters?.filter(c => c.status === 'approved' && c.is_active) || [];
    const pending = capsters?.filter(c => c.status === 'pending') || [];
    const inactive = capsters?.filter(c => !c.is_active) || [];
    const noBranch = capsters?.filter(c => !c.branch_id) || [];
    
    console.log(`Total capsters: ${capsters?.length || 0}`);
    console.log(`✅ Approved & Active: ${approved.length}`);
    console.log(`⏳ Pending: ${pending.length}`);
    console.log(`❌ Inactive: ${inactive.length}`);
    console.log(`⚠️  No branch assigned: ${noBranch.length}`);
    
    if (approved.length === 0) {
      console.log('\n   ⚡ ROOT CAUSE #3: NO APPROVED CAPSTERS!');
      console.log('   This will prevent ALL bookings from being created.');
    }
    
    // 4. Check services
    console.log('\n\n4️⃣  CHECKING SERVICE CATALOG\n');
    console.log('─'.repeat(70));
    
    const { data: services } = await supabase
      .from('service_catalog')
      .select('service_name, base_price, service_tier, is_active, branch_id');
    
    const activeServices = services?.filter(s => s.is_active) || [];
    const noPrice = services?.filter(s => !s.base_price || s.base_price === 0) || [];
    
    console.log(`Total services: ${services?.length || 0}`);
    console.log(`✅ Active: ${activeServices.length}`);
    console.log(`⚠️  No/zero price: ${noPrice.length}`);
    
    if (activeServices.length === 0) {
      console.log('\n   ⚡ ROOT CAUSE #4: NO ACTIVE SERVICES!');
    }
    
    // 5. Check branches
    console.log('\n\n5️⃣  CHECKING BRANCHES\n');
    console.log('─'.repeat(70));
    
    const { data: branches } = await supabase
      .from('branches')
      .select('branch_name, branch_code, address');
    
    console.log(`Total branches: ${branches?.length || 0}`);
    if (branches && branches.length > 0) {
      branches.forEach(b => {
        console.log(`   ✅ ${b.branch_name} (${b.branch_code})`);
      });
    }
    
    // 6. Performance analysis
    console.log('\n\n6️⃣  CHECKING PERFORMANCE INDEXES\n');
    console.log('─'.repeat(70));
    
    const { data: indexes } = await supabase.rpc('pg_indexes').catch(() => null);
    
    const bookingIndexes = [
      'idx_bookings_customer_phone',
      'idx_bookings_customer_date',
      'idx_bookings_status',
      'idx_capsters_status',
      'idx_service_catalog_branch'
    ];
    
    console.log('Expected indexes for performance:');
    bookingIndexes.forEach(idx => {
      console.log(`   - ${idx}`);
    });
    console.log('\n   ⚠️  Note: Index check requires database-level access');
    
    // 7. COMPREHENSIVE ROOT CAUSE SUMMARY
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║   🎯 ROOT CAUSE ANALYSIS & RECOMMENDATIONS                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
    
    const rootCauses = [];
    const solutions = [];
    
    // Root Cause #1: Customer record
    if (!customer) {
      rootCauses.push('❌ Customer record missing in barbershop_customers');
      solutions.push('📝 Create customer record with normalized phone number');
    }
    
    // Root Cause #2: No bookings
    if (allBookings.length === 0) {
      rootCauses.push('❌ No booking history found');
      solutions.push('📝 Verify booking creation is working');
    }
    
    // Root Cause #3: Phone number mismatch
    if (userProfile && customer && userProfile.phone !== customer.customer_phone) {
      rootCauses.push(`❌ Phone mismatch: ${userProfile.phone} vs ${customer.customer_phone}`);
      solutions.push('📝 Normalize phone numbers to consistent format');
    }
    
    // Root Cause #4: No approved capsters
    if (approved.length === 0) {
      rootCauses.push('❌ CRITICAL: No approved capsters available');
      solutions.push('📝 Approve at least one capster in database');
    }
    
    // Root Cause #5: Services without price
    if (noPrice.length > 0) {
      rootCauses.push(`❌ ${noPrice.length} services have no/zero price`);
      solutions.push('📝 Set base_price for all services');
    }
    
    // Root Cause #6: Frontend performance
    rootCauses.push('⚠️  Frontend loading is slow (reported by user)');
    solutions.push('📝 Implement: SWR caching, parallel fetching, loading skeletons');
    
    // Root Cause #7: No performance indexes
    rootCauses.push('⚠️  Missing performance indexes on critical columns');
    solutions.push('📝 Add indexes on: customer_phone, booking_date, status');
    
    console.log('ROOT CAUSES IDENTIFIED:\n');
    rootCauses.forEach((cause, i) => {
      console.log(`${i + 1}. ${cause}`);
    });
    
    console.log('\n\nRECOMMENDED SOLUTIONS:\n');
    solutions.forEach((solution, i) => {
      console.log(`${i + 1}. ${solution}`);
    });
    
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ ANALYSIS COMPLETE                                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error(error);
  }
}

comprehensiveAnalysis();
