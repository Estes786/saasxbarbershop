const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(query, description) {
  console.log(`\n${description}:`);
  console.log('-'.repeat(80));
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })
      .catch(async () => {
        // Fallback: try direct query
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: query })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        return await response.json();
      });

    if (error) {
      console.log('❌ Error:', error.message || error);
      return null;
    }
    
    console.log('✅ Success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return null;
  }
}

async function analyzeDatabase() {
  console.log('🔍 ANALYZING ACTUAL SUPABASE DATABASE STATE...\n');
  console.log('=' .repeat(80));
  
  try {
    // 1. Check user_profiles table
    console.log('\n👤 1. CHECKING user_profiles DATA:');
    const { data: profiles, error: profilesError, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`✅ Total profiles: ${count || profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('\nSample profiles:');
        profiles.forEach(p => {
          console.log(`  - Email: ${p.email}`);
          console.log(`    Role: ${p.role}`);
          console.log(`    Phone: ${p.customer_phone || 'N/A'}`);
          console.log(`    Name: ${p.customer_name || p.full_name || 'N/A'}`);
          console.log('');
        });
      }
    }

    // 2. Check barbershop_customers
    console.log('\n🏪 2. CHECKING barbershop_customers TABLE:');
    const { data: customers, error: customersError, count: customerCount } = await supabase
      .from('barbershop_customers')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError.message);
      console.log('   This table might not exist yet.');
    } else {
      console.log(`✅ Total customers: ${customerCount || customers?.length || 0}`);
      if (customers && customers.length > 0) {
        console.log('\nSample customers:');
        customers.forEach(c => {
          console.log(`  - Name: ${c.customer_name}`);
          console.log(`    Phone: ${c.customer_phone}`);
          console.log(`    Visits: ${c.total_visits || 0}`);
          console.log('');
        });
      }
    }

    // 3. Test simple SELECT to check RLS
    console.log('\n🔒 3. TESTING RLS POLICIES (as anon user):');
    const anonSupabase = createClient(
      supabaseUrl, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: anonProfiles, error: anonError } = await anonSupabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('⚠️  Anon user cannot read user_profiles:', anonError.message);
      console.log('   This is EXPECTED if RLS is enabled properly.');
    } else {
      console.log('✅ Anon user CAN read profiles. Count:', anonProfiles?.length || 0);
    }

    // 4. Check if tables exist using simple query
    console.log('\n📊 4. CHECKING WHICH TABLES EXIST:');
    const tables = [
      'user_profiles',
      'barbershop_customers', 
      'capsters',
      'service_catalog',
      'bookings',
      'barbershop_transactions'
    ];
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: NOT FOUND or NO ACCESS`);
      } else {
        console.log(`✅ ${tableName}: EXISTS (count check passed)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ BASIC ANALYSIS COMPLETE!');
    console.log('\n📌 NEXT STEPS:');
    console.log('1. Install Supabase CLI to query actual RLS policies');
    console.log('2. Test registration flow');
    console.log('3. Test login flow');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
  }
}

analyzeDatabase();
