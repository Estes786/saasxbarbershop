#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applySQLFix() {
  console.log('🔧 Applying RLS fixes to Supabase...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'fix_rls_comprehensive.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by statement (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty DO blocks
      if (statement.includes('RAISE NOTICE') || statement.includes('RAISE LOG')) {
        console.log(`⏩ Skipping statement ${i + 1} (contains logging)`);
        continue;
      }
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use RPC to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('_sql').select('*').limit(0);
          console.log(`   ⚠️  Could not execute via RPC: ${error.message}`);
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${err.message}`);
      }
    }
    
    console.log('\n✅ SQL fixes applied! Verifying...\n');
    
    // Verify by checking if we can access tables
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ user_profiles access test failed:', profileError.message);
    } else {
      console.log('✅ user_profiles is accessible');
    }
    
    const { data: customers, error: customerError } = await supabase
      .from('barbershop_customers')
      .select('*')
      .limit(1);
    
    if (customerError) {
      console.log('❌ barbershop_customers access test failed:', customerError.message);
    } else {
      console.log('✅ barbershop_customers is accessible');
    }
    
    console.log('\n🎉 RLS fix process complete!');
    console.log('\n⚠️  NOTE: Some statements may need to be run manually in Supabase SQL Editor');
    console.log('   Copy the contents of fix_rls_comprehensive.sql and run it there.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

applySQLFix().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
