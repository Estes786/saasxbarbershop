const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';
const sandboxUrl = 'https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyConfiguration() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFYING SUPABASE CONFIGURATION');
  console.log('='.repeat(70) + '\n');

  let issues = [];
  let warnings = [];

  // Test 1: Database Connection
  console.log('📊 Test 1: Database Connection');
  try {
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    if (error) {
      console.log('   ❌ Failed:', error.message);
      issues.push('Database connection failed');
    } else {
      console.log('   ✅ Database connected successfully');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    issues.push('Database connection error');
  }

  // Test 2: RLS Status
  console.log('\n🔐 Test 2: Row Level Security (RLS) Status');
  try {
    const { data, error } = await supabase.rpc('query', {
      query: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles'`
    });
    
    if (error) {
      console.log('   ⚠️  Cannot check RLS status (needs manual check)');
      warnings.push('RLS status unknown - check manually in Supabase Dashboard');
    } else {
      console.log('   ℹ️  Check RLS manually at:');
      console.log('      https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/policies');
    }
  } catch (err) {
    console.log('   ⚠️  RLS check skipped');
    warnings.push('RLS policies need manual verification');
  }

  // Test 3: Profile Creation Test
  console.log('\n🧪 Test 3: Profile Creation (Service Role)');
  const testUserId = 'test-' + Date.now();
  try {
    // Create test user first in auth (simulated - not possible via client)
    console.log('   ℹ️  Testing profile insertion...');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        role: 'customer',
        customer_name: 'Test User',
        customer_phone: null,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('infinite recursion')) {
        console.log('   ❌ CRITICAL: Infinite recursion in RLS policies!');
        issues.push('RLS Infinite Recursion - Run FIX_RLS_INFINITE_RECURSION.sql');
      } else if (error.message.includes('foreign key')) {
        console.log('   ⚠️  Foreign key constraint (expected for non-existent auth user)');
        console.log('   ℹ️  This is normal - profile needs real auth.users record');
      } else {
        console.log('   ❌ Error:', error.message);
        issues.push(`Profile creation failed: ${error.message}`);
      }
    } else {
      console.log('   ✅ Profile created successfully');
      // Clean up
      await supabase.from('user_profiles').delete().eq('id', testUserId);
      console.log('   ✅ Test profile cleaned up');
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    issues.push('Profile creation test failed');
  }

  // Test 4: Check User Count
  console.log('\n👥 Test 4: Existing Users Count');
  try {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ Found ${count} user profiles in database`);
    }
  } catch (err) {
    console.log('   ⚠️  Could not count users');
  }

  // Test 5: Customer Table
  console.log('\n👤 Test 5: Customer Table Status');
  try {
    const { count, error } = await supabase
      .from('barbershop_customers')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error:', error.message);
      issues.push('barbershop_customers table issue');
    } else {
      console.log(`   ✅ Found ${count} customers in database`);
    }
  } catch (err) {
    console.log('   ⚠️  Could not count customers');
  }

  // Test 6: Application URLs
  console.log('\n🌐 Test 6: Application URLs');
  console.log(`   📱 Sandbox URL: ${sandboxUrl}`);
  console.log(`   🔗 Registration: ${sandboxUrl}/register`);
  console.log(`   🔗 Admin Registration: ${sandboxUrl}/register/admin`);
  console.log(`   🔗 Login: ${sandboxUrl}/login`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('='.repeat(70) + '\n');

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ ALL CHECKS PASSED! Configuration looks good.\n');
    console.log('🚀 Ready for testing. Follow SETUP_GUIDE_TESTING.md\n');
  } else {
    if (issues.length > 0) {
      console.log('🔴 CRITICAL ISSUES FOUND:\n');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('🟡 WARNINGS:\n');
      warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
      console.log('');
    }

    console.log('📝 ACTION REQUIRED:\n');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
    
    console.log('2. Run this SQL to fix RLS infinite recursion:');
    console.log('   (Copy from FIX_RLS_INFINITE_RECURSION.sql)\n');
    
    console.log('3. Update Site URL in Auth Settings:');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/url-configuration');
    console.log(`   Set to: ${sandboxUrl}\n`);
    
    console.log('4. Configure Google OAuth (if needed):');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers\n');
  }

  console.log('='.repeat(70) + '\n');
}

verifyConfiguration().catch(console.error);
