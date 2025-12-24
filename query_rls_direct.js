const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function queryRLSPolicies() {
  console.log('🔍 QUERYING ACTUAL RLS POLICIES FROM SUPABASE...\n');
  console.log('=' .repeat(80));
  
  try {
    // Query RLS policies using PostgREST
    const query = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'user_profiles'
      ORDER BY policyname
    `;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: query })
    });

    if (!response.ok) {
      console.log('❌ API call failed:', response.status, response.statusText);
      console.log('Trying direct query method...\n');
      
      // Fallback: use pg_stat_statements or direct table query
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to query pg_policies directly
      const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_profiles');
      
      if (error) {
        console.log('❌ Cannot query pg_policies:', error.message);
        console.log('\n⚠️  RLS Policies cannot be queried via REST API.');
        console.log('   Will need to check manually in Supabase SQL Editor.\n');
        return null;
      }
      
      console.log('✅ Found policies via direct query:\n');
      data.forEach(policy => {
        console.log(`Policy: ${policy.policyname}`);
        console.log(`  Command: ${policy.cmd}`);
        console.log(`  Roles: ${policy.roles}`);
        console.log(`  USING: ${policy.qual || 'N/A'}`);
        console.log(`  WITH CHECK: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
      
      return data;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n📋 RECOMMENDATION:');
    console.log('   Since we cannot query RLS policies programmatically,');
    console.log('   we will analyze the provided SQL scripts and test the actual behavior.');
  }
}

queryRLSPolicies();
