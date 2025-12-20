const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking Database Status...\n');
  console.log('=' .repeat(70));
  
  const tables = [
    'user_profiles',
    'barbershop_transactions',
    'barbershop_customers',
    'barbershop_analytics_daily',
    'barbershop_actionable_leads',
    'barbershop_campaign_tracking',
    'bookings'
  ];
  
  console.log('\n📊 Tables Status:\n');
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table.padEnd(35)} - NOT EXISTS`);
        } else {
          console.log(`⚠️  ${table.padEnd(35)} - Error: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table.padEnd(35)} - EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`⚠️  ${table.padEnd(35)} - Exception: ${err.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n🔑 Testing Authentication...\n');
  
  // Test user creation
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log(`❌ Auth Error: ${error.message}`);
    } else {
      console.log(`✅ Auth Working - ${data.users.length} users found`);
      
      if (data.users.length > 0) {
        console.log('\n👥 Recent Users:');
        data.users.slice(0, 5).forEach(user => {
          console.log(`   - ${user.email || user.phone || 'No email'} (${user.id.substring(0, 8)}...)`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ Auth Exception: ${err.message}`);
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n✅ Database check complete!\n');
}

checkDatabase().catch(console.error);
