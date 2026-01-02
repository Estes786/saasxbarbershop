const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function successfulBookingTest() {
  console.log('🔍 SUCCESSFUL BOOKING TEST...\n');
  
  // Get real service_id
  console.log('📋 Getting service_catalog...');
  const { data: services } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price')
    .eq('branch_id', '97bbf7bc-3e55-48ab-8210-31c0022ad164')
    .limit(1);
  
  if (!services || services.length === 0) {
    console.log('❌ No services found for branch!');
    return;
  }
  
  const service = services[0];
  console.log(`✅ Found service: ${service.service_name} (${service.id})`);
  
  // Get real capster_id
  console.log('\n👨‍💼 Getting capsters...');
  const { data: capsters } = await supabase
    .from('capsters')
    .select('id, capster_name, branch_id')
    .eq('branch_id', '97bbf7bc-3e55-48ab-8210-31c0022ad164')
    .limit(1);
  
  if (!capsters || capsters.length === 0) {
    console.log('❌ No capsters found for branch!');
    return;
  }
  
  const capster = capsters[0];
  console.log(`✅ Found capster: ${capster.capster_name} (${capster.id})`);
  
  // Now create booking with real IDs
  console.log('\n📝 Creating booking with real data...\n');
  
  const testBooking = {
    customer_phone: '+628123456789',
    customer_name: 'Test Customer Debug',
    branch_id: '97bbf7bc-3e55-48ab-8210-31c0022ad164',
    service_id: service.id,
    capster_id: capster.id,
    booking_date: new Date('2026-01-03T10:00:00').toISOString(),
    booking_time: '10:00',
    service_tier: 'Basic',
    customer_notes: 'Test booking from debug',
    status: 'pending',
    booking_source: 'online'
  };
  
  console.log('Test booking data:', testBooking);
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(testBooking)
    .select()
    .single();
  
  if (error) {
    console.log('\n❌ Error:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
  } else {
    console.log('\n✅ SUCCESS! Booking created:');
    console.log(data);
    
    // Fetch all bookings for verification
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    console.log('\n📅 All recent bookings:');
    allBookings?.forEach((b, i) => {
      console.log(`${i+1}. ${b.customer_name} | ${b.status} | ${b.booking_date}`);
    });
  }
}

successfulBookingTest().catch(console.error);
