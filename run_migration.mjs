import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🚀 EXECUTING MULTI-LOCATION MIGRATION SCRIPT\n')

// Read SQL file
const sqlScript = readFileSync('./migrations/01_multi_location_support_FIXED.sql', 'utf8')

console.log('📄 Script loaded successfully')
console.log(`📏 Script size: ${sqlScript.length} characters\n`)

try {
  // Execute the SQL script using direct query
  // Note: Supabase JS client doesn't support executing multi-statement SQL directly
  // We'll need to use the REST API endpoint
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      query: sqlScript
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
  
  const result = await response.json()
  console.log('✅ Migration executed successfully!')
  console.log('📊 Result:', JSON.stringify(result, null, 2))
  
} catch (error) {
  console.error('❌ Error executing migration:', error)
  console.log('\n⚠️ Alternative: Please execute this script manually in Supabase SQL Editor:')
  console.log('   1. Go to Supabase Dashboard')
  console.log('   2. Open SQL Editor')
  console.log('   3. Paste the contents of migrations/01_multi_location_support_FIXED.sql')
  console.log('   4. Click "Run"')
  process.exit(1)
}
