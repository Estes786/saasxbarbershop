#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBookingSchema() {
  console.log('🔍 Checking bookings table schema...\n');

  // Try to insert a test booking
  console.log('🧪 Testing booking insertion with all required fields:');
  
  const testBooking = {
    customer_phone: '08123456789',
    service_id: 'd952ae12-f811-420a-baf7-4bf9d610e75f', // Cukur Dewasa
    capster_id: '7982ba06-c1e3-47da-8bcb-2b7bd7bd9fc0', // Budi Santoso
    booking_date: new Date().toISOString(),
    customer_notes: 'Test booking',
    status: 'pending',
    booking_source: 'online'
  };

  console.log('Test data:', JSON.stringify(testBooking, null, 2));
  console.log('');

  const { data, error } = await supabase
    .from('bookings')
    .insert(testBooking)
    .select()
    .single();

  if (error) {
    console.log('❌ ERROR:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('✅ SUCCESS! Booking created:');
    console.log(JSON.stringify(data, null, 2));
    
    // Clean up test booking
    console.log('\n🧹 Cleaning up test booking...');
    await supabase
      .from('bookings')
      .delete()
      .eq('id', data.id);
    console.log('✅ Test booking deleted');
  }
}

checkBookingSchema().catch(console.error);
