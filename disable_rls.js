const https = require('https');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'qwqmhvwqeynnyxaecqzw.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': accessToken,
        'Prefer': 'return=representation',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`HTTP ${res.statusCode}`);
        console.log('Response:', body);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function disableRLS() {
  console.log('🔓 ATTEMPTING TO DISABLE RLS...\n');
  console.log('=' .repeat(70));
  
  console.log('⚠️  IMPORTANT: Supabase REST API does not support DDL commands.');
  console.log('📋 You MUST manually execute this SQL in Supabase Dashboard:\n');
  console.log('🔗 URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
  console.log('=' .repeat(70));
  
  const sql = `
-- Quick fix for testing: Disable RLS on user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';
`;
  
  console.log(sql);
  console.log('=' .repeat(70));
  console.log('\n✅ After disabling RLS, authentication should work normally.');
  console.log('🔐 Service role key bypasses RLS anyway, so this affects anon users only.\n');
  
  console.log('=' .repeat(70));
  console.log('📝 ALTERNATIVE: Apply the fixed policies from FIX_RLS_INFINITE_RECURSION.sql');
  console.log('   This provides proper security while avoiding infinite recursion.');
  console.log('=' .repeat(70));
}

disableRLS().catch(console.error);
