#!/usr/bin/env node

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function analyzeDatabase() {
  console.log('🔍 Analyzing Supabase Database Current State...\n');
  
  try {
    // Check tables
    const tablesResp = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_SERVICE_KEY}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    if (!tablesResp.ok) {
      console.error('❌ Failed to connect to Supabase');
      console.error('Response:', await tablesResp.text());
      return;
    }
    
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Check existing tables
    const tables = [
      'user_profiles',
      'barbershop_customers', 
      'barbershop_transactions',
      'bookings',
      'barbershop_analytics_daily',
      'barbershop_actionable_insights',
      'barbershop_customer_reviews',
      'service_catalog',
      'capsters',
      'booking_slots',
      'customer_loyalty',
      'customer_reviews'
    ];
    
    console.log('📊 CHECKING TABLES:\n');
    for (const table of tables) {
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?select=count`, 
          {
            method: 'HEAD',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Prefer': 'count=exact'
            }
          }
        );
        
        if (resp.ok) {
          const count = resp.headers.get('content-range')?.split('/')[1] || '0';
          console.log(`  ✅ ${table.padEnd(35)} - ${count} rows`);
        } else {
          console.log(`  ❌ ${table.padEnd(35)} - NOT EXISTS`);
        }
      } catch (err) {
        console.log(`  ❌ ${table.padEnd(35)} - ERROR: ${err.message}`);
      }
    }
    
    // Check user_profiles structure
    console.log('\n📋 USER_PROFILES SAMPLE (first 5):');
    const profilesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?select=id,email,full_name,role&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (profilesResp.ok) {
      const profiles = await profilesResp.json();
      console.table(profiles);
    }
    
    // Check bookings
    console.log('\n📅 BOOKINGS SAMPLE (first 5):');
    const bookingsResp = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?select=*&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (bookingsResp.ok) {
      const bookings = await bookingsResp.json();
      console.table(bookings);
    } else {
      console.log('  ⚠️ Bookings table not accessible or empty');
    }
    
    // Check service_catalog
    console.log('\n💇 SERVICE_CATALOG:');
    const servicesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/service_catalog?select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (servicesResp.ok) {
      const services = await servicesResp.json();
      if (services.length > 0) {
        console.table(services);
      } else {
        console.log('  ⚠️ Service catalog is empty - needs seeding');
      }
    } else {
      console.log('  ❌ Service catalog table does not exist');
    }
    
    // Check capsters
    console.log('\n✂️ CAPSTERS:');
    const capstersResp = await fetch(
      `${SUPABASE_URL}/rest/v1/capsters?select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (capstersResp.ok) {
      const capsters = await capstersResp.json();
      if (capsters.length > 0) {
        console.table(capsters);
      } else {
        console.log('  ⚠️ Capsters table is empty - needs seeding');
      }
    } else {
      console.log('  ❌ Capsters table does not exist');
    }
    
    console.log('\n✨ Database analysis complete!\n');
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
  }
}

analyzeDatabase();
