const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 DEEP ANALYSIS - SUPABASE DATABASE STATE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Check all tables
    console.log('📊 1. CHECKING TABLES...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.log('   Using alternative method to check tables...');
      // Try checking specific tables we know should exist
      const knownTables = ['user_profiles', 'barbershops', 'barbershop_customers', 
                          'service_catalog', 'bookings', 'capsters', 'transactions'];
      
      for (const tableName of knownTables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Table ${tableName}: NOT EXISTS or ERROR - ${error.message}`);
        } else {
          console.log(`   ✅ Table ${tableName}: EXISTS`);
        }
      }
    } else {
      console.log(`   Found ${tables.length} tables:`);
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    // 2. Check user_profiles table structure
    console.log('\n📋 2. ANALYZING user_profiles TABLE...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (profileError) {
      console.log(`   ❌ Error: ${profileError.message}`);
    } else {
      console.log(`   ✅ Total profiles: ${profiles.length}`);
      if (profiles.length > 0) {
        console.log(`   Columns: ${Object.keys(profiles[0]).join(', ')}`);
        console.log('\n   Sample data:');
        profiles.forEach((p, i) => {
          console.log(`   ${i + 1}. ID: ${p.id}, Email: ${p.email}, Role: ${p.role || p.user_role}, Name: ${p.full_name || p.name}`);
        });
      }
    }

    // 3. Check auth.users
    console.log('\n👥 3. CHECKING AUTH.USERS...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`   ❌ Error: ${authError.message}`);
    } else {
      console.log(`   ✅ Total auth users: ${authData.users.length}`);
      authData.users.slice(0, 5).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (ID: ${u.id})`);
      });
    }

    // 4. Check RLS policies
    console.log('\n🔒 4. CHECKING RLS POLICIES...');
    const checkRLS = `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', { 
      query: checkRLS 
    }).catch(async () => {
      // Fallback: try to get RLS status by checking if we can read tables
      console.log('   Checking RLS status via table access...');
      return { data: null, error: null };
    });

    if (rlsError) {
      console.log(`   ⚠️  Cannot directly query RLS policies (expected)`);
    } else if (rlsData) {
      console.log(`   Found ${rlsData.length} RLS policies`);
      rlsData.slice(0, 10).forEach(p => {
        console.log(`   - ${p.tablename}.${p.policyname} (${p.cmd})`);
      });
    }

    // 5. Check for orphaned users (auth.users without profile)
    console.log('\n🔍 5. CHECKING FOR ORPHANED USERS...');
    if (authData && !authError && profiles && !profileError) {
      const authEmails = authData.users.map(u => u.email);
      const profileEmails = profiles.map(p => p.email);
      const orphaned = authEmails.filter(e => !profileEmails.includes(e));
      
      if (orphaned.length > 0) {
        console.log(`   ⚠️  Found ${orphaned.length} orphaned users (auth but no profile):`);
        orphaned.slice(0, 5).forEach(email => console.log(`   - ${email}`));
      } else {
        console.log('   ✅ No orphaned users found');
      }
    }

    // 6. Check barbershops
    console.log('\n🏪 6. CHECKING BARBERSHOPS...');
    const { data: shops, error: shopError } = await supabase
      .from('barbershops')
      .select('*')
      .limit(5);
    
    if (shopError) {
      console.log(`   ❌ Error: ${shopError.message}`);
    } else {
      console.log(`   ✅ Total barbershops: ${shops.length}`);
      if (shops.length > 0) {
        shops.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.name} (Owner: ${s.owner_id})`);
        });
      }
    }

    // 7. Check capsters
    console.log('\n💈 7. CHECKING CAPSTERS...');
    const { data: capsters, error: capsterError } = await supabase
      .from('capsters')
      .select('*')
      .limit(5);
    
    if (capsterError) {
      console.log(`   ❌ Error or table not exists: ${capsterError.message}`);
    } else {
      console.log(`   ✅ Total capsters: ${capsters.length}`);
      if (capsters.length > 0) {
        capsters.forEach((c, i) => {
          console.log(`   ${i + 1}. User: ${c.user_id}, Barbershop: ${c.barbershop_id}, Status: ${c.status || 'N/A'}`);
        });
      }
    }

    // 8. Check transactions
    console.log('\n💰 8. CHECKING TRANSACTIONS...');
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (txError) {
      console.log(`   ❌ Error or table not exists: ${txError.message}`);
    } else {
      console.log(`   ✅ Total transactions: ${transactions.length}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ ANALYSIS COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error(error);
  }
}

analyzeDatabase();
