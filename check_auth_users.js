#!/usr/bin/env node
/**
 * Check auth.users table directly
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  console.log('\n🔍 Checking auth.users for customer3test@gmail.com...\n');
  
  try {
    // Try to get user from admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Error listing users:', error.message);
      return;
    }
    
    console.log(`Total users in auth.users: ${users.length}\n`);
    
    const targetUser = users.find(u => u.email === 'customer3test@gmail.com');
    
    if (targetUser) {
      console.log('✅ Found user in auth.users:');
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   Phone: ${targetUser.phone || 'null'}`);
      console.log(`   Created: ${targetUser.created_at}`);
      console.log(`   Email confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   User metadata:`, JSON.stringify(targetUser.user_metadata, null, 2));
      
      // Now check user_profiles
      console.log('\n\n🔍 Checking user_profiles table...\n');
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUser.id)
        .single();
      
      if (profileError) {
        console.log(`❌ No profile found: ${profileError.message}`);
        console.log('\n⚡ ROOT CAUSE: User exists in auth.users but NOT in user_profiles!');
        console.log('   Need to create user_profiles record.');
      } else {
        console.log('✅ Profile found:');
        console.log(`   User ID: ${profile.user_id}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Name: ${profile.full_name}`);
        console.log(`   Phone: ${profile.phone}`);
        console.log(`   Role: ${profile.role}`);
      }
      
      // Check barbershop_customers
      console.log('\n\n🔍 Checking barbershop_customers table...\n');
      
      const { data: customer, error: custError } = await supabase
        .from('barbershop_customers')
        .select('*')
        .eq('user_id', targetUser.id)
        .single();
      
      if (custError) {
        console.log(`❌ No customer record: ${custError.message}`);
        console.log('\n⚡ ROOT CAUSE: User exists but NOT in barbershop_customers!');
      } else {
        console.log('✅ Customer record found:');
        console.log(`   Phone: ${customer.customer_phone}`);
        console.log(`   Name: ${customer.customer_name}`);
        console.log(`   Visits: ${customer.total_visits}`);
        console.log(`   Points: ${customer.loyalty_points}`);
      }
      
    } else {
      console.log('❌ User customer3test@gmail.com NOT FOUND in auth.users');
      console.log('\n⚡ ROOT CAUSE: User does not exist at all!');
      console.log('   User needs to register first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAuthUsers();
