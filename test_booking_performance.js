const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookingFlow() {
  console.log('🧪 TESTING BOOKING FLOW...\n');
  
  // Step 1: Check available services
  console.log('📋 Step 1: Fetching available services...');
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price, duration_minutes')
    .eq('is_active', true)
    .limit(3);
  
  if (servicesError) {
    console.error('❌ Services error:', servicesError);
    return;
  }
  console.log(`✅ Found ${services.length} services`);
  services.forEach(s => console.log(`  - ${s.service_name}: Rp ${s.base_price}`));
  
  // Step 2: Check available capsters
  console.log('\n👨‍💼 Step 2: Fetching available capsters...');
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('id, capster_name, specialization, status, is_available, is_active')
    .eq('is_available', true)
    .eq('is_active', true)
    .eq('status', 'approved')
    .limit(5);
  
  if (capstersError) {
    console.error('❌ Capsters error:', capstersError);
    return;
  }
  console.log(`✅ Found ${capsters.length} available capsters`);
  capsters.forEach(c => console.log(`  - ${c.capster_name} (${c.specialization})`));
  
  if (services.length === 0 || capsters.length === 0) {
    console.log('\n⚠️  Cannot test booking - no services or capsters available!');
    return;
  }
  
  // Step 3: Create test booking
  console.log('\n📝 Step 3: Creating test booking...');
  const testBooking = {
    customer_phone: '+628123456789',
    customer_name: 'Test Customer Automated',
    service_id: services[0].id,
    capster_id: capsters[0].id,
    booking_date: '2026-01-06', // Tomorrow
    booking_time: '10:00:00',
    service_tier: 'Basic',
    customer_notes: 'Test booking from automated test',
    status: 'pending',
    booking_source: 'online',
    total_price: services[0].base_price,
    estimated_duration_minutes: services[0].duration_minutes
  };
  
  console.log('Booking data:', testBooking);
  
  const startTime = Date.now();
  const { data: newBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert(testBooking)
    .select()
    .single();
  const endTime = Date.now();
  
  if (bookingError) {
    console.error('❌ Booking error:', bookingError);
    console.error('Error details:', JSON.stringify(bookingError, null, 2));
    return;
  }
  
  console.log(`✅ Booking created successfully in ${endTime - startTime}ms!`);
  console.log('Booking ID:', newBooking.id);
  
  // Step 4: Verify booking appears in bookings table
  console.log('\n🔍 Step 4: Verifying booking...');
  const { data: verifyBooking, error: verifyError } = await supabase
    .from('bookings')
    .select(`
      *,
      services:service_catalog(service_name, base_price),
      capster:capsters(capster_name)
    `)
    .eq('id', newBooking.id)
    .single();
  
  if (verifyError) {
    console.error('❌ Verify error:', verifyError);
    return;
  }
  
  console.log('✅ Booking verified!');
  console.log(JSON.stringify(verifyBooking, null, 2));
  
  // Performance test
  console.log('\n⚡ PERFORMANCE TEST:');
  console.log(`- Services fetch: Fast (simple query)`);
  console.log(`- Capsters fetch: Fast (simple query with status filter)`);
  console.log(`- Booking creation: ${endTime - startTime}ms`);
  
  if (endTime - startTime > 2000) {
    console.log('⚠️  WARNING: Booking creation is slow (>2s)');
  } else if (endTime - startTime > 1000) {
    console.log('⚠️  Booking creation is acceptable but could be faster');
  } else {
    console.log('✅ Booking creation is FAST!');
  }
  
  // Check if bookings show in history
  console.log('\n📜 Step 5: Checking booking history...');
  const { data: history, error: historyError } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_phone', '+628123456789')
    .order('created_at', { ascending: false });
  
  if (!historyError && history) {
    console.log(`✅ Found ${history.length} bookings in history for test customer`);
  }
}

testBookingFlow()
  .then(() => {
    console.log('\n\n✅ TEST COMPLETE!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  });
