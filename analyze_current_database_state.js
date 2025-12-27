const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function analyzeDatabase() {
  console.log('\n🔍 ANALYZING SUPABASE DATABASE CURRENT STATE\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check tables
    console.log('\n📋 TABLE STATUS:');
    const tables = [
      'user_profiles',
      'barbershop_customers',
      'barbershop_transactions',
      'capsters',
      'service_catalog',
      'bookings',
      'customer_visit_history',
      'customer_predictions'
    ];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ❌ ${table}: DOESN'T EXIST or ERROR`);
        } else {
          console.log(`  ✅ ${table}: EXISTS (${count || 0} rows)`);
        }
      } catch (e) {
        console.log(`  ❌ ${table}: ERROR - ${e.message}`);
      }
    }
    
    // 2. Check capsters table structure
    console.log('\n\n👨‍💼 CAPSTERS TABLE:');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*')
      .limit(5);
    
    if (capstersError) {
      console.log('  ❌ Error querying capsters:', capstersError.message);
    } else if (capsters && capsters.length > 0) {
      console.log(`  ✅ Found ${capsters.length} capsters`);
      capsters.forEach(c => {
        console.log(`     - ${c.capster_name} (ID: ${c.id.substring(0, 8)}...)`);
      });
    } else {
      console.log('  ⚠️  Table exists but empty');
    }
    
    // 3. Check bookings table
    console.log('\n\n📅 BOOKINGS TABLE:');
    const { data: bookings, error: bookingsError, count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (bookingsError) {
      console.log('  ❌ Error querying bookings:', bookingsError.message);
    } else {
      console.log(`  ✅ Total bookings: ${bookingsCount || 0}`);
      if (bookings && bookings.length > 0) {
        console.log('  Sample bookings:');
        bookings.forEach((b, i) => {
          console.log(`     ${i+1}. Status: ${b.status}, Customer: ${b.customer_phone}`);
        });
      }
    }
    
    // 4. Check service_catalog
    console.log('\n\n💇 SERVICE CATALOG:');
    const { data: services, error: servicesError, count: servicesCount } = await supabase
      .from('service_catalog')
      .select('*', { count: 'exact' });
    
    if (servicesError) {
      console.log('  ❌ Error querying services:', servicesError.message);
    } else {
      console.log(`  ✅ Total services: ${servicesCount || 0}`);
      if (services && services.length > 0) {
        services.forEach(s => {
          console.log(`     - ${s.service_name}: Rp ${s.base_price} (${s.duration_minutes} min)`);
        });
      }
    }
    
    // 5. Check barbershop_customers
    console.log('\n\n👥 CUSTOMERS:');
    const { data: customers, error: customersError, count: customersCount } = await supabase
      .from('barbershop_customers')
      .select('*', { count: 'exact', head: true });
    
    if (customersError) {
      console.log('  ❌ Error querying customers:', customersError.message);
    } else {
      console.log(`  ✅ Total customers: ${customersCount || 0}`);
    }
    
    // 6. Check user_profiles by role
    console.log('\n\n🔐 USER PROFILES BY ROLE:');
    const roles = ['customer', 'capster', 'admin'];
    for (const role of roles) {
      const { data: users, error: usersError, count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', role);
      
      if (!usersError) {
        console.log(`  ${role.toUpperCase()}: ${userCount || 0} users`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE ANALYSIS COMPLETE!\n');
    
  } catch (error) {
    console.error('\n❌ ANALYSIS ERROR:', error.message);
    console.error(error);
  }
}

analyzeDatabase().then(() => process.exit(0));
