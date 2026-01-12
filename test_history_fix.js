const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the fixed fetcher
async function bookingsFetcher(customerPhone) {
  console.log('\n🔧 TESTING FIXED BOOKING HISTORY FETCHER');
  console.log('=' .repeat(60));
  
  const phoneVariants = [customerPhone, '+62' + customerPhone.substring(1)];
  console.log(`📱 Searching with phone variants: ${phoneVariants.join(', ')}`);
  
  const start = Date.now();
  
  // 1. Fetch bookings (simplified query)
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('customer_phone', phoneVariants)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  if (error) {
    console.error('❌ Error fetching bookings:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.log('📭 No bookings found');
    return [];
  }
  
  console.log(`✅ Found ${data.length} bookings`);
  
  // 2. Fetch related services and capsters
  const serviceIds = [...new Set(data.map(b => b.service_id).filter(Boolean))];
  const capsterIds = [...new Set(data.map(b => b.capster_id).filter(Boolean))];
  
  console.log(`🔍 Need to fetch: ${serviceIds.length} services, ${capsterIds.length} capsters`);
  
  // Parallel fetch
  const [servicesResult, capstersResult] = await Promise.all([
    serviceIds.length > 0 
      ? supabase.from('service_catalog').select('id, service_name, base_price').in('id', serviceIds)
      : { data: [], error: null },
    capsterIds.length > 0
      ? supabase.from('capsters').select('id, capster_name').in('id', capsterIds)
      : { data: [], error: null }
  ]);
  
  console.log(`✅ Fetched: ${servicesResult.data?.length || 0} services, ${capstersResult.data?.length || 0} capsters`);
  
  // Create lookup maps
  const servicesMap = new Map((servicesResult.data || []).map(s => [s.id, s]));
  const capstersMap = new Map((capstersResult.data || []).map(c => [c.id, c]));
  
  // Enrich bookings
  const enrichedBookings = data.map(booking => ({
    ...booking,
    service_catalog: servicesMap.get(booking.service_id) || null,
    capsters: capstersMap.get(booking.capster_id) || null
  }));
  
  const duration = Date.now() - start;
  console.log(`⏱️  Total query time: ${duration}ms`);
  console.log(`✅ Enriched ${enrichedBookings.length} bookings\n`);
  
  return enrichedBookings;
}

async function test() {
  try {
    // Test with actual phone from database
    const testPhone = '+628123456789'; // From our analysis
    
    const bookings = await bookingsFetcher(testPhone);
    
    console.log('📊 RESULTS:');
    console.log('=' .repeat(60));
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found!');
      return;
    }
    
    bookings.forEach((booking, i) => {
      console.log(`\n📋 Booking ${i + 1}:`);
      console.log(`   ID: ${booking.id.substring(0, 8)}...`);
      console.log(`   Service: ${booking.service_catalog?.service_name || '❌ N/A'}`);
      console.log(`   Capster: ${booking.capsters?.capster_name || '❌ N/A'}`);
      console.log(`   Price: Rp ${(booking.total_price || booking.service_catalog?.base_price || 0).toLocaleString()}`);
      console.log(`   Date: ${booking.booking_date} ${booking.booking_time}`);
      console.log(`   Status: ${booking.status}`);
    });
    
    // Verification
    const withServiceName = bookings.filter(b => b.service_catalog?.service_name).length;
    const withCapsterName = bookings.filter(b => b.capsters?.capster_name).length;
    
    console.log('\n✅ VERIFICATION:');
    console.log('=' .repeat(60));
    console.log(`📊 Total bookings: ${bookings.length}`);
    console.log(`✅ With service name: ${withServiceName}/${bookings.length}`);
    console.log(`✅ With capster name: ${withCapsterName}/${bookings.length}`);
    
    if (withServiceName === bookings.length && withCapsterName === bookings.length) {
      console.log('\n🎉 SUCCESS! All bookings have complete data!');
    } else {
      console.log('\n⚠️  Some bookings missing data');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

test();
