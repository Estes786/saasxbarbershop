const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function checkDatabase() {
  console.log('🔍 Checking database schema...\n');

  // Check barbershop_customers table
  const { data: customers, error: customersError } = await supabase
    .from('barbershop_customers')
    .select('customer_phone, customer_name')
    .limit(5);
  
  console.log('👥 barbershop_customers:', customers ? `✅ ${customers.length} records` : `❌ Error: ${customersError?.message}`);

  // Check service_catalog table
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price, branch_id')
    .eq('is_active', true);
  
  console.log('💇 service_catalog:', services ? `✅ ${services.length} active services` : `❌ Error: ${servicesError?.message}`);
  if (services && services.length > 0) {
    console.log('   Sample:', services[0]);
  }

  // Check capsters table
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('id, capster_name, status, is_available, branch_id');
  
  console.log('💈 capsters:', capsters ? `✅ ${capsters.length} capsters` : `❌ Error: ${capstersError?.message}`);
  if (capsters && capsters.length > 0) {
    console.log('   Available:', capsters.filter(c => c.is_available).length);
    console.log('   Approved:', capsters.filter(c => c.status === 'approved').length);
    console.log('   Sample:', capsters[0]);
  }

  // Check bookings table
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log('📅 bookings:', bookings ? `✅ ${bookings.length} recent bookings` : `❌ Error: ${bookingsError?.message}`);
  if (bookings && bookings.length > 0) {
    console.log('   Latest booking:', {
      customer_name: bookings[0].customer_name,
      service_id: bookings[0].service_id,
      capster_id: bookings[0].capster_id,
      status: bookings[0].status,
      booking_date: bookings[0].booking_date
    });
  }

  // Test a booking insert (dry run)
  console.log('\n🧪 Testing booking insert constraints...');
  const testPhone = '+6281234567890';
  const testName = 'Test Customer';
  
  // First ensure customer exists
  const { error: upsertError } = await supabase
    .from('barbershop_customers')
    .upsert({
      customer_phone: testPhone,
      customer_name: testName,
      customer_area: 'Online',
      total_visits: 0,
      total_revenue: 0,
      average_atv: 0,
      customer_segment: 'New',
      lifetime_value: 0,
      coupon_count: 0,
      coupon_eligible: false
    }, {
      onConflict: 'customer_phone',
      ignoreDuplicates: true
    });
  
  if (upsertError) {
    console.log('   ❌ Customer upsert failed:', upsertError.message);
  } else {
    console.log('   ✅ Customer upsert succeeded');
  }
}

checkDatabase().catch(console.error);
