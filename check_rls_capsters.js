#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs';

// Create client with anon key (simulating customer access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCapsterAccess() {
  console.log('='.repeat(80));
  console.log('🔍 TESTING CAPSTER ACCESS (AS ANONYMOUS USER)');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: Query capsters without auth
  console.log('📋 Test 1: Query capsters table (no auth)...');
  try {
    const { data, error, count } = await supabase
      .from('capsters')
      .select('*', { count: 'exact' })
      .eq('is_available', true)
      .order('capster_name');

    if (error) {
      console.log('❌ ERROR:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log(`✅ SUCCESS: Retrieved ${count || 0} capsters`);
      if (data && data.length > 0) {
        console.log('   Sample capsters:');
        data.slice(0, 3).forEach((capster, idx) => {
          console.log(`   ${idx + 1}. ${capster.capster_name} (${capster.specialization})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ EXCEPTION:', err.message);
  }

  console.log('');

  // Test 2: Query service_catalog
  console.log('📋 Test 2: Query service_catalog table (no auth)...');
  try {
    const { data, error, count } = await supabase
      .from('service_catalog')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.log('❌ ERROR:', error.message);
    } else {
      console.log(`✅ SUCCESS: Retrieved ${count || 0} services`);
    }
  } catch (err) {
    console.log('❌ EXCEPTION:', err.message);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

testCapsterAccess().catch(console.error);
