require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabaseState() {
  console.log('\n🔍 ANALYZING SUPABASE DATABASE STATE...\n');
  
  try {
    // 1. Check user_profiles table
    console.log('1️⃣ Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('role')
      .limit(1);
    
    if (!profilesError) {
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      console.log(`   ✅ user_profiles: ${count} records`);
    } else {
      console.log('   ❌ Error:', profilesError.message);
    }

    // 2. Check access_keys table (if exists)
    console.log('\n2️⃣ Checking access_keys table...');
    const { data: keys, error: keysError } = await supabase
      .from('access_keys')
      .select('*')
      .limit(5);
    
    if (!keysError) {
      console.log(`   ✅ access_keys table EXISTS with ${keys.length} keys`);
      if (keys.length > 0) {
        console.log('\n   🔑 Existing Access Keys:');
        keys.forEach(key => {
          console.log(`      - ${key.key_name}: ${key.access_key} (${key.role})`);
        });
      }
    } else {
      console.log('   ❌ access_keys table NOT FOUND');
      console.log('   📝 Need to create access_keys table');
    }

    // 3. Check other tables
    console.log('\n3️⃣ Checking other tables...');
    const tables = ['barbershop_customers', 'bookings', 'barbershop_transactions'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ✅ ${table}: ${count} records`);
      } else {
        console.log(`   ❌ ${table}: Not found`);
      }
    }

    console.log('\n✅ Database analysis complete!\n');

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  }
}

analyzeDatabaseState();
