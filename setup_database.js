const https = require('https');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'qwqmhvwqeynnyxaecqzw.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
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

async function setupDatabase() {
  console.log('🚀 Setting up Supabase Database...\n');
  
  console.log('⚠️  IMPORTANT: RLS Policies cannot be applied via REST API.');
  console.log('📋 Please manually execute this SQL in Supabase Dashboard:');
  console.log('🔗 https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new\n');
  console.log('=' .repeat(70));
  
  const rlsSQL = `
-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role has full access"
ON user_profiles FOR ALL TO service_role
USING (true) WITH CHECK (true);
`;
  
  console.log(rlsSQL);
  console.log('=' .repeat(70));
  
  console.log('\n✅ For this test, I will proceed without RLS (using service role key)');
  console.log('🔐 Service role bypasses RLS, so authentication should work.\n');
}

setupDatabase().catch(console.error);
