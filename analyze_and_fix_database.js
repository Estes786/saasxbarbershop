const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabaseState() {
  console.log('🔍 ANALYZING DATABASE STATE\n');
  console.log('='=== 50);
  
  try {
    // 1. Check user_profiles table
    console.log('\n📊 USER PROFILES TABLE:');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error reading user_profiles:', profileError);
    } else {
      console.log(`✅ Total profiles: ${profiles.length}`);
      profiles.forEach(p => {
        console.log(`  - ${p.email} | Role: ${p.role} | ID: ${p.id}`);
      });
    }
    
    // 2. Check capsters table
    console.log('\n✂️ CAPSTERS TABLE:');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*');
    
    if (capstersError) {
      console.error('❌ Error reading capsters:', capstersError);
    } else {
      console.log(`✅ Total capsters: ${capsters.length}`);
      capsters.forEach(c => {
        console.log(`  - ${c.capster_name} | ID: ${c.id} | UserID: ${c.user_id}`);
      });
    }
    
    // 3. Check barbershop_customers table
    console.log('\n👥 BARBERSHOP_CUSTOMERS TABLE:');
    const { data: customers, error: customersError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Error reading barbershop_customers:', customersError);
    } else {
      console.log(`✅ Total customers (showing first 5): ${customers.length}`);
    }
    
    // 4. Check auth users
    console.log('\n🔐 AUTH USERS:');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error reading auth users:', usersError);
    } else {
      console.log(`✅ Total auth users: ${users.length}`);
      users.forEach(u => {
        console.log(`  - ${u.email} | ID: ${u.id} | Created: ${new Date(u.created_at).toLocaleString()}`);
      });
    }
    
    // 5. Check for orphaned profiles (auth users without profiles)
    console.log('\n⚠️ CHECKING FOR ORPHANED ACCOUNTS:');
    const orphanedUsers = users.filter(u => 
      !profiles.some(p => p.id === u.id)
    );
    
    if (orphanedUsers.length > 0) {
      console.log(`❌ Found ${orphanedUsers.length} auth users without profiles:`);
      orphanedUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });
    } else {
      console.log('✅ No orphaned accounts found');
    }
    
    // 6. Check for capster profiles without capster records
    console.log('\n⚠️ CHECKING CAPSTER PROFILES WITHOUT CAPSTER RECORDS:');
    const capsterProfiles = profiles.filter(p => p.role === 'capster');
    const capstersWithoutRecords = capsterProfiles.filter(p => 
      !capsters.some(c => c.user_id === p.id)
    );
    
    if (capstersWithoutRecords.length > 0) {
      console.log(`❌ Found ${capstersWithoutRecords.length} capster profiles without capster records:`);
      capstersWithoutRecords.forEach(p => {
        console.log(`  - ${p.email} (${p.id})`);
      });
    } else {
      console.log('✅ All capster profiles have capster records');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE ANALYSIS COMPLETE\n');
    
  } catch (error) {
    console.error('❌ ANALYSIS ERROR:', error);
  }
}

analyzeDatabaseState().catch(console.error);
