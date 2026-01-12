const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING DATABASE SCHEMA...\n');
  
  // Check all tables
  const tables = [
    'barbershop_profiles',
    'barbershop_customers', 
    'capsters',
    'service_catalog',
    'bookings',
    'branches',
    'user_profiles'
  ];
  
  for (const table of tables) {
    console.log(`\n📊 TABLE: ${table}`);
    console.log('='.repeat(50));
    
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(3);
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Count: ${count} rows`);
      if (data && data.length > 0) {
        console.log('Sample columns:', Object.keys(data[0]).join(', '));
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
      }
    }
  }
  
  // Check capsters specifically for approval status
  console.log('\n\n🔍 CHECKING CAPSTERS APPROVAL STATUS...');
  console.log('='.repeat(50));
  const { data: capsters, error: capstersError } = await supabase
    .from('capsters')
    .select('capster_name, is_approved, branch_id, barbershop_id');
  
  if (!capstersError && capsters) {
    console.log(`Total capsters: ${capsters.length}`);
    const approved = capsters.filter(c => c.is_approved);
    const notApproved = capsters.filter(c => !c.is_approved);
    console.log(`✅ Approved: ${approved.length}`);
    console.log(`❌ Not Approved: ${notApproved.length}`);
    
    if (notApproved.length > 0) {
      console.log('\n⚠️  NOT APPROVED CAPSTERS:');
      notApproved.forEach(c => {
        console.log(`  - ${c.capster_name} (branch: ${c.branch_id || 'NULL'})`);
      });
    }
  }
  
  // Check bookings
  console.log('\n\n🔍 CHECKING BOOKINGS...');
  console.log('='.repeat(50));
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!bookingsError && bookings) {
    console.log(`Total recent bookings: ${bookings.length}`);
    if (bookings.length > 0) {
      console.log('Latest booking:', JSON.stringify(bookings[0], null, 2));
    } else {
      console.log('⚠️  NO BOOKINGS FOUND!');
    }
  }
  
  // Check branches
  console.log('\n\n🔍 CHECKING BRANCHES...');
  console.log('='.repeat(50));
  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('*');
  
  if (!branchesError && branches) {
    console.log(`Total branches: ${branches.length}`);
    branches.forEach(b => {
      console.log(`  - ${b.branch_name} (ID: ${b.id})`);
    });
  }
  
  // Check services
  console.log('\n\n🔍 CHECKING SERVICES...');
  console.log('='.repeat(50));
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('service_name, base_price, branch_id')
    .limit(5);
  
  if (!servicesError && services) {
    console.log(`Services found: ${services.length}`);
    services.forEach(s => {
      console.log(`  - ${s.service_name}: Rp ${s.base_price} (branch: ${s.branch_id || 'ALL'})`);
    });
  }
}

analyzeDatabase()
  .then(() => {
    console.log('\n\n✅ ANALYSIS COMPLETE!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ ERROR:', err);
    process.exit(1);
  });
