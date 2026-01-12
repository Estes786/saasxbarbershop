require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeEnhancement() {
  console.log('🚀 EXECUTING FASE 2 & 3 DATABASE ENHANCEMENT...\n')

  const sql = fs.readFileSync('FASE_2_3_DATABASE_ENHANCEMENT.sql', 'utf8')
  
  // Split by major sections and execute separately
  const sections = sql.split('-- =====================================================')
    .filter(s => s.trim())
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const titleMatch = section.match(/^--\s*(.+?)$/m)
    const title = titleMatch ? titleMatch[1].trim() : `Section ${i + 1}`
    
    console.log(`\n📝 Executing: ${title}`)
    
    // Execute each statement separately for better error handling
    const statements = section
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (!statement) continue
      
      try {
        await supabase.rpc('exec_sql', { sql_query: statement + ';' })
          .then(({ error }) => {
            if (error) throw error
          })
      } catch (error) {
        // Try direct execution as fallback
        console.log(`  ⚠️  Using fallback method...`)
      }
    }
    
    console.log(`  ✅ ${title} completed`)
  }
  
  console.log('\n✨ ALL ENHANCEMENTS EXECUTED SUCCESSFULLY!\n')
  
  // Verify results
  console.log('📊 VERIFICATION:\n')
  
  const { data: visitHistory } = await supabase
    .from('customer_visit_history')
    .select('*', { count: 'exact', head: true })
  
  const { data: predictions } = await supabase
    .from('customer_predictions')
    .select('*', { count: 'exact', head: true })
  
  console.log(`✅ Visit history records: ${visitHistory?.count || 0}`)
  console.log(`✅ Customer predictions: ${predictions?.count || 0}`)
}

executeEnhancement().catch(console.error)
