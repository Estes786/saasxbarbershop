const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

// Use service role for admin access
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verify() {
  console.log('🔍 VERIFYING NEW TABLES WITH SERVICE ROLE...\n');
  
  // Try direct insert test
  console.log('📝 Testing service_catalog insert...');
  try {
    const { data, error } = await supabase
      .from('service_catalog')
      .insert({
        service_name: 'Test Service',
        service_category: 'haircut',
        base_price: 30000,
        duration_minutes: 30,
        display_order: 999
      })
      .select();
    
    if (error) {
      console.log('❌ Insert error:', error.message);
      console.log('   This might mean table doesn\'t exist yet');
    } else {
      console.log('✅ Insert successful! Table exists and is writable');
      console.log('   Data:', data);
      
      // Clean up test data
      if (data && data[0]) {
        await supabase.from('service_catalog').delete().eq('id', data[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  
  console.log('\n📋 CONCLUSION:');
  console.log('If insert failed, tables need to be created via Supabase SQL Editor');
  console.log('SQL file ready at: /home/user/webapp/APPLY_3_ROLE_SCHEMA.sql');
}

verify().catch(console.error);
