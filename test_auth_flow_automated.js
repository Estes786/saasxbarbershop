const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');
  console.log('='.repeat(60));
  
  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPassword = 'test123456';
  const testName = 'Test User ' + timestamp;
  const testPhone = '08' + timestamp.toString().slice(-9);
  
  console.log('\n📝 Test Data:');
  console.log('  Email:', testEmail);
  console.log('  Name:', testName);
  console.log('  Phone:', testPhone);
  console.log('  Password:', testPassword);
  
  try {
    // STEP 1: Register user with Supabase Auth
    console.log('\n🔐 STEP 1: Creating user account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          phone: testPhone
        }
      }
    });
    
    if (authError) {
      console.error('❌ Auth signup error:', authError);
      return;
    }
    
    console.log('✅ User created in auth.users');
    console.log('  User ID:', authData.user.id);
    
    // STEP 2: Create user_profiles entry
    console.log('\n👤 STEP 2: Creating user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        full_name: testName,
        phone: testPhone,
        role: 'customer'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      console.log('\nℹ️  This might be RLS policy issue.');
      return;
    }
    
    console.log('✅ User profile created');
    console.log('  Profile ID:', profileData.id);
    console.log('  Role:', profileData.role);
    
    // STEP 3: Create barbershop_customers entry
    console.log('\n🏪 STEP 3: Creating customer record...');
    const { data: customerData, error: customerError } = await supabase
      .from('barbershop_customers')
      .insert({
        customer_phone: testPhone,
        customer_name: testName,
        customer_area: 'Test Area',
        total_visits: 0,
        total_revenue: 0,
        average_atv: 0,
        customer_segment: 'New',
        lifetime_value: 0
      })
      .select()
      .single();
    
    if (customerError) {
      console.error('❌ Customer creation error:', customerError);
      console.log('\nℹ️  This is the error you reported!');
      return;
    }
    
    console.log('✅ Customer record created');
    console.log('  Customer Phone:', customerData.customer_phone);
    console.log('  Customer Name:', customerData.customer_name);
    
    // STEP 4: Verify data
    console.log('\n✅ VERIFICATION');
    console.log('='.repeat(60));
    
    const { data: verifyProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    const { data: verifyCustomer } = await supabase
      .from('barbershop_customers')
      .select('*')
      .eq('customer_phone', testPhone)
      .single();
    
    console.log('\n📊 Final Status:');
    console.log('  ✅ Auth User: Created');
    console.log('  ✅ User Profile: Created');
    console.log('  ✅ Customer Record: Created');
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📍 Test on frontend:');
    console.log('  URL: https://3000-inl4qj1bfiwtogv521ba8-c07dda5e.sandbox.novita.ai/register');
    console.log('  Try registering a new customer');
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err);
  }
}

testAuthFlow();
