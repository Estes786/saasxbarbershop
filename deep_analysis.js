require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 DEEP RESEARCH: BALIK.LAGI PLATFORM ANALYSIS');
  console.log('='.repeat(60));
  console.log('Date:', new Date().toISOString());
  console.log('='.repeat(60));
  console.log('\n');

  const tableQueries = [
    { name: 'barbershop_profiles', display: '🏪 Barbershop Profiles', icon: '🏪' },
    { name: 'branches', display: '🏢 Branches', icon: '🏢' },
    { name: 'user_profiles', display: '👤 User Profiles', icon: '👤' },
    { name: 'capsters', display: '✂️ Capsters', icon: '✂️' },
    { name: 'service_catalog', display: '📋 Services', icon: '📋' },
    { name: 'bookings', display: '📅 Bookings', icon: '📅' },
    { name: 'barbershop_customers', display: '👥 Customers', icon: '👥' },
    { name: 'access_keys', display: '🔑 Access Keys', icon: '🔑' }
  ];

  console.log('📊 SECTION 1: DATABASE TABLES & RECORD COUNTS');
  console.log('-'.repeat(60));
  
  const tableStats = {};
  
  for (const table of tableQueries) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        tableStats[table.name] = count || 0;
        console.log(`${table.icon} ${table.display.padEnd(35)} : ${count || 0} records`);
      } else {
        tableStats[table.name] = null;
        console.log(`${table.icon} ${table.display.padEnd(35)} : ❌ Table not found`);
      }
    } catch (e) {
      tableStats[table.name] = null;
      console.log(`${table.icon} ${table.display.padEnd(35)} : ❌ Error`);
    }
  }

  console.log('\n📊 SECTION 2: BOOKING SYSTEM ANALYSIS');
  console.log('-'.repeat(60));
  
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error loading bookings:', error.message);
    } else if (!bookings || bookings.length === 0) {
      console.log('⚠️  NO BOOKINGS FOUND - This is a CRITICAL issue!');
      console.log('   Customers cannot make bookings or all bookings failed.');
    } else {
      console.log(`✅ Total Bookings: ${bookings.length}`);
      
      // Status breakdown
      const statusCounts = bookings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n   Booking Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / bookings.length) * 100).toFixed(1);
        console.log(`   - ${status.toUpperCase().padEnd(12)} : ${count} (${percentage}%)`);
      });
      
      // Recent bookings
      console.log('\n   📅 5 Most Recent Bookings:');
      bookings.slice(0, 5).forEach((b, i) => {
        console.log(`   ${i+1}. ${b.booking_date} | ${b.status} | ${b.customer_name || 'N/A'}`);
      });
    }
  } catch (e) {
    console.error('❌ Error in booking analysis:', e.message);
  }

  console.log('\n📊 SECTION 3: SERVICE & CAPSTER AVAILABILITY');
  console.log('-'.repeat(60));
  
  try {
    // Services
    const { data: services } = await supabase
      .from('service_catalog')
      .select('*');
    
    if (services && services.length > 0) {
      console.log(`✅ Services Available: ${services.length}`);
      console.log(`   Average Price: Rp ${Math.round(services.reduce((sum, s) => sum + (s.base_price || 0), 0) / services.length).toLocaleString()}`);
    } else {
      console.log('⚠️  NO SERVICES AVAILABLE');
    }

    // Capsters
    const { data: capsters } = await supabase
      .from('capsters')
      .select('*');
    
    if (capsters && capsters.length > 0) {
      const approved = capsters.filter(c => c.status === 'approved').length;
      const withBranch = capsters.filter(c => c.branch_id).length;
      
      console.log(`\n✅ Total Capsters: ${capsters.length}`);
      console.log(`   - Approved: ${approved} (${((approved/capsters.length)*100).toFixed(1)}%)`);
      console.log(`   - With Branch: ${withBranch} (${((withBranch/capsters.length)*100).toFixed(1)}%)`);
      
      if (approved < capsters.length) {
        console.log(`   ⚠️  WARNING: ${capsters.length - approved} capsters waiting approval!`);
      }
    } else {
      console.log('⚠️  NO CAPSTERS AVAILABLE');
    }
  } catch (e) {
    console.error('❌ Error analyzing services/capsters:', e.message);
  }

  console.log('\n📊 SECTION 4: MULTI-LOCATION FEATURE STATUS');
  console.log('-'.repeat(60));
  
  try {
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*');
    
    if (error || !branches || branches.length === 0) {
      console.log('❌ MULTI-LOCATION: NOT IMPLEMENTED');
      console.log('   This is a critical missing feature for monetization.');
    } else {
      console.log(`✅ MULTI-LOCATION: ENABLED (${branches.length} branches)`);
      branches.forEach((b, i) => {
        console.log(`   ${i+1}. ${b.branch_name} - ${b.address || 'No address'}`);
      });
    }
  } catch (e) {
    console.log('❌ MULTI-LOCATION: NOT IMPLEMENTED (table missing)');
  }

  console.log('\n📊 SECTION 5: CUSTOMER BASE ANALYSIS');
  console.log('-'.repeat(60));
  
  try {
    const { count: customerCount } = await supabase
      .from('barbershop_customers')
      .select('*', { count: 'exact', head: true });
    
    const { count: userCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');
    
    console.log(`Total Registered Customers: ${userCount || 0}`);
    console.log(`Customers in barbershop_customers: ${customerCount || 0}`);
    
    if (userCount > 0 && customerCount === 0) {
      console.log('⚠️  WARNING: User-Customer sync issue detected!');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n📊 SECTION 6: MONETIZATION READINESS ASSESSMENT');
  console.log('-'.repeat(60));
  
  const scores = {
    coreFeatures: 0,
    dataQuality: 0,
    userBase: 0,
    scalability: 0
  };

  // Core Features (40 points max)
  if (tableStats.bookings !== null && tableStats.bookings > 0) scores.coreFeatures += 15;
  if (tableStats.service_catalog !== null && tableStats.service_catalog > 0) scores.coreFeatures += 10;
  if (tableStats.capsters !== null && tableStats.capsters > 0) scores.coreFeatures += 10;
  if (tableStats.access_keys !== null) scores.coreFeatures += 5;

  // Data Quality (30 points max)
  if (tableStats.bookings !== null && tableStats.bookings > 10) scores.dataQuality += 15;
  if (tableStats.barbershop_customers !== null && tableStats.barbershop_customers > 5) scores.dataQuality += 10;
  if (tableStats.service_catalog !== null && tableStats.service_catalog >= 3) scores.dataQuality += 5;

  // User Base (20 points max)
  if (tableStats.user_profiles !== null && tableStats.user_profiles > 5) scores.userBase += 10;
  if (tableStats.barbershop_customers !== null && tableStats.barbershop_customers > 3) scores.userBase += 10;

  // Scalability (10 points max)
  if (tableStats.branches !== null && tableStats.branches > 0) scores.scalability += 10;

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const percentage = (totalScore / 100) * 100;

  console.log('\n🎯 MONETIZATION READINESS SCORE:');
  console.log(`   Core Features    : ${scores.coreFeatures}/40 points`);
  console.log(`   Data Quality     : ${scores.dataQuality}/30 points`);
  console.log(`   User Base        : ${scores.userBase}/20 points`);
  console.log(`   Scalability      : ${scores.scalability}/10 points`);
  console.log(`   ${'─'.repeat(40)}`);
  console.log(`   TOTAL SCORE      : ${totalScore}/100 (${percentage.toFixed(1)}%)`);
  
  console.log('\n📈 READINESS LEVEL:');
  if (percentage >= 80) {
    console.log('   ✅ READY TO MONETIZE - Platform siap untuk monetisasi!');
  } else if (percentage >= 60) {
    console.log('   🟡 NEARLY READY - Perlu perbaikan minor sebelum monetisasi');
  } else if (percentage >= 40) {
    console.log('   🟠 NEEDS WORK - Perlu development signifikan');
  } else {
    console.log('   🔴 NOT READY - Platform belum siap untuk monetisasi');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(60) + '\n');
}

analyzeDatabase().catch(console.error);
