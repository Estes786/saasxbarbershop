const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function analyzeCapsterIntegration() {
  console.log('\n📊 DETAILED ANALYSIS: CAPSTER-BOOKING INTEGRATION\n');
  console.log('='.repeat(60));
  
  // Get capster users (role = 'capster')
  const { data: capsterUsers } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'capster')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('\n👤 Recent Capster User Profiles:');
  capsterUsers?.forEach((user, i) => {
    console.log(`\n${i + 1}. User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.customer_name || 'N/A'}`);
    console.log(`   Capster ID (in profile): ${user.capster_id || '❌ NULL'}`);
  });
  
  // Get all capster_id values from bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('capster_id, customer_name, status, booking_date')
    .not('capster_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('\n\n📋 Recent Bookings with Capster ID:');
  bookings?.forEach((booking, i) => {
    console.log(`\n${i + 1}. Capster ID: ${booking.capster_id}`);
    console.log(`   Customer: ${booking.customer_name}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Date: ${booking.booking_date}`);
  });
  
  // Check if any capster user can see their bookings
  if (capsterUsers && capsterUsers.length > 0) {
    const testUser = capsterUsers[0];
    const testCapsterId = testUser.capster_id;
    
    console.log('\n\n🧪 SIMULATION TEST:');
    console.log(`Testing with Capster User: ${testUser.email}`);
    console.log(`Their capster_id: ${testCapsterId || '❌ NULL'}`);
    
    if (testCapsterId) {
      // Simulate the query from QueueManagement
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: testBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('capster_id', testCapsterId)
        .gte('booking_date', today.toISOString())
        .lt('booking_date', tomorrow.toISOString());
        
      console.log(`\n   Query Result:`);
      console.log(`   - Bookings found: ${testBookings?.length || 0}`);
      if (error) {
        console.log(`   - Error: ${error.message}`);
      }
      
      if (testBookings && testBookings.length > 0) {
        console.log(`   ✅ CAPSTER CAN SEE BOOKINGS!`);
      } else {
        console.log(`   ❌ NO BOOKINGS VISIBLE FOR THIS CAPSTER`);
      }
    } else {
      console.log(`\n   ❌ capster_id is NULL in user_profiles!`);
      console.log(`   🔍 ROOT CAUSE: User profile doesn't have capster_id linked`);
    }
  }
  
  // Check capsters table vs user_profiles linkage
  console.log('\n\n🔗 LINKAGE ANALYSIS:');
  const { data: capstersWithUserID } = await supabase
    .from('capsters')
    .select('*')
    .not('user_id', 'is', null);
    
  console.log(`Capsters with user_id linked: ${capstersWithUserID?.length || 0}`);
  
  const { data: capstersWithoutUserID } = await supabase
    .from('capsters')
    .select('*')
    .is('user_id', null);
    
  console.log(`Capsters WITHOUT user_id: ${capstersWithoutUserID?.length || 0}`);
  
  if (capstersWithoutUserID && capstersWithoutUserID.length > 0) {
    console.log(`\n⚠️  WARNING: ${capstersWithoutUserID.length} capsters are not linked to any user!`);
    console.log('   These capsters:');
    capstersWithoutUserID.slice(0, 3).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.capster_name} (ID: ${c.id})`);
    });
  }
}

analyzeCapsterIntegration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
