const https = require('https');

const supabaseUrl = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const queries = [
  'ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles',
  'DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles',
  'DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles',
  'DROP POLICY IF EXISTS "Service role has full access" ON user_profiles',
  
  `CREATE POLICY "Users can view their own profile"
   ON user_profiles FOR SELECT TO authenticated
   USING (auth.uid() = id)`,
  
  `CREATE POLICY "Users can insert their own profile"
   ON user_profiles FOR INSERT TO authenticated
   WITH CHECK (auth.uid() = id)`,
  
  `CREATE POLICY "Users can update their own profile"
   ON user_profiles FOR UPDATE TO authenticated
   USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`,
  
  `CREATE POLICY "Service role has full access"
   ON user_profiles FOR ALL TO service_role
   USING (true) WITH CHECK (true)`,
  
  'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE',
  
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = CURRENT_TIMESTAMP;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql STABLE`,
  
  `DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles`,
  
  `CREATE TRIGGER update_user_profiles_updated_at
   BEFORE UPDATE ON user_profiles FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column()`
];

async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode, body });
        } else {
          resolve({ success: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function applyAllFixes() {
  console.log('🔐 Applying RLS Fixes via Direct HTTPS Requests...\n');
  console.log('Target: https://' + supabaseUrl + '\n');
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const shortQuery = query.substring(0, 60).replace(/\s+/g, ' ') + '...';
    
    console.log(`\n[${i + 1}/${queries.length}] ${shortQuery}`);
    
    try {
      const result = await executeQuery(query);
      
      if (result.success) {
        console.log(`✅ HTTP ${result.status} - Success`);
        successCount++;
      } else {
        console.log(`❌ HTTP ${result.status} - Failed`);
        console.log(`Response: ${result.body.substring(0, 200)}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      failCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 EXECUTION SUMMARY:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📋 Total: ${queries.length}`);
  console.log('='.repeat(70));

  if (failCount > 0) {
    console.log('\n⚠️  Note: Some queries may have failed due to RPC method not being available.');
    console.log('You need to manually apply the SQL via Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  }
}

applyAllFixes().catch(console.error);
