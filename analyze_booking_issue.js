#!/usr/bin/env node

/**
 * 🔍 BOOKING ISSUE ANALYSIS SCRIPT
 * Analyze database schema and booking flow for BALIK.LAGI system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING BALIK.LAGI DATABASE SCHEMA\n');
  console.log('='.repeat(80));

  try {
    // 1. Check tables existence
    console.log('\n📊 1. CHECKING TABLES');
    const tables = [
      'barbershop_profiles',
      'barbershop_customers',
      'capsters',
      'service_catalog',
      'bookings',
      'branches',
      'user_profiles'
    ];

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: NOT EXISTS or ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
      }
    }

    // 2. Check barbershop_profiles
    console.log('\n📊 2. BARBERSHOP PROFILES');
    const { data: barbershops, error: bbError } = await supabase
      .from('barbershop_profiles')
      .select('barbershop_id, barbershop_name, created_at')
      .limit(5);

    if (bbError) {
      console.log('❌ Error:', bbError.message);
    } else if (barbershops && barbershops.length > 0) {
      console.log(`✅ Found ${barbershops.length} barbershop(s):`);
      barbershops.forEach(bb => {
        console.log(`   - ${bb.barbershop_name} (${bb.barbershop_id})`);
      });
    } else {
      console.log('⚠️  No barbershops found!');
    }

    // 3. Check barbershop_customers
    console.log('\n📊 3. BARBERSHOP CUSTOMERS');
    const { data: customers, error: custError, count: custCount } = await supabase
      .from('barbershop_customers')
      .select('customer_phone, customer_name', { count: 'exact' })
      .limit(5);

    if (custError) {
      console.log('❌ Error:', custError.message);
    } else {
      console.log(`✅ Found ${custCount || 0} customer(s)`);
      if (customers && customers.length > 0) {
        customers.forEach(c => {
          console.log(`   - ${c.customer_name} (${c.customer_phone})`);
        });
      }
    }

    // 4. Check capsters
    console.log('\n📊 4. CAPSTERS');
    const { data: capsters, error: capError, count: capCount } = await supabase
      .from('capsters')
      .select('capster_id, capster_name, branch_id, status', { count: 'exact' })
      .limit(5);

    if (capError) {
      console.log('❌ Error:', capError.message);
    } else {
      console.log(`✅ Found ${capCount || 0} capster(s)`);
      if (capsters && capsters.length > 0) {
        capsters.forEach(c => {
          console.log(`   - ${c.capster_name} (${c.capster_id}) - Branch: ${c.branch_id || 'N/A'} - Status: ${c.status}`);
        });
      }
    }

    // 5. Check service_catalog
    console.log('\n📊 5. SERVICE CATALOG');
    const { data: services, error: svcError, count: svcCount } = await supabase
      .from('service_catalog')
      .select('service_id, service_name, base_price', { count: 'exact' })
      .limit(5);

    if (svcError) {
      console.log('❌ Error:', svcError.message);
    } else {
      console.log(`✅ Found ${svcCount || 0} service(s)`);
      if (services && services.length > 0) {
        services.forEach(s => {
          console.log(`   - ${s.service_name} (Rp ${s.base_price})`);
        });
      }
    }

    // 6. Check bookings
    console.log('\n📊 6. BOOKINGS');
    const { data: bookings, error: bkError, count: bkCount } = await supabase
      .from('bookings')
      .select('booking_id, customer_phone, booking_date, booking_time, status', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);

    if (bkError) {
      console.log('❌ Error:', bkError.message);
    } else {
      console.log(`✅ Found ${bkCount || 0} booking(s)`);
      if (bookings && bookings.length > 0) {
        bookings.forEach(b => {
          console.log(`   - ${b.booking_id.substring(0, 8)}... | ${b.customer_phone} | ${b.booking_date} ${b.booking_time} | ${b.status}`);
        });
      } else {
        console.log('   ⚠️  No bookings yet!');
      }
    }

    // 7. Check foreign key constraints
    console.log('\n📊 7. FOREIGN KEY CONSTRAINTS CHECK');
    
    // Check if customer_phone exists in barbershop_customers
    const { data: testCustomer } = await supabase
      .from('barbershop_customers')
      .select('customer_phone')
      .limit(1)
      .single();

    if (testCustomer) {
      console.log(`✅ Test customer exists: ${testCustomer.customer_phone}`);
      
      // Try to query bookings for this customer
      const { data: custBookings, error: custBkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_phone', testCustomer.customer_phone);

      if (custBkError) {
        console.log(`❌ Error querying bookings: ${custBkError.message}`);
      } else {
        console.log(`✅ Customer has ${custBookings ? custBookings.length : 0} booking(s)`);
      }
    }

    // 8. Check branches
    console.log('\n📊 8. BRANCHES (Multi-Location)');
    const { data: branches, error: brError, count: brCount } = await supabase
      .from('branches')
      .select('branch_id, branch_name, branch_code', { count: 'exact' });

    if (brError) {
      console.log('❌ Error:', brError.message);
    } else {
      console.log(`✅ Found ${brCount || 0} branch(es)`);
      if (branches && branches.length > 0) {
        branches.forEach(b => {
          console.log(`   - ${b.branch_name} (${b.branch_code})`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run analysis
analyzeDatabase().then(() => {
  console.log('🎯 Next: Check if booking form can create bookings');
  process.exit(0);
}).catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
