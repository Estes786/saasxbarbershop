const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function checkFunction() {
  console.log('\n🔍 Checking complete_onboarding function...\n');
  
  try {
    // Try to call the function with dummy data
    const { data, error } = await supabase.rpc('complete_onboarding', {
      p_barbershop_data: {
        name: 'Test',
        address: 'Test',
        phone: '08123456789',
        open_time: '09:00',
        close_time: '21:00',
        days_open: ['Senin']
      },
      p_capsters: [],
      p_services: [],
      p_access_keys: { customer: 'TEST', capster: 'TEST' }
    });
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('function') || error.code === '42883') {
        console.log('❌ Function "complete_onboarding" DOES NOT EXIST');
        console.log('   Error:', error.message);
        console.log('\n✅ RECOMMENDATION: Need to create this function in Supabase\n');
      } else {
        console.log('⚠️  Function exists but error occurred:', error.message);
      }
    } else {
      console.log('✅ Function "complete_onboarding" EXISTS and works!');
      console.log('   Result:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkFunction();
