#!/usr/bin/env node

/**
 * 🔍 CHECK ACTUAL COLUMN NAMES
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  console.log('🔍 CHECKING ACTUAL COLUMN NAMES\n');

  try {
    // 1. Check barbershop_profiles columns
    console.log('📊 1. barbershop_profiles columns:');
    const { data: bbData } = await supabase
      .from('barbershop_profiles')
      .select('*')
      .limit(1);
    
    if (bbData && bbData[0]) {
      console.log('   Columns:', Object.keys(bbData[0]).join(', '));
      console.log('   Sample data:', JSON.stringify(bbData[0], null, 2));
    }

    // 2. Check capsters columns
    console.log('\n📊 2. capsters columns:');
    const { data: capData } = await supabase
      .from('capsters')
      .select('*')
      .limit(1);
    
    if (capData && capData[0]) {
      console.log('   Columns:', Object.keys(capData[0]).join(', '));
      console.log('   Sample data:', JSON.stringify(capData[0], null, 2));
    }

    // 3. Check service_catalog columns
    console.log('\n📊 3. service_catalog columns:');
    const { data: svcData } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(1);
    
    if (svcData && svcData[0]) {
      console.log('   Columns:', Object.keys(svcData[0]).join(', '));
      console.log('   Sample data:', JSON.stringify(svcData[0], null, 2));
    }

    // 4. Check bookings columns
    console.log('\n📊 4. bookings columns:');
    const { data: bkData } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bkData && bkData[0]) {
      console.log('   Columns:', Object.keys(bkData[0]).join(', '));
      console.log('   Sample data:', JSON.stringify(bkData[0], null, 2));
    } else {
      console.log('   ⚠️  No bookings data yet');
    }

    // 5. Check barbershop_customers columns
    console.log('\n📊 5. barbershop_customers columns:');
    const { data: custData } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    if (custData && custData[0]) {
      console.log('   Columns:', Object.keys(custData[0]).join(', '));
      console.log('   Sample data:', JSON.stringify(custData[0], null, 2));
    }

    // 6. Check branches columns
    console.log('\n📊 6. branches columns:');
    const { data: brData } = await supabase
      .from('branches')
      .select('*')
      .limit(1);
    
    if (brData && brData[0]) {
      console.log('   Columns:', Object.keys(brData[0]).join(', '));
      console.log('   Sample data:', JSON.stringify(brData[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkColumns().then(() => {
  console.log('\n✅ Column check complete!');
  process.exit(0);
});
