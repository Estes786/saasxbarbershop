const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeDatabase() {
  console.log('🔍 DEEP ANALYSIS: Database Schema - BALIK.LAGI System\n');
  console.log('=' .repeat(80));
  
  try {
    // 1. Check all tables
    console.log('\n📊 ANALYZING ALL TABLES:\n');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      // Alternative method to get tables
      const tablesList = [
        'barbershop_profiles',
        'branches',
        'user_profiles',
        'capsters',
        'service_catalog',
        'bookings',
        'barbershop_customers',
        'access_keys',
        'booking_sessions'
      ];
      
      console.log('Available tables (from known schema):');
      for (const tableName of tablesList) {
        // Get column details for each table
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`\n✅ Table: ${tableName}`);
          
          // Get first row to see structure
          const { data: sample, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (sample && sample.length > 0) {
            console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
          }
          
          // Count records
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`   Record count: ${count}`);
          }
        } else {
          console.log(`\n❌ Table: ${tableName} - ${error.message}`);
        }
      }
    }
    
    // 2. Check barbershop_customers specifically for phone column
    console.log('\n\n📋 DETAILED ANALYSIS: barbershop_customers table\n');
    
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.log(`❌ ERROR: ${customersError.message}`);
      console.log(`   Details: ${customersError.details || 'No details'}`);
      console.log(`   Hint: ${customersError.hint || 'No hint'}`);
    } else {
      if (customers && customers.length > 0) {
        console.log('✅ Table exists with columns:');
        console.log(`   ${Object.keys(customers[0]).join('\n   ')}`);
      } else {
        console.log('✅ Table exists but empty');
      }
    }
    
    // 3. Check bookings table structure
    console.log('\n\n📋 DETAILED ANALYSIS: bookings table\n');
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingsError) {
      console.log(`❌ ERROR: ${bookingsError.message}`);
    } else {
      if (bookings && bookings.length > 0) {
        console.log('✅ Table exists with columns:');
        console.log(`   ${Object.keys(bookings[0]).join('\n   ')}`);
      } else {
        console.log('✅ Table exists but empty');
      }
      
      // Count bookings
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });
      
      console.log(`\n   Total bookings: ${count || 0}`);
    }
    
    // 4. Check capsters table
    console.log('\n\n📋 DETAILED ANALYSIS: capsters table\n');
    
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*')
      .limit(5);
    
    if (capstersError) {
      console.log(`❌ ERROR: ${capstersError.message}`);
    } else {
      console.log(`✅ Found ${capsters.length} capsters`);
      if (capsters.length > 0) {
        console.log('   Columns:', Object.keys(capsters[0]).join(', '));
        
        // Check status
        capsters.forEach(c => {
          console.log(`   - ${c.capster_name}: status=${c.status}, is_active=${c.is_active}`);
        });
      }
    }
    
    // 5. Check branches table
    console.log('\n\n📋 DETAILED ANALYSIS: branches table\n');
    
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*');
    
    if (branchesError) {
      console.log(`❌ ERROR: ${branchesError.message}`);
    } else {
      console.log(`✅ Found ${branches.length} branches`);
      branches.forEach(b => {
        console.log(`   - ${b.branch_name} (${b.branch_code})`);
      });
    }
    
    // 6. Check service_catalog
    console.log('\n\n📋 DETAILED ANALYSIS: service_catalog table\n');
    
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(5);
    
    if (servicesError) {
      console.log(`❌ ERROR: ${servicesError.message}`);
    } else {
      console.log(`✅ Found ${services.length} services`);
      if (services.length > 0) {
        console.log('   Columns:', Object.keys(services[0]).join(', '));
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Database analysis complete!\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('   Stack:', error.stack);
  }
}

analyzeDatabase();
