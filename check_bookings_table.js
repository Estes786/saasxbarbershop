const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkBookingsStructure() {
  console.log('🔍 CHECKING BOOKINGS TABLE STRUCTURE...\n');
  
  // Try to insert a test booking to see what fields are needed
  console.log('📝 Test inserting a booking...\n');
  
  const testBooking = {
    customer_phone: '+628123456789',
    customer_name: 'Test Customer',
    branch_id: '97bbf7bc-3e55-48ab-8210-31c0022ad164',
    service_id: '1',
    capster_id: '1',
    booking_date: new Date('2026-01-03T10:00:00').toISOString(),
    booking_time: '10:00',
    service_tier: 'Basic',
    customer_notes: 'Test booking',
    status: 'pending',
    booking_source: 'online'
  };
  
  console.log('Test data:', testBooking);
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(testBooking)
    .select()
    .single();
  
  if (error) {
    console.log('\n❌ Error:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
    console.log('Code:', error.code);
  } else {
    console.log('\n✅ SUCCESS! Booking created:');
    console.log(data);
    
    // Now try to fetch it back
    const { data: fetched } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_phone', '+628123456789')
      .single();
    
    console.log('\n✅ Fetched booking:');
    console.log(fetched);
  }
}

checkBookingsStructure().catch(console.error);
