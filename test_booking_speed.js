import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingSpeed() {
  console.log('\n🚀 TESTING BOOKING SYSTEM PERFORMANCE\n');

  // 1. Test fetching services
  console.log('1️⃣ Testing service fetch speed...');
  let startTime = Date.now();
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('id, branch_name')
    .eq('is_active', true)
    .limit(1);
  
  if (branchError || !branches || branches.length === 0) {
    console.error('❌ No active branches found');
    return;
  }
  
  const branchId = branches[0].id;
  console.log(`✅ Branch: ${branches[0].branch_name} (${Date.now() - startTime}ms)`);

  startTime = Date.now();
  const { data: services } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price')
    .eq('branch_id', branchId)
    .eq('is_active', true);
  let duration = Date.now() - startTime;
  console.log(`✅ Loaded ${services?.length || 0} services in ${duration}ms ${duration > 500 ? '⚠️ SLOW' : ''}`);

  // 2. Test fetching capsters
  console.log('\n2️⃣ Testing capster fetch speed...');
  startTime = Date.now();
  const { data: capsters } = await supabase
    .from('capsters')
    .select('id, capster_name, specialization')
    .eq('branch_id', branchId)
    .eq('is_available', true);
  duration = Date.now() - startTime;
  console.log(`✅ Loaded ${capsters?.length || 0} capsters in ${duration}ms ${duration > 500 ? '⚠️ SLOW' : ''}`);

  // 3. Test booking insertion
  if (services && services.length > 0 && capsters && capsters.length > 0) {
    console.log('\n3️⃣ Testing booking insertion speed...');
    
    const testBooking = {
      customer_phone: '+628123456789',
      customer_name: 'Performance Test',
      branch_id: branchId,
      service_id: services[0].id,
      capster_id: capsters[0].id,
      booking_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      booking_time: '10:00',
      service_tier: 'Basic',
      customer_notes: 'PERFORMANCE_TEST_DELETE_ME',
      status: 'pending',
      booking_source: 'online'
    };

    startTime = Date.now();
    const { data: insertResult, error: insertError } = await supabase
      .from('bookings')
      .insert(testBooking)
      .select();
    duration = Date.now() - startTime;

    if (insertError) {
      console.error(`❌ Booking insertion failed in ${duration}ms:`, insertError.message);
    } else {
      console.log(`✅ Booking inserted in ${duration}ms ${duration > 1000 ? '⚠️ SLOW' : ''}`);
      
      // Clean up
      await supabase
        .from('bookings')
        .delete()
        .eq('customer_notes', 'PERFORMANCE_TEST_DELETE_ME');
    }
  }

  // 4. Test fetching booking history
  console.log('\n4️⃣ Testing booking history fetch speed...');
  startTime = Date.now();
  const { data: history } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      status,
      queue_number,
      service_catalog (service_name, base_price),
      capsters (capster_name)
    `)
    .eq('customer_phone', '+628123456789')
    .order('booking_date', { ascending: false })
    .limit(10);
  duration = Date.now() - startTime;
  console.log(`✅ Loaded ${history?.length || 0} history items in ${duration}ms ${duration > 500 ? '⚠️ SLOW' : ''}`);

  // 5. Test concurrent queries
  console.log('\n5️⃣ Testing concurrent queries (typical customer dashboard load)...');
  startTime = Date.now();
  
  const [servicesResult, capstersResult, historyResult] = await Promise.all([
    supabase
      .from('service_catalog')
      .select('id, service_name, base_price')
      .eq('branch_id', branchId)
      .eq('is_active', true),
    supabase
      .from('capsters')
      .select('id, capster_name, specialization')
      .eq('branch_id', branchId)
      .eq('is_available', true),
    supabase
      .from('bookings')
      .select('id, booking_date, status')
      .eq('customer_phone', '+628123456789')
      .order('booking_date', { ascending: false })
      .limit(5)
  ]);
  
  duration = Date.now() - startTime;
  console.log(`✅ All queries completed in ${duration}ms ${duration > 1000 ? '⚠️ SLOW' : '✨ FAST'}`);

  console.log('\n📊 PERFORMANCE SUMMARY:');
  if (duration > 2000) {
    console.log('🔴 CRITICAL: Page load is > 2 seconds');
    console.log('   Recommendations:');
    console.log('   - Add database indexes');
    console.log('   - Implement better caching');
    console.log('   - Use SWR/React Query for data fetching');
  } else if (duration > 1000) {
    console.log('🟡 WARNING: Page load is > 1 second');
    console.log('   Consider adding indexes and caching');
  } else {
    console.log('🟢 GOOD: Page load is < 1 second');
  }

  console.log('\n✨ TEST COMPLETE\n');
}

testBookingSpeed().catch(console.error);
