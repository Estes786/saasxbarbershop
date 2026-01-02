const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 CHECKING BALIK.LAGI DATABASE...\n');
  
  // Check branches
  console.log('📍 BRANCHES:');
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('*');
  
  if (branchError) {
    console.log('❌ Error fetching branches:', branchError.message);
  } else {
    console.log(`✅ Found ${branches.length} branches`);
    branches.forEach(b => console.log(`   - ${b.branch_name} (${b.branch_code})`));
  }
  
  // Check service_catalog
  console.log('\n🛠️  SERVICE CATALOG:');
  const { data: services, error: serviceError } = await supabase
    .from('service_catalog')
    .select('*');
  
  if (serviceError) {
    console.log('❌ Error fetching services:', serviceError.message);
  } else {
    console.log(`✅ Found ${services.length} services`);
    services.forEach(s => console.log(`   - ${s.service_name} (Rp ${s.price})`));
  }
  
  // Check capsters
  console.log('\n✂️  CAPSTERS:');
  const { data: capsters, error: capsterError } = await supabase
    .from('capsters')
    .select('*');
  
  if (capsterError) {
    console.log('❌ Error fetching capsters:', capsterError.message);
  } else {
    console.log(`✅ Found ${capsters.length} capsters`);
    capsters.forEach(c => console.log(`   - ${c.capster_name} (Branch: ${c.branch_id || 'N/A'})`));
  }
  
  // Check bookings
  console.log('\n📅 BOOKINGS:');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (bookingError) {
    console.log('❌ Error fetching bookings:', bookingError.message);
  } else {
    console.log(`✅ Found ${bookings.length} recent bookings`);
    bookings.forEach(b => {
      console.log(`   - ${b.customer_name} | ${b.service_name} | ${b.status}`);
    });
  }
  
  // Check customers
  console.log('\n👥 CUSTOMERS:');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .limit(5);
  
  if (customerError) {
    console.log('❌ Error fetching customers:', customerError.message);
  } else {
    console.log(`✅ Found ${customers.length} customers`);
  }
}

checkDatabase().catch(console.error);
