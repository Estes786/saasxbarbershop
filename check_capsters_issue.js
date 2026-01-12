const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function checkCapstersIssue() {
  console.log('🔍 Checking capsters table issue...\n');

  try {
    // Check if capsters table exists
    const { data: tables, error: tablesError } = await supabase
      .from('capsters')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.log('❌ ERROR: capsters table issue:', tablesError.message);
      console.log('\n📋 Possible issues:');
      console.log('1. Table does not exist');
      console.log('2. RLS policies blocking access');
      console.log('3. No data in table\n');
      return;
    }

    // Check capsters data
    const { data: capsters, error: capstersError, count } = await supabase
      .from('capsters')
      .select('*', { count: 'exact' });

    if (capstersError) {
      console.log('❌ ERROR loading capsters:', capstersError.message);
      return;
    }

    console.log(`✅ Capsters table exists!`);
    console.log(`📊 Total capsters: ${count || 0}`);
    
    if (capsters && capsters.length > 0) {
      console.log('\n👥 Existing Capsters:');
      capsters.forEach((capster, i) => {
        console.log(`${i + 1}. ${capster.capster_name || capster.full_name} (${capster.email || 'no email'})`);
      });
    } else {
      console.log('\n⚠️  WARNING: No capsters found in database!');
      console.log('This is why "Loading capsters..." shows forever.\n');
    }

    // Check if we can query service_catalog
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.log('\n❌ ERROR: service_catalog issue:', servicesError.message);
    } else {
      console.log(`\n✅ service_catalog table exists with ${services?.length || 0} services`);
    }

    // Check bookings table
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (bookingsError) {
      console.log('❌ ERROR: bookings table issue:', bookingsError.message);
    } else {
      console.log('✅ bookings table exists');
    }

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  }
}

checkCapstersIssue();
