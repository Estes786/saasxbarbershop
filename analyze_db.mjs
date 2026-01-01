import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 ANALYZING SUPABASE DATABASE SCHEMA\n')

// Query all tables using rpc
const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
  query: `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `
})

if (tablesError) {
  console.error('❌ Error fetching tables:', tablesError)
  
  // Try alternative: just query existing tables we know about
  console.log('\n🔄 Trying alternative method: checking known tables...\n')
  
  const knownTables = [
    'barbershop_profiles',
    'capsters', 
    'customers',
    'bookings',
    'service_catalog',
    'loyalty_points',
    'access_keys',
    'branches'
  ]
  
  for (const tableName of knownTables) {
    console.log(`\n📋 Checking table: ${tableName}`)
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`  ❌ Table does not exist or no access: ${error.message}`)
    } else {
      console.log(`  ✅ Table exists (${count || 0} rows)`)
      
      // Get first row to see structure
      const { data: sample } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .maybeSingle()
      
      if (sample) {
        console.log(`  Columns: ${Object.keys(sample).join(', ')}`)
      }
    }
  }
  
  process.exit(0)
}

console.log('📊 TABLES IN DATABASE:')
console.log(tablesData.map(t => `  - ${t.table_name}`).join('\n'))
console.log(`\nTotal tables: ${tablesData.length}\n`)

console.log('\n\n✅ ANALYSIS COMPLETE')
