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

async function checkSchema() {
  console.log('🔍 CHECKING ACTUAL DATABASE SCHEMA...\n');

  // Check capsters table
  console.log('👨‍💼 CAPSTERS TABLE:');
  const { data: capsters, error: capError } = await supabase
    .from('capsters')
    .select('*')
    .limit(1);

  if (!capError && capsters && capsters.length > 0) {
    console.log('   Columns:', Object.keys(capsters[0]).join(', '));
  } else if (capError) {
    console.log('   Error:', capError.message);
  }

  // Check services table
  console.log('\n🎯 SERVICES TABLE:');
  const { data: services, error: servError } = await supabase
    .from('service_catalog')
    .select('*')
    .limit(1);

  if (!servError && services && services.length > 0) {
    console.log('   Columns:', Object.keys(services[0]).join(', '));
  } else if (servError) {
    console.log('   Error:', servError.message);
  }

  // Check bookings table
  console.log('\n📋 BOOKINGS TABLE:');
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);

  if (!bookError && bookings && bookings.length > 0) {
    console.log('   Columns:', Object.keys(bookings[0]).join(', '));
  } else if (bookError) {
    console.log('   Error:', bookError.message);
  }

  // Check branches table
  console.log('\n📍 BRANCHES TABLE:');
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('*')
    .limit(1);

  if (!branchError && branches && branches.length > 0) {
    console.log('   Columns:', Object.keys(branches[0]).join(', '));
  } else if (branchError) {
    console.log('   Error:', branchError.message);
  }

  console.log('\n✅ SCHEMA CHECK COMPLETE!\n');
}

checkSchema();
