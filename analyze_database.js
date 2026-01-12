const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING SUPABASE DATABASE SCHEMA...\n');

  // 1. Check bookings table
  console.log('📋 TABLE: bookings');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);
  
  if (bookingsError) {
    console.log('❌ Error:', bookingsError.message);
  } else {
    console.log('✅ Bookings table exists');
    if (bookings && bookings.length > 0) {
      console.log('   Columns:', Object.keys(bookings[0]).join(', '));
    }
  }

  // 2. Check barbershop_customers table
  console.log('\n📋 TABLE: barbershop_customers');
  const { data: customers, error: customersError } = await supabase
    .from('barbershop_customers')
    .select('*')
    .limit(1);
  
  if (customersError) {
    console.log('❌ Error:', customersError.message);
  } else {
    console.log('✅ barbershop_customers table exists');
    if (customers && customers.length > 0) {
      console.log('   Columns:', Object.keys(customers[0]).join(', '));
    }
  }

  // 3. Check capsters table
  console.log('\n📋 TABLE: capsters');
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('*')
    .limit(1);
  
  if (capstersError) {
    console.log('❌ Error:', capstersError.message);
  } else {
    console.log('✅ capsters table exists');
    if (capsters && capsters.length > 0) {
      console.log('   Columns:', Object.keys(capsters[0]).join(', '));
    }
  }

  // 4. Check service_catalog table
  console.log('\n📋 TABLE: service_catalog');
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('*')
    .limit(1);
  
  if (servicesError) {
    console.log('❌ Error:', servicesError.message);
  } else {
    console.log('✅ service_catalog table exists');
    if (services && services.length > 0) {
      console.log('   Columns:', Object.keys(services[0]).join(', '));
    }
  }

  // 5. Check branches table
  console.log('\n📋 TABLE: branches');
  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('*')
    .limit(1);
  
  if (branchesError) {
    console.log('❌ Error:', branchesError.message);
  } else {
    console.log('✅ branches table exists');
    if (branches && branches.length > 0) {
      console.log('   Columns:', Object.keys(branches[0]).join(', '));
    }
  }

  // 6. Count data
  console.log('\n📊 DATA COUNTS:');
  
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  console.log(`   Bookings: ${bookingsCount || 0}`);

  const { count: customersCount } = await supabase
    .from('barbershop_customers')
    .select('*', { count: 'exact', head: true });
  console.log(`   Customers: ${customersCount || 0}`);

  const { count: capstersCount } = await supabase
    .from('capsters')
    .select('*', { count: 'exact', head: true });
  console.log(`   Capsters: ${capstersCount || 0}`);

  const { count: servicesCount } = await supabase
    .from('service_catalog')
    .select('*', { count: 'exact', head: true });
  console.log(`   Services: ${servicesCount || 0}`);

  const { count: branchesCount } = await supabase
    .from('branches')
    .select('*', { count: 'exact', head: true });
  console.log(`   Branches: ${branchesCount || 0}`);

  console.log('\n✅ DATABASE ANALYSIS COMPLETE!\n');
}

analyzeDatabase().catch(console.error);
