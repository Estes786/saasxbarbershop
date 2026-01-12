const https = require('https');
const fs = require('fs');

const supabaseUrl = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=representation',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
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

async function main() {
  console.log('🚀 Applying SQL Fixes to Supabase Database...\n');
  console.log('=' .repeat(60));
  
  // SQL statements to execute
  const sqlStatements = [
    // Enable RLS
    'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY',
    
    // Drop existing policies
    'DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles',
    'DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles',
    'DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles',
    'DROP POLICY IF EXISTS "Service role has full access" ON user_profiles',
    
    // Create new policies
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
    
    // Fix SQL function
    'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE',
    
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
     RETURNS TRIGGER AS $$
     BEGIN
       NEW.updated_at = CURRENT_TIMESTAMP;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql STABLE`,
    
    // Recreate triggers
    'DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles',
    `CREATE TRIGGER update_user_profiles_updated_at
     BEFORE UPDATE ON user_profiles
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    
    'DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings',
    `CREATE TRIGGER update_bookings_updated_at
     BEFORE UPDATE ON bookings
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
  ];
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\n[${i+1}/${sqlStatements.length}] Executing:`);
    console.log(sql.substring(0, 80) + '...');
    
    try {
      const result = await executeSQL(sql);
      if (result.success) {
        console.log('✅ Success');
      } else {
        console.log(`⚠️  Status ${result.status}: ${result.body.substring(0, 100)}`);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ SQL Application Complete!\n');
}

main().catch(console.error);
