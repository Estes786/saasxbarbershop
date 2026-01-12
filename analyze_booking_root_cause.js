#!/usr/bin/env node
/**
 * 🔍 DEEP ANALYSIS: Booking System Root Cause
 * Date: 2026-01-05
 * Purpose: Comprehensive analysis of booking system issues
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('\n🔍 DEEP ANALYSIS: Booking System Root Cause\n');
  console.log('='  .repeat(80));
  
  try {
    // 1. Check bookings table structure
    console.log('\n📋 1. BOOKINGS TABLE STRUCTURE:');
    const { data: bookingsInfo, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingsError) {
      console.log('❌ Error accessing bookings:', bookingsError.message);
    } else {
      console.log('✅ Bookings table accessible');
      if (bookingsInfo && bookingsInfo[0]) {
        console.log('   Columns:', Object.keys(bookingsInfo[0]).join(', '));
      }
    }
    
    // 2. Check constraints on bookings table
    console.log('\n📋 2. CONSTRAINTS ON BOOKINGS:');
    const { data: constraints } = await supabase.rpc('get_table_constraints', {
      table_name: 'bookings'
    }).catch(() => ({ data: null }));
    
    if (!constraints) {
      // Alternative query
      const { data: constraintsAlt, error: constraintsError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'bookings');
      
      if (constraintsAlt) {
        console.log('   Constraints found:', constraintsAlt.length);
        constraintsAlt.forEach(c => {
          console.log(`   - ${c.constraint_name}: ${c.constraint_type}`);
        });
      }
    }
    
    // 3. Check barbershop_customers table
    console.log('\n📋 3. BARBERSHOP_CUSTOMERS TABLE:');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('customer_phone, customer_name, barbershop_id')
      .limit(5);
    
    if (customersError) {
      console.log('❌ Error:', customersError.message);
    } else {
      console.log(`✅ Found ${customers.length} sample customers`);
      customers.forEach(c => {
        console.log(`   - ${c.customer_phone}: ${c.customer_name} (barbershop: ${c.barbershop_id})`);
      });
    }
    
    // 4. Check capsters (approved status)
    console.log('\n📋 4. CAPSTERS STATUS:');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('capster_name, status, is_active, barbershop_id, branch_id')
      .order('status');
    
    if (capstersError) {
      console.log('❌ Error:', capstersError.message);
    } else {
      const approved = capsters.filter(c => c.status === 'approved');
      const pending = capsters.filter(c => c.status === 'pending');
      const active = capsters.filter(c => c.is_active);
      
      console.log(`   Total capsters: ${capsters.length}`);
      console.log(`   ✅ Approved: ${approved.length}`);
      console.log(`   ⏳ Pending: ${pending.length}`);
      console.log(`   🟢 Active: ${active.length}`);
      
      if (approved.length === 0) {
        console.log('\n   ⚠️  WARNING: NO APPROVED CAPSTERS!');
        console.log('   This will prevent customers from making bookings.');
      }
      
      // Show capsters by branch
      const noBranch = capsters.filter(c => !c.branch_id);
      if (noBranch.length > 0) {
        console.log(`\n   ⚠️  ${noBranch.length} capsters have NO branch assigned`);
      }
    }
    
    // 5. Check service_catalog
    console.log('\n📋 5. SERVICE CATALOG:');
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('service_name, base_price, service_tier, branch_id')
      .limit(5);
    
    if (servicesError) {
      console.log('❌ Error:', servicesError.message);
    } else {
      console.log(`✅ Found ${services.length} sample services`);
      services.forEach(s => {
        console.log(`   - ${s.service_name}: Rp ${s.base_price} (${s.service_tier}) [branch: ${s.branch_id || 'NULL'}]`);
      });
      
      const noPrice = services.filter(s => !s.base_price || s.base_price === 0);
      if (noPrice.length > 0) {
        console.log(`\n   ⚠️  ${noPrice.length} services have NO base_price`);
      }
    }
    
    // 6. Check branches
    console.log('\n📋 6. BRANCHES:');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('branch_name, branch_code, address');
    
    if (branchesError) {
      console.log('❌ Error:', branchesError.message);
    } else {
      console.log(`✅ Found ${branches.length} branches`);
      branches.forEach(b => {
        console.log(`   - ${b.branch_name} (${b.branch_code}): ${b.address}`);
      });
    }
    
    // 7. Check recent booking attempts
    console.log('\n📋 7. RECENT BOOKINGS:');
    const { data: bookings, error: bookingsListError } = await supabase
      .from('bookings')
      .select('booking_date, booking_time, status, customer_phone, capster_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (bookingsListError) {
      console.log('❌ Error:', bookingsListError.message);
    } else {
      if (bookings.length === 0) {
        console.log('⚠️  NO BOOKINGS FOUND - This confirms booking is not working');
      } else {
        console.log(`✅ Found ${bookings.length} recent bookings`);
        bookings.forEach(b => {
          console.log(`   - ${b.booking_date} ${b.booking_time}: ${b.status} (${b.customer_phone})`);
        });
      }
    }
    
    // 8. ROOT CAUSE SUMMARY
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 ROOT CAUSE ANALYSIS SUMMARY:\n');
    
    const issues = [];
    
    if (capsters && capsters.filter(c => c.status === 'approved').length === 0) {
      issues.push('❌ CRITICAL: No approved capsters - customers cannot book');
    }
    
    if (customers && customers.length === 0) {
      issues.push('⚠️  No customers in barbershop_customers table');
    }
    
    if (bookings && bookings.length === 0) {
      issues.push('⚠️  No successful bookings in database');
    }
    
    if (services) {
      const noPrice = services.filter(s => !s.base_price || s.base_price === 0);
      if (noPrice.length > 0) {
        issues.push(`⚠️  ${noPrice.length} services have undefined/zero base_price`);
      }
    }
    
    if (capsters) {
      const noBranch = capsters.filter(c => !c.branch_id);
      if (noBranch.length > 0) {
        issues.push(`⚠️  ${noBranch.length} capsters not assigned to any branch`);
      }
    }
    
    if (issues.length > 0) {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('✅ No critical issues detected');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
  }
}

analyzeDatabase();
