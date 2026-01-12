const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCapsterAvailability() {
  console.log('🔧 FIXING CAPSTER AVAILABILITY...\n');
  
  // Check current state
  const { data: capsters } = await supabase
    .from('capsters')
    .select('id, capster_name, status, is_available, is_active');
  
  console.log('📊 Current Capsters State:');
  console.log(`   Total: ${capsters?.length || 0}`);
  console.log(`   Status approved: ${capsters?.filter(c => c.status === 'approved').length || 0}`);
  console.log(`   is_available TRUE: ${capsters?.filter(c => c.is_available === true).length || 0}`);
  console.log(`   is_active TRUE: ${capsters?.filter(c => c.is_active === true).length || 0}`);
  
  const needsFix = capsters?.filter(c => 
    c.status === 'approved' && (c.is_available !== true || c.is_active !== true)
  );
  
  console.log(`   Need fixing: ${needsFix?.length || 0}\n`);
  
  if (needsFix && needsFix.length > 0) {
    console.log('🔄 Setting all approved capsters to available & active...');
    
    const { error } = await supabase
      .from('capsters')
      .update({
        is_available: true,
        is_active: true
      })
      .eq('status', 'approved');
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Fixed!');
    }
  } else {
    console.log('✅ All capsters already properly configured');
  }
  
  // Verify services are queryable
  console.log('\n📊 Checking Services:');
  const { data: services, error: servicesError } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price, is_active')
    .eq('is_active', true)
    .limit(5);
  
  if (servicesError) {
    console.log('❌ Error querying services:', servicesError.message);
  } else {
    console.log(`✅ ${services.length} services available`);
    if (services.length > 0) {
      console.log('   Sample:', services[0]);
    }
  }
  
  // Test booking query (what customer sees)
  console.log('\n🧪 SIMULATING CUSTOMER VIEW:');
  console.log('=' .repeat(60));
  
  // 1. Services
  const { data: customerServices, error: customerServicesError } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price, duration_minutes, description')
    .eq('is_active', true)
    .order('display_order')
    .limit(10);
  
  if (customerServicesError) {
    console.log('❌ Customer CANNOT see services:', customerServicesError.message);
  } else {
    console.log(`✅ Customer can see ${customerServices.length} services`);
  }
  
  // 2. Capsters
  const { data: customerCapsters, error: customerCapstersError } = await supabase
    .from('capsters')
    .select('id, capster_name, specialization')
    .eq('is_available', true)
    .eq('is_active', true)
    .eq('status', 'approved')
    .order('capster_name')
    .limit(10);
  
  if (customerCapstersError) {
    console.log('❌ Customer CANNOT see capsters:', customerCapstersError.message);
  } else {
    console.log(`✅ Customer can see ${customerCapsters.length} capsters`);
    if (customerCapsters.length === 0) {
      console.log('⚠️  WARNING: No capsters match the filters!');
      console.log('   Query filters: is_available=true, is_active=true, status=approved');
    }
  }
  
  console.log('\n🎉 FIX COMPLETE!\n');
}

fixCapsterAvailability().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
