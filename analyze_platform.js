require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING BALIK.LAGI DATABASE SCHEMA...\n');

  // Get all tables
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    console.error('Error fetching tables:', tablesError);
    return;
  }

  console.log('📊 TABLES IN DATABASE:');
  console.log('='.repeat(50));
  
  const tableQueries = [
    { name: 'barbershop_profiles', display: '🏪 Barbershop Profiles' },
    { name: 'branches', display: '🏢 Branches (Multi-Location)' },
    { name: 'user_profiles', display: '👤 User Profiles' },
    { name: 'capsters', display: '✂️ Capsters (Barbers)' },
    { name: 'service_catalog', display: '📋 Service Catalog' },
    { name: 'bookings', display: '📅 Bookings' },
    { name: 'barbershop_customers', display: '👥 Customers' },
    { name: 'access_keys', display: '🔑 Access Keys' }
  ];

  for (const table of tableQueries) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`${table.display}: ${count} records`);
      }
    } catch (e) {
      console.log(`${table.display}: Table tidak ada atau error`);
    }
  }

  console.log('\n📊 BOOKING STATISTICS:');
  console.log('='.repeat(50));
  
  try {
    // Total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total Bookings: ${totalBookings || 0}`);

    // Bookings by status
    const { data: bookingsByStatus } = await supabase
      .from('bookings')
      .select('status');
    
    if (bookingsByStatus) {
      const statusCounts = bookingsByStatus.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nBookings by Status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
    }

    // Recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, booking_date, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentBookings && recentBookings.length > 0) {
      console.log('\n📅 5 Recent Bookings:');
      recentBookings.forEach(b => {
        console.log(`  - ${b.booking_date} | Status: ${b.status} | Created: ${new Date(b.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('\n⚠️ No bookings found in database');
    }
  } catch (e) {
    console.error('Error analyzing bookings:', e.message);
  }

  console.log('\n🎯 SERVICES & CAPSTERS:');
  console.log('='.repeat(50));
  
  try {
    // Services count
    const { count: servicesCount } = await supabase
      .from('service_catalog')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total Services: ${servicesCount || 0}`);

    // Capsters count
    const { count: capstersCount } = await supabase
      .from('capsters')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total Capsters: ${capstersCount || 0}`);

    // Approved capsters
    const { count: approvedCapsters } = await supabase
      .from('capsters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    console.log(`Approved Capsters: ${approvedCapsters || 0}`);

    // Capsters with branch assignment
    const { count: capstersWithBranch } = await supabase
      .from('capsters')
      .select('*', { count: 'exact', head: true })
      .not('branch_id', 'is', null);
    
    console.log(`Capsters with Branch Assignment: ${capstersWithBranch || 0}`);

  } catch (e) {
    console.error('Error analyzing services/capsters:', e.message);
  }

  console.log('\n🏢 MULTI-LOCATION STATUS:');
  console.log('='.repeat(50));
  
  try {
    const { count: branchesCount } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });
    
    if (branchesCount > 0) {
      console.log(`✅ Multi-Location ENABLED: ${branchesCount} branches`);
      
      const { data: branches } = await supabase
        .from('branches')
        .select('branch_name, address');
      
      if (branches) {
        console.log('\nBranches:');
        branches.forEach(b => {
          console.log(`  - ${b.branch_name}: ${b.address}`);
        });
      }
    } else {
      console.log('❌ Multi-Location NOT ENABLED');
    }
  } catch (e) {
    console.log('❌ Branches table does not exist - Multi-Location feature not implemented');
  }

  console.log('\n✅ ANALYSIS COMPLETE\n');
}

analyzeDatabase().catch(console.error);
