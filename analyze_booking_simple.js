#!/usr/bin/env node
/**
 * 🔍 SIMPLE ANALYSIS: Booking System Root Cause
 * Date: 2026-01-05
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('\n🔍 BOOKING SYSTEM ROOT CAUSE ANALYSIS\n');
  console.log('='  .repeat(80));
  
  try {
    // 1. Check capsters (approved status)
    console.log('\n📋 1. CAPSTERS STATUS (CRITICAL CHECK):');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('capster_name, status, is_active, barbershop_id, branch_id');
    
    if (capstersError) {
      console.log('❌ Error:', capstersError.message);
    } else {
      const approved = capsters.filter(c => c.status === 'approved');
      const active = capsters.filter(c => c.is_active);
      const noBranch = capsters.filter(c => !c.branch_id);
      
      console.log(`   Total capsters: ${capsters.length}`);
      console.log(`   ✅ Approved: ${approved.length}`);
      console.log(`   🟢 Active: ${active.length}`);
      console.log(`   ⚠️  No branch: ${noBranch.length}`);
      
      if (approved.length === 0) {
        console.log('\n   🚨 ROOT CAUSE #1: NO APPROVED CAPSTERS!');
        console.log('   → Customers cannot make bookings without approved capsters');
      }
    }
    
    // 2. Check service_catalog prices
    console.log('\n📋 2. SERVICE CATALOG PRICES:');
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('service_name, base_price, service_tier');
    
    if (servicesError) {
      console.log('❌ Error:', servicesError.message);
    } else {
      const noPrice = services.filter(s => !s.base_price || s.base_price === 0);
      console.log(`   Total services: ${services.length}`);
      console.log(`   ⚠️  No base_price: ${noPrice.length}`);
      
      if (noPrice.length > 0) {
        console.log('\n   🚨 ROOT CAUSE #2: Services with undefined/zero price');
        noPrice.forEach(s => {
          console.log(`      - ${s.service_name}: ${s.base_price}`);
        });
      }
    }
    
    // 3. Check barbershop_customers
    console.log('\n📋 3. BARBERSHOP_CUSTOMERS:');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('customer_phone, customer_name');
    
    if (customersError) {
      console.log('❌ Error:', customersError.message);
    } else {
      console.log(`   Total customers: ${customers.length}`);
      
      if (customers.length === 0) {
        console.log('\n   🚨 ROOT CAUSE #3: NO customers in barbershop_customers');
        console.log('   → Foreign key constraint will fail if customer not created first');
      }
    }
    
    // 4. Check recent bookings
    console.log('\n📋 4. BOOKINGS (Success Check):');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_date, status, customer_phone')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (bookingsError) {
      console.log('❌ Error:', bookingsError.message);
    } else {
      console.log(`   Recent bookings: ${bookings.length}`);
      
      if (bookings.length === 0) {
        console.log('\n   🚨 CONFIRMATION: Zero bookings in database');
        console.log('   → This confirms booking creation is failing');
      } else {
        bookings.forEach(b => {
          console.log(`   - ${b.booking_date}: ${b.status} (${b.customer_phone})`);
        });
      }
    }
    
    // 5. SOLUTION SUMMARY
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 ROOT CAUSE SUMMARY & SOLUTIONS:\n');
    
    let issueCount = 0;
    
    if (capsters && capsters.filter(c => c.status === 'approved').length === 0) {
      issueCount++;
      console.log(`${issueCount}. 🚨 CRITICAL: No approved capsters`);
      console.log('   SOLUTION: Auto-approve all active capsters');
      console.log('   SQL: UPDATE capsters SET status = \'approved\' WHERE is_active = true;\n');
    }
    
    if (services) {
      const noPrice = services.filter(s => !s.base_price || s.base_price === 0);
      if (noPrice.length > 0) {
        issueCount++;
        console.log(`${issueCount}. ⚠️  ${noPrice.length} services have no base_price`);
        console.log('   SOLUTION: Set default prices for services without price\n');
      }
    }
    
    if (customers && customers.length === 0) {
      issueCount++;
      console.log(`${issueCount}. ⚠️  No customers in barbershop_customers`);
      console.log('   SOLUTION: Auto-create customer record during booking\n');
    }
    
    if (capsters) {
      const noBranch = capsters.filter(c => !c.branch_id);
      if (noBranch.length > 0) {
        issueCount++;
        console.log(`${issueCount}. ⚠️  ${noBranch.length} capsters not assigned to branch`);
        console.log('   SOLUTION: Allow NULL branch_id OR assign default branch\n');
      }
    }
    
    if (issueCount === 0) {
      console.log('✅ No critical issues found!');
    } else {
      console.log(`\nTotal issues found: ${issueCount}`);
      console.log('\n💡 Next step: Apply SQL fixes to resolve these issues');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
  }
}

analyzeDatabase();
