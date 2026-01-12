const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
  console.log('🔍 DEEP ANALYSIS - DATABASE STATE\n');
  
  // 1. Check bookings
  console.log('1️⃣ BOOKINGS TABLE:');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (bookingsError) {
    console.error('❌ Bookings error:', bookingsError);
  } else {
    console.log(`   ✅ Found ${bookings.length} recent bookings`);
    bookings.forEach((b, i) => {
      console.log(`   ${i+1}. ID: ${b.id.substring(0,8)}...`);
      console.log(`      Phone: ${b.customer_phone}`);
      console.log(`      Date: ${b.booking_date} ${b.booking_time}`);
      console.log(`      Status: ${b.status}`);
      console.log(`      Created: ${b.created_at}`);
    });
  }
  
  // 2. Check services
  console.log('\n2️⃣ SERVICES:');
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price, is_active')
    .eq('is_active', true);
  
  if (servicesError) {
    console.error('❌ Services error:', servicesError);
  } else {
    console.log(`   ✅ ${services.length} active services`);
  }
  
  // 3. Check capsters
  console.log('\n3️⃣ CAPSTERS:');
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('id, capster_name, status, is_active')
    .eq('is_active', true)
    .eq('status', 'approved');
  
  if (capstersError) {
    console.error('❌ Capsters error:', capstersError);
  } else {
    console.log(`   ✅ ${capsters.length} active & approved capsters`);
    capsters.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.capster_name} (ID: ${c.id.substring(0,8)}...)`);
    });
  }
  
  // 4. Check barbershop_customers
  console.log('\n4️⃣ BARBERSHOP CUSTOMERS:');
  const { data: customers, error: customersError } = await supabase
    .from('barbershop_customers')
    .select('customer_phone, customer_name, created_at')
    .limit(5);
  
  if (customersError) {
    console.error('❌ Customers error:', customersError);
  } else {
    console.log(`   ✅ ${customers.length} customers in barbershop_customers`);
    customers.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.customer_name} - ${c.customer_phone}`);
    });
  }
  
  // 5. Performance test - Booking form query simulation
  console.log('\n5️⃣ PERFORMANCE TEST - Query speed:');
  const start = Date.now();
  
  const [servicesResult, capstersResult] = await Promise.all([
    supabase
      .from('service_catalog')
      .select('id, service_name, base_price, duration_minutes, description')
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('capsters')
      .select('id, capster_name, specialization')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('capster_name')
  ]);
  
  const duration = Date.now() - start;
  console.log(`   ⏱️  Parallel query took: ${duration}ms`);
  console.log(`   ✅ Services: ${servicesResult.data?.length || 0}`);
  console.log(`   ✅ Capsters: ${capstersResult.data?.length || 0}`);
  
  if (duration > 1000) {
    console.log(`   ⚠️  SLOW! Should be < 500ms`);
  } else {
    console.log(`   ✅ GOOD! Query is fast`);
  }
  
  // 6. Test booking history query
  console.log('\n6️⃣ BOOKING HISTORY QUERY TEST:');
  if (bookings && bookings.length > 0) {
    const testPhone = bookings[0].customer_phone;
    console.log(`   Testing with phone: ${testPhone}`);
    
    const historyStart = Date.now();
    const { data: history, error: historyError } = await supabase
      .from('bookings')
      .select(`
        *,
        service_catalog:service_id (service_name, base_price),
        capsters:capster_id (capster_name)
      `)
      .eq('customer_phone', testPhone)
      .order('booking_date', { ascending: false });
    
    const historyDuration = Date.now() - historyStart;
    console.log(`   ⏱️  History query took: ${historyDuration}ms`);
    
    if (historyError) {
      console.error('   ❌ History query error:', historyError);
    } else {
      console.log(`   ✅ Found ${history.length} bookings for this phone`);
      if (history.length > 0) {
        console.log(`   📋 Sample booking:`);
        console.log(`      Service: ${history[0].service_catalog?.service_name || 'N/A'}`);
        console.log(`      Capster: ${history[0].capsters?.capster_name || 'N/A'}`);
      }
    }
  }
  
  console.log('\n✅ Analysis complete!');
}

analyze().catch(console.error);
