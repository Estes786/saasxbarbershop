#!/usr/bin/env node
/**
 * Check user_profiles structure
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserProfiles() {
  console.log('🔍 Checking user_profiles structure\n');
  
  const TARGET_USER_ID = '997f65e1-5ed5-407b-ae4b-a769363c36a9';
  
  // Check user_profiles
  const { data: userProfile, error: upError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', TARGET_USER_ID)
    .single();
  
  if (upError) {
    console.log('❌ Error:', upError.message);
  } else if (userProfile) {
    console.log('✅ user_profiles record:');
    console.log(JSON.stringify(userProfile, null, 2));
  } else {
    console.log('⚠️ No user_profiles record found');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  // Check barbershop_customers
  const { data: customer, error: custError } = await supabase
    .from('barbershop_customers')
    .select('*')
    .eq('user_id', TARGET_USER_ID)
    .single();
  
  if (custError) {
    console.log('❌ Error:', custError.message);
  } else if (customer) {
    console.log('✅ barbershop_customers record:');
    console.log(JSON.stringify(customer, null, 2));
  } else {
    console.log('⚠️ No barbershop_customers record found');
  }
}

checkUserProfiles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
