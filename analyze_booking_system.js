const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function analyzeBookingSystem() {
  console.log('🔍 Analyzing Booking System Requirements...\n');
  
  try {
    // Check existing tables
    console.log('📊 Current Tables:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('Using alternative method to check tables...');
    }
    
    // Check user_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (!profilesError) {
      console.log(`✅ user_profiles: ${profiles.length} records found`);
      console.log('   Columns:', Object.keys(profiles[0] || {}));
    }
    
    // Check barbershop_customers
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(5);
    
    if (!customersError) {
      console.log(`✅ barbershop_customers: ${customers.length} records found`);
      console.log('   Columns:', Object.keys(customers[0] || {}));
    }
    
    // Check bookings table
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(5);
    
    if (!bookingsError) {
      console.log(`✅ bookings: ${bookings.length} records found`);
      console.log('   Columns:', Object.keys(bookings[0] || {}));
    } else {
      console.log('❌ bookings table not found or error:', bookingsError.message);
    }
    
    // Check if capsters list exists
    const { data: capsters, error: capstersError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'capster');
    
    if (!capstersError) {
      console.log(`\n👨‍💼 Capsters available: ${capsters.length}`);
      capsters.forEach(c => {
        console.log(`   - ${c.full_name || c.customer_name || c.email} (${c.capster_id || 'No ID'})`);
      });
    }
    
    // Check service_catalog
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*');
    
    if (!servicesError && services) {
      console.log(`\n💈 Services: ${services.length} services available`);
      services.forEach(s => {
        console.log(`   - ${s.service_name}: Rp ${s.base_price} (${s.duration_minutes} min)`);
      });
    } else {
      console.log('\n❌ service_catalog not found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 MISSING FOR BOOKING SYSTEM:');
    console.log('='.repeat(60));
    
    const missing = [];
    
    if (bookingsError) missing.push('✗ bookings table');
    if (servicesError) missing.push('✗ service_catalog table');
    if (capsters.length === 0) missing.push('✗ No capsters registered');
    
    if (missing.length > 0) {
      console.log(missing.join('\n'));
    } else {
      console.log('✅ All requirements met!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeBookingSystem();
