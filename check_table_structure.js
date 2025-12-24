#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTableStructure() {
  console.log('\n🔍 CHECKING ACTUAL TABLE STRUCTURE\n');
  console.log('='.repeat(80));
  
  try {
    // Try to select all columns from user_profiles
    console.log('\n1️⃣  Attempting to query user_profiles with all columns:');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Hint:', error.hint || 'No hint provided');
      
      // Try simpler query
      console.log('\n2️⃣  Trying basic select:');
      const { data: data2, error: error2 } = await supabase
        .from('user_profiles')
        .select()
        .limit(1);
      
      if (error2) {
        console.log('❌ Still error:', error2.message);
      } else {
        console.log('✅ Table exists! Columns:', Object.keys(data2[0] || {}));
      }
    } else {
      console.log('✅ Query successful!');
      if (data && data.length > 0) {
        console.log('   Columns found:', Object.keys(data[0]));
        console.log('   Sample row:', data[0]);
      } else {
        console.log('   Table is empty');
      }
    }

    // Check if we can insert into table
    console.log('\n3️⃣  Testing if we can insert into user_profiles:');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        role: 'customer'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Cannot insert:', insertError.message);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
      
      // This tells us about missing columns or constraints
      if (insertError.message.includes('column')) {
        console.log('\n   🔍 ANALYSIS: Missing or wrong column names');
      }
      if (insertError.message.includes('violates')) {
        console.log('\n   🔍 ANALYSIS: Constraint violation (FK, unique, etc)');
      }
      if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
        console.log('\n   🔍 ANALYSIS: RLS policy blocking insert');
      }
    } else {
      console.log('✅ Insert successful!', insertData);
      
      // Cleanup
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
      console.log('✅ Test data cleaned up');
    }

    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
  }
}

checkTableStructure();
