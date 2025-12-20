const https = require('https');
require('dotenv').config({ path: '.env.local' });

const projectRef = 'qwqmhvwqeynnyxaecqzw';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

console.log('🔐 Applying RLS Fixes (Statement by Statement)...\n');
console.log('=' .repeat(60));

const statements = [
  // Drop all existing policies
  `DROP POLICY IF EXISTS "service_role_full_access" ON user_profiles`,
  `DROP POLICY IF EXISTS "authenticated_insert_own" ON user_profiles`,
  `DROP POLICY IF EXISTS "authenticated_select_own" ON user_profiles`,
  `DROP POLICY IF EXISTS "authenticated_update_own" ON user_profiles`,
  `DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles`,
  `DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles`,
  
  // Ensure RLS is enabled
  `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY`,
  
  // Create new policies
  `CREATE POLICY "service_role_full_access" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "authenticated_insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`,
  `CREATE POLICY "authenticated_select_own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id)`,
  `CREATE POLICY "authenticated_update_own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`,
  
  // Fix function
  `DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`,
  `CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql STABLE`,
  
  // Recreate triggers
  `DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles`,
  `CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
];

let executed = 0;
let failed = 0;

async function executeStatement(sql, index) {
  return new Promise((resolve) => {
    const description = sql.substring(0, 60) + '...';
    console.log(`\n[${index + 1}/${statements.length}] ${description}`);
    
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   ✅ Success');
          executed++;
        } else {
          console.log(`   ❌ Failed: ${body.substring(0, 100)}`);
          failed++;
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

async function applyAll() {
  for (let i = 0; i < statements.length; i++) {
    await executeStatement(statements[i], i);
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Executed: ${executed}/${statements.length}`);
  console.log(`❌ Failed: ${failed}/${statements.length}`);
  
  if (executed >= statements.length - failed) {
    console.log('\n✅ RLS policies applied successfully!');
    console.log('🧪 Running authentication test...\n');
    
    const { exec } = require('child_process');
    exec('node test_auth_automated.js', (error, stdout) => {
      console.log(stdout);
    });
  } else {
    console.log('\n⚠️  Some statements failed. Check errors above.');
  }
}

applyAll();
