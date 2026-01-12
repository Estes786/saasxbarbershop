const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function checkCapsterBookingIntegration() {
  console.log('\n🔍 ANALYZING CAPSTER-BOOKING INTEGRATION\n');
  
  // Check recent bookings
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (bookingError) {
    console.error('❌ Error fetching bookings:', bookingError);
  } else {
    console.log('📋 Recent Bookings:');
    bookings?.forEach((booking, i) => {
      console.log(`\n${i + 1}. Booking ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name || booking.customer_phone}`);
      console.log(`   Capster ID: ${booking.capster_id || '❌ NULL'}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Date: ${booking.booking_date}`);
      console.log(`   Service: ${booking.service_name || 'N/A'}`);
    });
  }
  
  // Check capsters
  const { data: capsters, error: capsterError } = await supabase
    .from('capsters')
    .select('*');
    
  if (capsterError) {
    console.error('\n❌ Error fetching capsters:', capsterError);
  } else {
    console.log('\n\n✂️ Available Capsters:');
    capsters?.forEach((capster, i) => {
      console.log(`\n${i + 1}. Capster ID: ${capster.id}`);
      console.log(`   Name: ${capster.capster_name}`);
      console.log(`   User ID: ${capster.user_id || 'N/A'}`);
      console.log(`   Specialization: ${capster.specialization}`);
      console.log(`   Available: ${capster.is_available ? 'Yes' : 'No'}`);
    });
  }
  
  // Check if bookings have capster_id
  const bookingsWithoutCapster = bookings?.filter(b => !b.capster_id);
  
  console.log('\n\n📊 SUMMARY:');
  console.log(`Total recent bookings: ${bookings?.length || 0}`);
  console.log(`Bookings without capster_id: ${bookingsWithoutCapster?.length || 0}`);
  console.log(`Total capsters: ${capsters?.length || 0}`);
  
  if (bookingsWithoutCapster && bookingsWithoutCapster.length > 0) {
    console.log('\n⚠️  ROOT CAUSE IDENTIFIED:');
    console.log('   Bookings are being created WITHOUT capster_id!');
    console.log('   This is why Capster Dashboard cannot display them.');
  }
}

checkCapsterBookingIntegration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
