#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeDatabase() {
  console.log('='.repeat(80));
  console.log('🔍 ANALYZING SUPABASE DATABASE');
  console.log('='.repeat(80));
  console.log('');

  // Check all tables
  const tables = [
    'user_profiles',
    'barbershop_customers',
    'barbershop_transactions',
    'bookings',
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews',
    'access_keys'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5);

      if (error) {
        console.log(`❌ Table "${table}": ERROR - ${error.message}`);
      } else {
        console.log(`✅ Table "${table}": ${count || 0} rows`);
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
          if (table === 'capsters' || table === 'service_catalog') {
            console.log(`   Sample data:`);
            data.forEach((row, idx) => {
              console.log(`   ${idx + 1}. ${JSON.stringify(row)}`);
            });
          }
        }
      }
    } catch (err) {
      console.log(`❌ Table "${table}": EXCEPTION - ${err.message}`);
    }
    console.log('');
  }

  // Check RLS policies
  console.log('='.repeat(80));
  console.log('🔒 CHECKING RLS POLICIES');
  console.log('='.repeat(80));
  console.log('');

  try {
    const { data: policies, error } = await supabase.rpc('pg_policies', {});
    if (!error && policies) {
      console.log(`Found ${policies.length} RLS policies`);
    }
  } catch (err) {
    console.log('Note: Cannot query RLS policies directly (expected)');
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

analyzeDatabase().catch(console.error);
