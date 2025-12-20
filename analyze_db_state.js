const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING DATABASE STATE...\n');
  
  // 1. Check all tables
  console.log('📊 TABLE STRUCTURE:');
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'bookings',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking'
  ];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`  ❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: ${count} rows`);
    }
  }
  
  // 2. Check RLS status
  console.log('\n🔐 ROW LEVEL SECURITY (RLS) STATUS:');
  const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_status', {});
  
  if (rlsError) {
    console.log('  ⚠️  Cannot check RLS status (function may not exist)');
  } else {
    console.log('  RLS Status:', rlsData);
  }
  
  // 3. Sample data from key tables
  console.log('\n👥 USER PROFILES:');
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, email, role, full_name, created_at')
    .limit(5);
  
  if (!usersError && users) {
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - ${u.full_name || 'N/A'}`);
    });
  }
  
  // 4. Check Edge Functions
  console.log('\n⚡ EDGE FUNCTIONS:');
  console.log('  (Check manually in Supabase Dashboard)');
  
  console.log('\n✅ DATABASE ANALYSIS COMPLETE!');
}

analyzeDatabase().catch(console.error);
