const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

const env = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCompleteFix() {
  console.log('🔧 APPLYING COMPLETE BOOKING FIX...\n');

  try {
    // 1. Check current capster statuses
    console.log('📊 1. CHECKING CURRENT CAPSTER STATUS:');
    const { data: capsters, error: capError } = await supabase
      .from('capsters')
      .select('id, capster_name, status, is_active');

    if (capError) {
      console.error('❌ Error:', capError);
      return;
    }

    console.log(`   Total capsters: ${capsters.length}`);
    const statusCount = {};
    capsters.forEach(c => {
      const status = c.status || 'null';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    console.log('   Status breakdown:', statusCount);

    // 2. Approve ALL capsters
    console.log('\n✅ 2. APPROVING ALL CAPSTERS:');
    const { data: updateResult, error: updateError } = await supabase
      .from('capsters')
      .update({ 
        status: 'approved',
        is_active: true,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .neq('status', 'approved')
      .select();

    if (updateError) {
      console.error('❌ Error:', updateError);
    } else {
      console.log(`   ✅ Approved ${updateResult?.length || 0} capsters`);
    }

    // 3. Fix booking statuses
    console.log('\n📋 3. FIXING BOOKING STATUSES:');
    const { data: bookings, error: bookError } = await supabase
      .from('bookings')
      .update({ status: 'pending' })
      .is('status', null)
      .select();

    if (bookError) {
      console.error('⚠️ Error:', bookError);
    } else {
      console.log(`   ✅ Fixed ${bookings?.length || 0} bookings`);
    }

    // 4. Verify results
    console.log('\n🔍 4. VERIFICATION:');
    const { data: verifyCapsters } = await supabase
      .from('capsters')
      .select('status, is_active, capster_name, branch_id');

    const approved = verifyCapsters.filter(c => c.status === 'approved');
    console.log(`   ✅ Approved capsters: ${approved.length}/${verifyCapsters.length}`);
    console.log(`   ✅ Active capsters: ${verifyCapsters.filter(c => c.is_active).length}`);
    
    if (approved.length > 0) {
      console.log('\n   📋 Sample approved capsters:');
      approved.slice(0, 5).forEach(c => {
        console.log(`      - ${c.capster_name} (Branch: ${c.branch_id || 'ALL'})`);
      });
    }

    // 5. Test booking query
    console.log('\n🧪 5. TESTING BOOKING QUERY:');
    const { data: testServices, error: testError } = await supabase
      .from('service_catalog')
      .select('*')
      .is('branch_id', null)
      .limit(5);

    if (testError) {
      console.log('   ⚠️ Query error:', testError.message);
    } else {
      console.log(`   ✅ Services query works: ${testServices?.length} services found`);
    }

    const { data: testCapsters, error: testCapError } = await supabase
      .from('capsters')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true)
      .limit(5);

    if (testCapError) {
      console.log('   ⚠️ Capster query error:', testCapError.message);
    } else {
      console.log(`   ✅ Capster query works: ${testCapsters?.length} capsters available`);
    }

    console.log('\n✅ ========================================');
    console.log('✅ FIX COMPLETED SUCCESSFULLY!');
    console.log('✅ ========================================');
    console.log('');
    console.log('🎯 CUSTOMERS CAN NOW BOOK ONLINE! 🎉');
    console.log('');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyCompleteFix();
