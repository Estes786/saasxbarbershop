const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');
  
  const tables = [
    'barbershop_profiles',
    'capsters',
    'service_catalog',
    'access_keys',
    'onboarding_progress'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table "${table}" does NOT exist yet`);
    } else {
      console.log(`✅ Table "${table}" EXISTS`);
    }
  }
}

checkTables();
