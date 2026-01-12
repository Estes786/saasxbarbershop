#!/usr/bin/env node
/**
 * 🧪 Test Booking Creation
 * Create a test booking to verify system works
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestBooking() {
  console.log('\n🧪 Creating test booking...\n');
  
  try {
    // Get service
    const { data: service } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('service_name', 'Cukur Dewasa')
      .limit(1)
      .single();
    
    if (!service) {
      console.log('❌ No service found');
      return;
    }
    
    console.log(`✅ Using service: ${service.service_name} (Rp ${service.base_price})`);
    
    // Get capster
    const { data: capster } = await supabase
      .from('capsters')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (!capster) {
      console.log('❌ No approved capster found');
      return;
    }
    
    console.log(`✅ Using capster: ${capster.capster_name}`);
    
    // Create booking
    const bookingData = {
      customer_phone: '+628123456789', // Use existing format
      customer_name: 'customer3test',
      booking_date: '2026-01-08', // Tomorrow
      booking_time: '14:00',
      service_tier: 'basic',
      service_id: service.id,
      capster_id: capster.id,
      total_price: service.base_price,
      status: 'confirmed',
      branch_id: service.branch_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('\nCreating booking with data:');
    console.log(JSON.stringify(bookingData, null, 2));
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    
    if (error) {
      console.log(`\n❌ Failed to create booking: ${error.message}`);
      console.log('Details:', error);
    } else {
      console.log('\n✅ BOOKING CREATED SUCCESSFULLY!');
      console.log(`   Booking ID: ${booking.id}`);
      console.log(`   Date: ${booking.booking_date} ${booking.booking_time}`);
      console.log(`   Service: ${booking.service_tier}`);
      console.log(`   Status: ${booking.status}`);
    }
    
    // Verify bookings exist
    console.log('\n\nVerifying bookings...');
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_phone', '+628123456789')
      .order('created_at', { ascending: false });
    
    console.log(`\nTotal bookings for +628123456789: ${allBookings?.length || 0}`);
    
    if (allBookings && allBookings.length > 0) {
      console.log('\nRecent bookings:');
      allBookings.slice(0, 5).forEach((b, i) => {
        console.log(`${i + 1}. ${b.booking_date} ${b.booking_time} - ${b.status}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

createTestBooking();
