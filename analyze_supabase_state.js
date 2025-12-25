require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Using Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function analyzeSupabaseState() {
  console.log('\n🔍 ANALYZING SUPABASE STATE...\n')

  // Check tables
  console.log('📊 CHECKING EXISTING TABLES:\n')
  
  const tablesToCheck = [
    'user_profiles',
    'barbershop_customers',
    'barbershop_transactions',
    'barbershop_analytics_daily',
    'barbershop_actionable_data',
    'bookings',
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews',
    'access_keys'
  ]
  
  const existingTables = []
  const missingTables = []
  
  for (const table of tablesToCheck) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (!error) {
      console.log(`✅ ${table}: ${count} records`)
      existingTables.push(table)
    } else {
      console.log(`❌ ${table}: NOT FOUND (${error.message})`)
      missingTables.push(table)
    }
  }
  
  // Check auth users
  console.log('\n👥 CHECKING AUTH USERS:\n')
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (!usersError && users) {
    console.log(`Total auth users: ${users.length}`)
    
    // Count by role
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('role')
    
    if (profiles) {
      const roleCounts = profiles.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1
        return acc
      }, {})
      
      console.log('Role distribution:', roleCounts)
    }
  }
  
  // Check access keys
  console.log('\n🔑 CHECKING ACCESS KEYS:\n')
  const { data: accessKeys, error: keysError } = await supabase
    .from('access_keys')
    .select('*')
  
  if (!keysError && accessKeys) {
    console.log(`Total access keys: ${accessKeys.length}`)
    accessKeys.forEach(key => {
      console.log(`  - ${key.key_name} (${key.role_type}): ${key.is_active ? '✅ Active' : '❌ Inactive'}`)
    })
  } else {
    console.log('⚠️  Access keys table not found or empty')
  }
  
  console.log('\n📋 SUMMARY:\n')
  console.log(`✅ Existing tables: ${existingTables.length}/${tablesToCheck.length}`)
  console.log(`❌ Missing tables: ${missingTables.length}`)
  
  if (missingTables.length > 0) {
    console.log('\n🔥 TABLES TO CREATE:')
    missingTables.forEach(table => console.log(`  - ${table}`))
  }
  
  console.log('\n✨ ANALYSIS COMPLETE!\n')
}

analyzeSupabaseState().catch(console.error)
