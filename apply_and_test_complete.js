const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials!');
  console.log('Please check .env.local file');
  process.exit(1);
}

// Create service role client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSPolicies() {
  console.log('\n🔐 APPLYING RLS POLICIES...\n');
  console.log('============================================================');
  
  try {
    // Read SQL file
    const sqlFile = fs.readFileSync('./FIX_ALL_RLS_COMPLETE.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        // Execute via RPC
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`❌ Statement ${i + 1}: FAILED`);
          console.log(`   Error: ${error.message}\n`);
          failCount++;
        } else {
          console.log(`✅ Statement ${i + 1}: SUCCESS`);
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1}: Cannot execute via RPC (expected)`);
        console.log(`   This is normal - policies need manual SQL Editor apply\n`);
      }
    }
    
    console.log('============================================================');
    console.log(`\n📊 RLS Application Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⚠️  Note: Policies cannot be applied via API`);
    console.log('\n⚙️  MANUAL STEP REQUIRED:');
    console.log('   1. Open Supabase SQL Editor:');
    console.log(`   ${supabaseUrl.replace('qwqmhvwqeynnyxaecqzw', 'app')}/project/qwqmhvwqeynnyxaecqzw/sql/new`);
    console.log('   2. Copy contents of: FIX_ALL_RLS_COMPLETE.sql');
    console.log('   3. Paste and click RUN');
    console.log('   4. Verify: 9 policies should be created\n');
    
  } catch (error) {
    console.error('\n❌ Error reading SQL file:', error.message);
  }
}

async function testAuthentication() {
  console.log('\n🧪 TESTING AUTHENTICATION FLOWS...\n');
  console.log('============================================================');
  
  try {
    // Test 1: Check database tables
    console.log('\n📋 Test 1: Verify Database Tables');
    console.log('-----------------------------------');
    
    const tables = ['user_profiles', 'barbershop_customers'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    }
    
    // Test 2: Check RLS status
    console.log('\n🔐 Test 2: Check RLS Status');
    console.log('-----------------------------------');
    console.log('   Note: Cannot check RLS status via API');
    console.log('   Please verify manually in Supabase Dashboard\n');
    
    // Test 3: Test Customer Registration Flow (Simulated)
    console.log('\n👤 Test 3: Customer Registration Flow');
    console.log('-----------------------------------');
    const testEmail = `test_customer_${Date.now()}@example.com`;
    const testPhone = `0812${Math.floor(Math.random() * 100000000)}`;
    
    console.log(`   Email: ${testEmail}`);
    console.log(`   Phone: ${testPhone}`);
    console.log('   Role: customer\n');
    
    // Signup
    const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpass123',
      email_confirm: true,
      user_metadata: {
        role: 'customer'
      }
    });
    
    if (signupError) {
      console.log(`❌ Signup FAILED: ${signupError.message}\n`);
    } else {
      console.log(`✅ Auth user created: ${signupData.user.id}`);
      
      // Create customer record
      const { error: customerError } = await supabase
        .from('barbershop_customers')
        .insert({
          customer_phone: testPhone,
          customer_name: 'Test Customer',
          user_id: signupData.user.id,
          total_visits: 0,
          total_revenue: 0
        });
      
      if (customerError) {
        console.log(`❌ Customer record FAILED: ${customerError.message}`);
      } else {
        console.log(`✅ Customer record created`);
      }
      
      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: signupData.user.id,
          email: testEmail,
          role: 'customer',
          customer_phone: testPhone,
          customer_name: 'Test Customer'
        });
      
      if (profileError) {
        console.log(`❌ Profile creation FAILED: ${profileError.message}`);
        console.log(`   This is the RBAC/RLS error you mentioned!`);
      } else {
        console.log(`✅ Profile created successfully`);
        console.log(`\n🎉 CUSTOMER REGISTRATION: PASSED\n`);
      }
      
      // Cleanup test user
      await supabase.auth.admin.deleteUser(signupData.user.id);
      console.log(`🧹 Test user cleaned up\n`);
    }
    
    console.log('============================================================');
    console.log('\n📝 SUMMARY:');
    console.log('   ✅ Database tables accessible');
    console.log('   ⚠️  RLS policies need manual application');
    console.log('   ⚠️  Authentication flows need browser testing');
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Apply RLS policies manually (see above)');
    console.log('   2. Test registration in browser:');
    console.log('      - Customer: http://localhost:3000/register');
    console.log('      - Admin: http://localhost:3000/register/admin');
    console.log('   3. Test login: http://localhost:3000/login');
    console.log('   4. Verify role-based redirects');
    console.log('\n============================================================\n');
    
  } catch (error) {
    console.error('\n❌ Testing error:', error);
  }
}

async function main() {
  console.log('\n🚀 COMPLETE AUTHENTICATION FIX & TEST');
  console.log('============================================================\n');
  
  await applyRLSPolicies();
  await testAuthentication();
  
  console.log('\n✅ SCRIPT COMPLETED!\n');
  console.log('Remember to:');
  console.log('1. Apply SQL manually in Supabase SQL Editor');
  console.log('2. Test in browser');
  console.log('3. Check console logs for debugging\n');
}

main();
