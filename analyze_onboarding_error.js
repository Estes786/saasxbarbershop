const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabaseSchema() {
  console.log('🔍 ANALYZING DATABASE SCHEMA FOR ONBOARDING ERROR\n');
  console.log('=' .repeat(70));
  
  try {
    // 1. Check barbershops table structure
    console.log('\n📊 1. BARBERSHOPS TABLE STRUCTURE:');
    const { data: barbershops, error: barbershopsError } = await supabase
      .from('barbershops')
      .select('*')
      .limit(1);
    
    if (barbershopsError) {
      console.log('❌ Error:', barbershopsError.message);
    } else {
      console.log('✅ Barbershops table exists');
      if (barbershops.length > 0) {
        console.log('   Columns:', Object.keys(barbershops[0]).join(', '));
      }
    }

    // 2. Check capsters table structure
    console.log('\n📊 2. CAPSTERS TABLE STRUCTURE:');
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*')
      .limit(1);
    
    if (capstersError) {
      console.log('❌ Error:', capstersError.message);
    } else {
      console.log('✅ Capsters table exists');
      if (capsters.length > 0) {
        console.log('   Columns:', Object.keys(capsters[0]).join(', '));
      }
    }

    // 3. Check foreign key constraints
    console.log('\n🔗 3. CHECKING FOREIGN KEY CONSTRAINTS:');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'capsters' })
      .catch(async () => {
        // Fallback: use direct query
        const { data, error } = await supabase
          .from('information_schema.table_constraints')
          .select('*')
          .eq('table_name', 'capsters')
          .eq('constraint_type', 'FOREIGN KEY');
        return { data, error };
      });

    if (constraintsError) {
      console.log('⚠️  Cannot fetch constraints directly, checking manually...');
    } else if (constraints) {
      console.log('   Foreign keys:', JSON.stringify(constraints, null, 2));
    }

    // 4. Check if barbershop_id column exists in capsters
    console.log('\n🔍 4. CHECKING BARBERSHOP_ID IN CAPSTERS:');
    const { data: capstersSchema, error: schemaError } = await supabase
      .from('capsters')
      .select('id, barbershop_id')
      .limit(1);
    
    if (schemaError) {
      console.log('❌ Error accessing barbershop_id:', schemaError.message);
      console.log('   This is the ROOT CAUSE of the error!');
    } else {
      console.log('✅ barbershop_id column exists in capsters table');
    }

    // 5. Check user_profiles table
    console.log('\n📊 5. USER_PROFILES TABLE STRUCTURE:');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Error:', profilesError.message);
    } else {
      console.log('✅ User_profiles table exists');
      if (profiles.length > 0) {
        console.log('   Columns:', Object.keys(profiles[0]).join(', '));
      }
    }

    // 6. Summary of the issue
    console.log('\n' + '='.repeat(70));
    console.log('\n💡 ERROR ANALYSIS:');
    console.log('   Error: "insert or update on table capsters violates foreign key');
    console.log('          constraint capsters_barbershop_id_fkey"');
    console.log('\n   Possible causes:');
    console.log('   1. barbershop_id column does not exist in capsters table');
    console.log('   2. Foreign key constraint references non-existent barbershop');
    console.log('   3. barbershop_id value being inserted is NULL or invalid');
    console.log('   4. Referenced barbershop record does not exist');
    
    console.log('\n✅ RECOMMENDATION:');
    console.log('   We need to create a comprehensive, idempotent SQL script that:');
    console.log('   1. Safely adds barbershop_id column if missing');
    console.log('   2. Creates proper foreign key constraint');
    console.log('   3. Handles existing data safely');
    console.log('   4. Is 100% safe to run multiple times (idempotent)');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

analyzeDatabaseSchema();
