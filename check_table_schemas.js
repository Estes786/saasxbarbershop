require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('\n📊 TABLE SCHEMAS ANALYSIS\n');
  console.log('='.repeat(80));

  // 1. Check user_profiles columns
  console.log('\n1️⃣  user_profiles COLUMNS:');
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (profiles && profiles[0]) {
    console.log('  Columns:', Object.keys(profiles[0]).join(', '));
    console.log('  Sample data:', profiles[0]);
  }

  // 2. Check barbershop_customers columns
  console.log('\n2️⃣  barbershop_customers COLUMNS:');
  const { data: customers } = await supabase
    .from('barbershop_customers')
    .select('*')
    .limit(1);
  
  if (customers && customers[0]) {
    console.log('  Columns:', Object.keys(customers[0]).join(', '));
    console.log('  Sample data:', customers[0]);
  } else {
    console.log('  ❌ No data or error');
  }

  // 3. Check if there's user_id FK in barbershop_customers
  console.log('\n3️⃣  CHECKING FOREIGN KEY RELATIONSHIP:');
  const { data: allCustomers } = await supabase
    .from('barbershop_customers')
    .select('*')
    .limit(5);
  
  if (allCustomers && allCustomers.length > 0) {
    console.log(`  Found ${allCustomers.length} customer records`);
    const hasUserId = 'user_id' in allCustomers[0];
    console.log(`  Has user_id column: ${hasUserId ? '✅ YES' : '❌ NO'}`);
    if (!hasUserId) {
      console.log('  🚨 PROBLEM: No user_id FK! Using customer_phone is causing shared data issue!');
    }
  }

  // 4. Check user_profiles counts
  console.log('\n4️⃣  DATA COUNTS:');
  const { count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  const { count: customerCount } = await supabase
    .from('barbershop_customers')
    .select('*', { count: 'exact', head: true });

  console.log(`  user_profiles: ${profileCount}`);
  console.log(`  barbershop_customers: ${customerCount}`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Schema analysis complete!\n');
}

main().catch(console.error);
