#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n🔍 CHECKING TABLE SCHEMAS\n');
  console.log('='  .repeat(80));
  
  // Check service_catalog columns
  console.log('\n📋 SERVICE_CATALOG columns:');
  const { data: services, error: servError } = await supabase
    .from('service_catalog')
    .select('*')
    .limit(1);
  
  if (servError) {
    console.log('❌ Error:', servError.message);
  } else if (services && services[0]) {
    console.log('   Columns:', Object.keys(services[0]).join(', '));
  }
  
  // Check bookings columns  
  console.log('\n📋 BOOKINGS columns:');
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);
  
  if (bookError) {
    console.log('❌ Error:', bookError.message);
  } else if (bookings && bookings[0]) {
    console.log('   Columns:', Object.keys(bookings[0]).join(', '));
  }
  
  // Test booking creation
  console.log('\n📋 TESTING BOOKING CREATION:');
  const testBooking = {
    customer_phone: '+628123456789',
    customer_name: 'Test Customer',
    booking_date: '2026-01-07',
    booking_time: '10:00',
    service_tier: 'Standard',
    notes: 'Test booking'
  };
  
  const { data: newBooking, error: createError } = await supabase
    .from('bookings')
    .insert([testBooking])
    .select();
  
  if (createError) {
    console.log('❌ Booking creation failed:');
    console.log('   Message:', createError.message);
    console.log('   Details:', createError.details);
    console.log('   Hint:', createError.hint);
  } else {
    console.log('✅ Booking created successfully!');
    console.log('   ID:', newBooking[0].id);
  }
  
  console.log('\n' + '='.repeat(80));
}

checkSchema();
