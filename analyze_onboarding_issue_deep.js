/**
 * DEEP ANALYSIS: Onboarding Error - Foreign Key Constraint
 * Error: insert or update on table "capsters" violates foreign key constraint "capsters_barbershop_id_fkey"
 * 
 * This script will:
 * 1. Analyze current database schema (barbershops table)
 * 2. Analyze capsters table structure and constraints
 * 3. Check if barbershop is created during onboarding
 * 4. Identify the root cause
 * 5. Generate comprehensive fix
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function analyzeDatabase() {
  console.log('🔍 DEEP ANALYSIS: ONBOARDING ERROR\n');
  console.log('=' .repeat(80));
  
  try {
    // 1. Check barbershops table structure
    console.log('\n📋 1. BARBERSHOPS TABLE STRUCTURE:');
    const { data: barbershops, error: bbError } = await supabase
      .from('barbershops')
      .select('*')
      .limit(1);
    
    if (bbError) {
      console.log('❌ Error:', bbError.message);
    } else {
      console.log('✅ Barbershops table exists');
      console.log('Columns:', barbershops && barbershops[0] ? Object.keys(barbershops[0]) : 'No data yet');
    }

    // 2. Check capsters table structure
    console.log('\n📋 2. CAPSTERS TABLE STRUCTURE:');
    const { data: capsters, error: capError } = await supabase
      .from('capsters')
      .select('*')
      .limit(1);
    
    if (capError) {
      console.log('❌ Error:', capError.message);
    } else {
      console.log('✅ Capsters table exists');
      console.log('Columns:', capsters && capsters[0] ? Object.keys(capsters[0]) : 'No data yet');
    }

    // 3. Check user_profiles table
    console.log('\n📋 3. USER_PROFILES TABLE STRUCTURE:');
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profError) {
      console.log('❌ Error:', profError.message);
    } else {
      console.log('✅ User_profiles table exists');
      console.log('Columns:', profiles && profiles[0] ? Object.keys(profiles[0]) : 'No data yet');
    }

    // 4. Get table constraints via SQL
    console.log('\n📋 4. FOREIGN KEY CONSTRAINTS:');
    const { data: constraints, error: constError } = await supabase.rpc('get_table_constraints', {});
    
    if (constError) {
      console.log('⚠️  Cannot fetch constraints (function may not exist)');
    } else {
      console.log('Constraints:', constraints);
    }

    // 5. Check actual data
    console.log('\n📊 5. CURRENT DATA STATE:');
    
    const { data: allBarbershops, error: allBBError } = await supabase
      .from('barbershops')
      .select('id, name, owner_id');
    console.log('Total barbershops:', allBarbershops?.length || 0);
    if (allBarbershops && allBarbershops.length > 0) {
      console.log('Sample:', allBarbershops.slice(0, 3));
    }

    const { data: allCapsters, error: allCapError } = await supabase
      .from('capsters')
      .select('id, name, barbershop_id, user_id');
    console.log('\nTotal capsters:', allCapsters?.length || 0);
    if (allCapsters && allCapsters.length > 0) {
      console.log('Sample:', allCapsters.slice(0, 3));
    }

    const { data: allProfiles, error: allProfError } = await supabase
      .from('user_profiles')
      .select('id, email, role, barbershop_id');
    console.log('\nTotal user_profiles:', allProfiles?.length || 0);
    if (allProfiles && allProfiles.length > 0) {
      console.log('Sample:', allProfiles.slice(0, 3));
    }

    // 6. DIAGNOSTIC SUMMARY
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSTIC SUMMARY:\n');
    
    console.log('🔍 ROOT CAUSE ANALYSIS:');
    console.log('The error "capsters_barbershop_id_fkey" means:');
    console.log('- When inserting a capster, barbershop_id references a barbershop that doesn\'t exist');
    console.log('- OR barbershop_id is NULL when it shouldn\'t be');
    console.log('- OR barbershop_id references wrong table/column\n');

    console.log('🎯 LIKELY CAUSES:');
    console.log('1. Onboarding flow creates capster BEFORE creating barbershop');
    console.log('2. Onboarding flow doesn\'t create barbershop at all');
    console.log('3. barbershop_id in capsters table is pointing to wrong ID');
    console.log('4. user_profiles.barbershop_id is NULL or wrong\n');

    console.log('✅ SOLUTION:');
    console.log('Onboarding flow must:');
    console.log('1. Create barbershop FIRST (get barbershop.id)');
    console.log('2. Create user_profile with barbershop_id');
    console.log('3. Create capster with barbershop_id from step 1');
    console.log('4. All in correct order with proper error handling\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

analyzeDatabase();
