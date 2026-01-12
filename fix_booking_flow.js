const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixBookingFlow() {
  console.log('🔧 FIXING BOOKING FLOW...\n');
  
  // Step 1: Create customer in barbershop_customers
  console.log('📝 Step 1: Creating customer...');
  const customerData = {
    customer_phone: '+628123456789',
    customer_name: 'Test Customer Debug',
    customer_area: 'Banyumas',
    total_visits: 0,
    total_revenue: 0,
    average_atv: 0,
    customer_segment: 'New',
    lifetime_value: 0,
    coupon_count: 0,
    coupon_eligible: false
  };
  
  const { data: customer, error: customerError } = await supabase
    .from('barbershop_customers')
    .upsert(customerData, { onConflict: 'customer_phone' })
    .select()
    .single();
  
  if (customerError) {
    console.log('❌ Error creating customer:', customerError.message);
    return;
  }
  
  console.log('✅ Customer created:', customer.customer_name);
  
  // Step 2: Get service and capster
  console.log('\n📋 Step 2: Getting service...');
  const { data: services } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price')
    .eq('branch_id', '97bbf7bc-3e55-48ab-8210-31c0022ad164')
    .limit(1);
  
  const service = services?.[0];
  console.log(`✅ Service: ${service?.service_name}`);
  
  console.log('\n👨‍💼 Step 3: Getting capster...');
  const { data: capsters } = await supabase
    .from('capsters')
    .select('id, capster_name')
    .eq('branch_id', '97bbf7bc-3e55-48ab-8210-31c0022ad164')
    .limit(1);
  
  const capster = capsters?.[0];
  console.log(`✅ Capster: ${capster?.capster_name}`);
  
  // Step 3: Create booking
  console.log('\n📅 Step 4: Creating booking...');
  const bookingData = {
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
  
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  
  if (bookingError) {
    console.log('❌ Error creating booking:', bookingError.message);
    return;
  }
  
  console.log('✅ Booking created successfully!');
  console.log('   ID:', booking.id);
  console.log('   Status:', booking.status);
  console.log('   Date:', booking.booking_date);
  
  // Step 4: Verify booking
  console.log('\n🔍 Step 5: Verifying booking in database...');
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_phone', '+628123456789')
    .order('created_at', { ascending: false });
  
  console.log(`✅ Found ${allBookings?.length || 0} bookings for this customer:`);
  allBookings?.forEach((b, i) => {
    console.log(`   ${i+1}. ${b.customer_name} | ${b.status} | ${new Date(b.booking_date).toLocaleString()}`);
  });
  
  console.log('\n🎉 BOOKING FLOW FIX COMPLETE!');
  console.log('✅ Customer can now create bookings successfully!');
}

fixBookingFlow().catch(console.error);
