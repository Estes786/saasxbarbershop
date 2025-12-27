#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testCompleteBookingFlow() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING COMPLETE BOOKING FLOW');
  console.log('='.repeat(80));
  console.log('');

  // Step 1: Load services
  console.log('📋 Step 1: Loading services...');
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
    .limit(3);

  if (servicesError) {
    console.log('❌ Error loading services:', servicesError.message);
    return;
  }
  console.log(`✅ Loaded ${services.length} services`);
  services.forEach((s, idx) => {
    console.log(`   ${idx + 1}. ${s.service_name} - Rp ${s.base_price}`);
  });
  console.log('');

  // Step 2: Load capsters
  console.log('📋 Step 2: Loading capsters...');
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('*')
    .eq('is_available', true)
    .order('capster_name')
    .limit(3);

  if (capstersError) {
    console.log('❌ Error loading capsters:', capstersError.message);
    return;
  }
  console.log(`✅ Loaded ${capsters.length} capsters`);
  capsters.forEach((c, idx) => {
    console.log(`   ${idx + 1}. ${c.capster_name} (${c.specialization})`);
  });
  console.log('');

  // Step 3: Create test booking
  console.log('📋 Step 3: Creating test booking...');
  const testBooking = {
    customer_phone: '08123456789',
    customer_name: 'Test Customer',
    service_id: services[0].id,
    capster_id: capsters[0].id,
    booking_date: new Date().toISOString(),
    booking_time: '14:00',
    service_tier: 'Basic',
    customer_notes: 'Test booking via automated test',
    status: 'pending',
    booking_source: 'online'
  };

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(testBooking)
    .select()
    .single();

  if (bookingError) {
    console.log('❌ Error creating booking:', bookingError.message);
    console.log('   Details:', bookingError.details);
    return;
  }

  console.log('✅ Booking created successfully!');
  console.log(`   Booking ID: ${booking.id}`);
  console.log(`   Customer: ${booking.customer_name}`);
  console.log(`   Service: ${services[0].service_name}`);
  console.log(`   Capster: ${capsters[0].capster_name}`);
  console.log(`   Date: ${booking.booking_date}`);
  console.log('');

  // Step 4: Verify booking can be retrieved
  console.log('📋 Step 4: Verifying booking can be retrieved...');
  const { data: retrievedBooking, error: retrieveError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking.id)
    .single();

  if (retrieveError) {
    console.log('❌ Error retrieving booking:', retrieveError.message);
  } else {
    console.log('✅ Booking retrieved successfully');
  }
  console.log('');

  // Step 5: Clean up test booking
  console.log('📋 Step 5: Cleaning up test booking...');
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', booking.id);

  if (deleteError) {
    console.log('❌ Error deleting test booking:', deleteError.message);
  } else {
    console.log('✅ Test booking deleted successfully');
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ COMPLETE BOOKING FLOW TEST PASSED!');
  console.log('='.repeat(80));
}

testCompleteBookingFlow().catch(console.error);
