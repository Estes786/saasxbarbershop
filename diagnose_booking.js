const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function diagnose() {
  console.log('\n🔍 DIAGNOSING BOOKING ISSUES...\n');
  
  // Test customer phone yang ada di bookings
  const testPhone = '08582288228';
  
  console.log(`\n📞 Testing with customer phone: ${testPhone}`);
  
  // Try simple query first
  console.log('\n1️⃣ Simple Query (without joins):');
  const { data: simpleBookings, error: simpleError } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_phone', testPhone);
  
  if (simpleError) {
    console.error('❌ Simple query error:', simpleError);
  } else {
    console.log(`✅ Found ${simpleBookings?.length} bookings (simple)`);
    if (simpleBookings && simpleBookings.length > 0) {
      console.log('Sample:', JSON.stringify(simpleBookings[0], null, 2));
    }
  }
  
  // Try with joins (like BookingHistory does)
  console.log('\n2️⃣ Query WITH JOINS (like BookingHistory):');
  const { data: joinBookings, error: joinError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      booking_time,
      status,
      queue_number,
      customer_notes,
      rating,
      feedback,
      total_price,
      service_id,
      capster_id,
      service_catalog!bookings_service_id_fkey (
        service_name,
        base_price
      ),
      capsters!bookings_capster_id_fkey (
        capster_name
      )
    `)
    .eq('customer_phone', testPhone)
    .order('booking_date', { ascending: false });
  
  if (joinError) {
    console.error('❌ Join query error:', joinError);
    console.error('Full error:', JSON.stringify(joinError, null, 2));
  } else {
    console.log(`✅ Found ${joinBookings?.length} bookings (with joins)`);
    if (joinBookings && joinBookings.length > 0) {
      console.log('Sample:', JSON.stringify(joinBookings[0], null, 2));
    }
  }
  
  // Check if foreign keys exist
  console.log('\n3️⃣ Checking Foreign Key Relationships:');
  if (simpleBookings && simpleBookings.length > 0) {
    const booking = simpleBookings[0];
    
    // Check service exists
    const { data: service, error: serviceError } = await supabase
      .from('service_catalog')
      .select('id, service_name')
      .eq('id', booking.service_id)
      .single();
    
    if (serviceError) {
      console.error(`❌ Service not found for id: ${booking.service_id}`);
    } else {
      console.log(`✅ Service exists: ${service?.service_name}`);
    }
    
    // Check capster exists
    const { data: capster, error: capsterError } = await supabase
      .from('capsters')
      .select('id, capster_name')
      .eq('id', booking.capster_id)
      .single();
    
    if (capsterError) {
      console.error(`❌ Capster not found for id: ${booking.capster_id}`);
    } else {
      console.log(`✅ Capster exists: ${capster?.capster_name}`);
    }
  }
  
  // Test with alternative join syntax
  console.log('\n4️⃣ Alternative Join Syntax:');
  const { data: altBookings, error: altError } = await supabase
    .from('bookings')
    .select(`
      *,
      service_catalog:service_id (service_name, base_price),
      capsters:capster_id (capster_name)
    `)
    .eq('customer_phone', testPhone);
  
  if (altError) {
    console.error('❌ Alternative join error:', altError);
  } else {
    console.log(`✅ Found ${altBookings?.length} bookings (alternative join)`);
    if (altBookings && altBookings.length > 0) {
      console.log('Sample:', JSON.stringify(altBookings[0], null, 2));
    }
  }
  
  console.log('\n✅ Diagnosis complete!\n');
}

diagnose().catch(console.error);
