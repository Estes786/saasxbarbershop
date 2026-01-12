const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function checkDatabase() {
  console.log('\n🔍 ANALYZING CURRENT DATABASE STATE...\n');
  
  // Check branches
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('*');
  console.log('📍 BRANCHES:', branches?.length || 0, 'records');
  if (branches) console.log(JSON.stringify(branches, null, 2));
  
  // Check service_catalog
  const { data: services, error: serviceError } = await supabase
    .from('service_catalog')
    .select('*');
  console.log('\n💇 SERVICE_CATALOG:', services?.length || 0, 'records');
  if (services && services.length > 0) {
    console.log('Sample service:', JSON.stringify(services[0], null, 2));
  }
  
  // Check capsters
  const { data: capsters, error: capsterError } = await supabase
    .from('capsters')
    .select('*');
  console.log('\n✂️ CAPSTERS:', capsters?.length || 0, 'records');
  if (capsters && capsters.length > 0) {
    console.log('Sample capster:', JSON.stringify(capsters[0], null, 2));
  }
  
  // Check bookings
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('\n📅 BOOKINGS (recent 5):', bookings?.length || 0, 'records');
  if (bookings) console.log(JSON.stringify(bookings, null, 2));
  
  // Check barbershop_customers
  const { data: customers, error: customerError } = await supabase
    .from('barbershop_customers')
    .select('*')
    .limit(5);
  console.log('\n👤 BARBERSHOP_CUSTOMERS:', customers?.length || 0, 'records');
  if (customers && customers.length > 0) {
    console.log('Sample customer:', JSON.stringify(customers[0], null, 2));
  }
}

checkDatabase().catch(console.error);
