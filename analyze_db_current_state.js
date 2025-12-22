const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('\n🔍 ANALYZING CURRENT DATABASE STATE...\n');

  try {
    // 1. Check tables existence
    console.log('📊 TABLES STATUS:');
    console.log('='.repeat(80));
    
    const tables = [
      'user_profiles',
      'barbershop_customers',
      'barbershop_transactions',
      'capsters',
      'service_catalog',
      'booking_slots',
      'bookings',
      'customer_loyalty',
      'customer_reviews'
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table.padEnd(30)} - NOT EXISTS or NO ACCESS`);
        } else {
          console.log(`✅ ${table.padEnd(30)} - ${count || 0} rows`);
        }
      } catch (e) {
        console.log(`❌ ${table.padEnd(30)} - ERROR: ${e.message}`);
      }
    }

    // 2. Check user_profiles structure and data
    console.log('\n👥 USER_PROFILES ANALYSIS:');
    console.log('='.repeat(80));
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role, customer_phone, capster_id, created_at')
      .limit(10);

    if (profilesError) {
      console.log(`❌ Error fetching user_profiles: ${profilesError.message}`);
    } else {
      console.log(`Total profiles: ${profiles.length}`);
      const roleCount = profiles.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      }, {});
      console.log('Role distribution:', JSON.stringify(roleCount, null, 2));
      console.log('\nSample data:');
      profiles.slice(0, 3).forEach(p => {
        console.log(`  - ${p.email} | Role: ${p.role} | Phone: ${p.customer_phone || 'N/A'}`);
      });
    }

    // 3. Check RLS policies
    console.log('\n🔒 RLS POLICIES CHECK:');
    console.log('='.repeat(80));
    
    // Try to query as authenticated user (this will fail if RLS is too strict)
    const { data: testQuery, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  RLS policies might be too strict or have issues:');
      console.log(`   Error: ${testError.message}`);
    } else {
      console.log('✅ RLS policies allow basic queries');
    }

    // 4. Check barbershop_customers
    console.log('\n📱 BARBERSHOP_CUSTOMERS ANALYSIS:');
    console.log('='.repeat(80));
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('customer_phone, customer_name, total_visits, total_revenue')
      .limit(5);

    if (customersError) {
      console.log(`❌ Error fetching customers: ${customersError.message}`);
    } else {
      console.log(`Total customers: ${customers.length}`);
      console.log('\nSample data:');
      customers.forEach(c => {
        console.log(`  - ${c.customer_name} (${c.customer_phone}) | Visits: ${c.total_visits} | Revenue: ${c.total_revenue}`);
      });
    }

    // 5. Check if capsters table exists and has data
    console.log('\n💇 CAPSTERS TABLE CHECK:');
    console.log('='.repeat(80));
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*')
      .limit(5);

    if (capstersError) {
      console.log(`❌ Capsters table not found or error: ${capstersError.message}`);
      console.log('   🚨 CRITICAL: Capsters table needs to be created!');
    } else {
      console.log(`✅ Capsters table exists with ${capsters.length} records`);
      if (capsters.length > 0) {
        console.log('\nSample capsters:');
        capsters.forEach(c => {
          console.log(`  - ${c.capster_name} | Spec: ${c.specialization} | Rating: ${c.rating}`);
        });
      } else {
        console.log('   ⚠️  No capster data found - needs seeding');
      }
    }

    // 6. Check service_catalog
    console.log('\n💈 SERVICE_CATALOG CHECK:');
    console.log('='.repeat(80));
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.log(`❌ Service catalog not found or error: ${servicesError.message}`);
      console.log('   🚨 CRITICAL: Service catalog needs to be created!');
    } else {
      console.log(`✅ Service catalog exists with ${services.length} records`);
      if (services.length > 0) {
        console.log('\nSample services:');
        services.forEach(s => {
          console.log(`  - ${s.service_name} | Category: ${s.service_category} | Price: ${s.base_price}`);
        });
      } else {
        console.log('   ⚠️  No service data found - needs seeding');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE ANALYSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run analysis
analyzeDatabase()
  .then(() => {
    console.log('\n✅ Analysis finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
