const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeActualSchema() {
  console.log('🔍 ANALYZING ACTUAL DATABASE SCHEMA...\n')
  
  try {
    // 1. Check barbershops table
    console.log('1️⃣ BARBERSHOPS TABLE:')
    const { data: barbershops, error: bbError } = await supabase
      .from('barbershops')
      .select('*')
      .limit(1)
    
    if (bbError) {
      console.log('   ❌ Error:', bbError.message)
    } else {
      console.log('   ✅ Exists')
      if (barbershops && barbershops[0]) {
        console.log('   📋 Columns:', Object.keys(barbershops[0]))
      }
    }
    
    // 2. Check capsters table
    console.log('\n2️⃣ CAPSTERS TABLE:')
    const { data: capsters, error: capError } = await supabase
      .from('capsters')
      .select('*')
      .limit(1)
    
    if (capError) {
      console.log('   ❌ Error:', capError.message)
    } else {
      console.log('   ✅ Exists')
      if (capsters && capsters[0]) {
        console.log('   📋 Columns:', Object.keys(capsters[0]))
      } else {
        console.log('   ⚠️  Table exists but empty. Checking structure via RPC...')
      }
    }
    
    // 3. Raw SQL query to check actual columns
    console.log('\n3️⃣ QUERYING ACTUAL TABLE STRUCTURE:')
    const { data: capsterColumns, error: colError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'capsters'
        ORDER BY ordinal_position;
      `
    })
    
    if (colError) {
      console.log('   ℹ️  RPC not available, using alternative method')
      
      // Alternative: Try to insert and see what columns are required
      console.log('\n4️⃣ ATTEMPTING TEST QUERY TO DETECT COLUMNS:')
      const { error: testError } = await supabase
        .from('capsters')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          barbershop_id: '00000000-0000-0000-0000-000000000000',
          name: 'Test',
          phone: '000',
          status: 'pending'
        })
      
      if (testError) {
        console.log('   📋 Error reveals structure:', testError.message)
        
        // Parse error message to understand missing/extra columns
        if (testError.message.includes('does not exist')) {
          const match = testError.message.match(/column "(\w+)"/)
          if (match) {
            console.log(`   ❌ PROBLEM FOUND: Column "${match[1]}" does not exist!`)
          }
        }
      }
    } else {
      console.log('   ✅ Capsters columns:')
      capsterColumns.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}`)
      })
    }
    
    // 5. Check user_profiles
    console.log('\n5️⃣ USER_PROFILES TABLE:')
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (profError) {
      console.log('   ❌ Error:', profError.message)
    } else {
      console.log('   ✅ Exists')
      if (profiles && profiles[0]) {
        console.log('   📋 Columns:', Object.keys(profiles[0]))
      }
    }
    
    // 6. Check onboarding_progress
    console.log('\n6️⃣ ONBOARDING_PROGRESS TABLE:')
    const { data: onboarding, error: onError } = await supabase
      .from('onboarding_progress')
      .select('*')
      .limit(1)
    
    if (onError) {
      console.log('   ❌ Error:', onError.message)
      console.log('   ⚠️  This table might not exist yet!')
    } else {
      console.log('   ✅ Exists')
      if (onboarding && onboarding[0]) {
        console.log('   📋 Columns:', Object.keys(onboarding[0]))
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal Error:', error.message)
  }
}

analyzeActualSchema()
