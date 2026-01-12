const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  console.log('🧪 Testing Customer Registration...\n');
  
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const testPhone = `081234567${Math.floor(Math.random() * 1000)}`;
  
  console.log('Test Data:');
  console.log('  Email:', testEmail);
  console.log('  Phone:', testPhone);
  console.log('  Name: Test Customer');
  console.log('  Password: test123456\n');
  
  try {
    // Step 1: Sign up user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
      options: {
        data: {
          full_name: 'Test Customer',
          phone_number: testPhone
        }
      }
    });
    
    if (authError) {
      console.error('❌ Auth Error:', authError.message);
      return;
    }
    
    console.log('✅ Auth user created:', authData.user.id);
    
    // Wait for user to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Create user profile
    console.log('\nStep 2: Creating user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user.id,
          email: testEmail,
          full_name: 'Test Customer',
          phone_number: testPhone,
          role: 'customer'
        }
      ])
      .select();
    
    if (profileError) {
      console.error('❌ Profile Error:', profileError.message);
      console.error('   Code:', profileError.code);
      console.error('   Details:', profileError.details);
      return;
    }
    
    console.log('✅ User profile created');
    
    // Step 3: Create barbershop customer entry
    console.log('\nStep 3: Creating barbershop customer...');
    const { data: customerData, error: customerError } = await supabase
      .from('barbershop_customers')
      .insert([
        {
          customer_phone: testPhone,
          customer_name: 'Test Customer',
          customer_area: 'Test Area',
          total_visits: 0,
          total_revenue: 0,
          average_atv: 0,
          customer_segment: 'New'
        }
      ])
      .select();
    
    if (customerError) {
      console.error('❌ Customer Error:', customerError.message);
      console.error('   Code:', customerError.code);
      console.error('   Details:', customerError.details);
      return;
    }
    
    console.log('✅ Barbershop customer created');
    
    console.log('\n🎉 Registration Test PASSED!\n');
    console.log('Summary:');
    console.log('  - Auth user: ✅');
    console.log('  - User profile: ✅');
    console.log('  - Barbershop customer: ✅');
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
  }
}

testRegistration();
