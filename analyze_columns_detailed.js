const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeColumns() {
  console.log('🔍 ANALYZING DATABASE COLUMNS...\n');
  
  // Check capsters table columns
  console.log('👨‍💼 CAPSTERS TABLE:');
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('*')
    .limit(1);
  
  if (capstersError) {
    console.log('❌ Error:', capstersError.message);
  } else if (capsters && capsters.length > 0) {
    console.log('✅ Columns:', Object.keys(capsters[0]).join(', '));
    const { data: allCapsters } = await supabase.from('capsters').select('id, name, status, branch_id');
    console.log(`   Total capsters: ${allCapsters?.length || 0}`);
    if (allCapsters) {
      console.log(`   Approved: ${allCapsters.filter(c => c.status === 'approved').length}`);
      console.log(`   Pending: ${allCapsters.filter(c => c.status === 'pending').length}`);
    }
  }
  console.log('');
  
  // Check service_catalog columns
  console.log('💈 SERVICE_CATALOG TABLE:');
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('*')
    .limit(1);
  
  if (servicesError) {
    console.log('❌ Error:', servicesError.message);
  } else if (services && services.length > 0) {
    console.log('✅ Columns:', Object.keys(services[0]).join(', '));
    const { data: allServices } = await supabase.from('service_catalog').select('id, name, base_price');
    console.log(`   Total services: ${allServices?.length || 0}`);
  }
  console.log('');
  
  // Check barbershop_customers columns
  console.log('👥 BARBERSHOP_CUSTOMERS TABLE:');
  const { data: customers, error: customersError } = await supabase
    .from('barbershop_customers')
    .select('*')
    .limit(1);
  
  if (customersError) {
    console.log('❌ Error:', customersError.message);
  } else if (customers && customers.length > 0) {
    console.log('✅ Columns:', Object.keys(customers[0]).join(', '));
    const { data: allCustomers } = await supabase.from('barbershop_customers').select('customer_phone');
    console.log(`   Total customers: ${allCustomers?.length || 0}`);
  }
  console.log('');
  
  // Check bookings columns
  console.log('📅 BOOKINGS TABLE:');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);
  
  if (bookingsError) {
    console.log('❌ Error:', bookingsError.message);
  } else if (bookings && bookings.length > 0) {
    console.log('✅ Columns:', Object.keys(bookings[0]).join(', '));
  }
  console.log('');
  
  // Now test actual booking flow
  console.log('🧪 TESTING BOOKING FLOW:');
  console.log('=' .repeat(60));
  
  // Step 1: Get available services
  console.log('\n1️⃣ Can customer see services?');
  const { data: availableServices, error: servicesListError } = await supabase
    .from('service_catalog')
    .select('id, name, base_price, branch_id')
    .limit(5);
  
  if (servicesListError) {
    console.log('❌ ISSUE: Cannot fetch services -', servicesListError.message);
  } else {
    console.log(`✅ YES - ${availableServices.length} services available`);
    console.log('   Sample:', availableServices[0]);
  }
  
  // Step 2: Get available capsters
  console.log('\n2️⃣ Can customer see capsters?');
  const { data: availableCapsters, error: capstersListError } = await supabase
    .from('capsters')
    .select('id, name, status, branch_id')
    .eq('status', 'approved');
  
  if (capstersListError) {
    console.log('❌ ISSUE: Cannot fetch capsters -', capstersListError.message);
  } else {
    console.log(`✅ YES - ${availableCapsters.length} approved capsters`);
    if (availableCapsters.length === 0) {
      console.log('⚠️  WARNING: NO APPROVED CAPSTERS! This is why booking fails!');
    } else {
      console.log('   Sample:', availableCapsters[0]);
    }
  }
  
  // Step 3: Test booking creation
  console.log('\n3️⃣ Can customer create booking?');
  console.log('   Checking foreign key constraints...');
  
  // Check if customer exists in barbershop_customers
  const testPhone = '082336525265';
  const { data: existingCustomer } = await supabase
    .from('barbershop_customers')
    .select('*')
    .eq('customer_phone', testPhone)
    .single();
  
  if (existingCustomer) {
    console.log(`   ✅ Customer ${testPhone} exists in barbershop_customers`);
  } else {
    console.log(`   ⚠️  Customer ${testPhone} NOT in barbershop_customers`);
    console.log('   → This will cause FK constraint error!');
  }
  
  console.log('\n📊 ROOT CAUSE ANALYSIS:');
  console.log('=' .repeat(60));
  
  if (!availableCapsters || availableCapsters.length === 0) {
    console.log('\n❌ ROOT CAUSE #1: NO APPROVED CAPSTERS');
    console.log('   Solution: Approve at least one capster');
    console.log('   SQL: UPDATE capsters SET status = \'approved\' WHERE id = \'some-id\';');
  }
  
  if (!existingCustomer) {
    console.log('\n❌ ROOT CAUSE #2: CUSTOMER NOT IN BARBERSHOP_CUSTOMERS');
    console.log('   Solution: Auto-create customer record on registration');
    console.log('   This is a backend logic issue, not a database issue');
  }
  
  console.log('\n');
}

analyzeColumns().then(() => {
  console.log('✅ Detailed analysis complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Analysis failed:', err);
  process.exit(1);
});
