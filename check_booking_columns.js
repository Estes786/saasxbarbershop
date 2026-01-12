#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBookingColumns() {
  console.log('🔍 Querying information_schema to get bookings table columns...\n');

  // Query information_schema untuk mendapatkan semua kolom
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.log('❌ Cannot query information_schema directly');
    console.log('   Error:', error.message);
    console.log('\n📝 Alternative: Creating minimal booking to discover required fields...\n');
    
    // Try dengan minimal fields
    const minimalBooking = {
      customer_phone: '08123456789',
      customer_name: 'Test',
      service_id: 'd952ae12-f811-420a-baf7-4bf9d610e75f',
      capster_id: '7982ba06-c1e3-47da-8bcb-2b7bd7bd9fc0',
      booking_date: new Date().toISOString(),
      booking_time: '14:00',
      status: 'pending',
      booking_source: 'online',
      // Add potentially missing fields with default values
      service_tier: 'standard'
    };

    console.log('Testing booking with fields:', Object.keys(minimalBooking).join(', '));
    console.log('');

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert(minimalBooking)
      .select()
      .single();

    if (bookingError) {
      console.log('❌ Still error:', bookingError.message);
      console.log('   Details:', bookingError.details);
    } else {
      console.log('✅ SUCCESS! Booking created with these fields:');
      console.log(JSON.stringify(bookingData, null, 2));
      
      // Clean up
      await supabase.from('bookings').delete().eq('id', bookingData.id);
      console.log('\n✅ Test booking cleaned up');
    }
  } else {
    console.log('✅ Bookings table columns:');
    data.forEach(col => {
      const required = col.is_nullable === 'NO' && !col.column_default;
      const marker = required ? '🔴 REQUIRED' : '✅ optional';
      console.log(`   ${marker} ${col.column_name} (${col.data_type})`);
    });
  }
}

checkBookingColumns().catch(console.error);
