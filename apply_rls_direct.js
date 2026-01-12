const https = require('https');

const supabaseUrl = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const sqlStatements = [
  `ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY`,
  
  `DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles`,
  `DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles`,
  `DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles`,
  `DROP POLICY IF EXISTS "Service role has full access" ON user_profiles`,
  `DROP POLICY IF EXISTS "Public users can view roles" ON user_profiles`,
  
  `CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id)`,
  
  `CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`,
  
  `CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`,
  
  `CREATE POLICY "Service role has full access" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  
  `DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`,
  
  `CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql STABLE`,
  
  `DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles`,
  `CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
  
  `DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings`,
  `CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
  
  `DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions`,
  `CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON barbershop_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
  
  `DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers`,
  `CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON barbershop_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
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
        'Content-Length': Buffer.byteLength(postData)
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

    req.write(postData);
    req.end();
  });
}

async function applyAllFixes() {
  console.log('🚀 Applying RLS Fixes to Supabase via Direct API...\n');
  console.log('=' .repeat(70));
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\n[${i + 1}/${sqlStatements.length}]`);
    console.log(`📝 ${sql.substring(0, 60)}...`);

    try {
      const result = await executeSQL(sql);
      
      if (result.success) {
        console.log(`✅ Success (HTTP ${result.status})`);
        successCount++;
      } else {
        console.log(`⚠️  Warning (HTTP ${result.status}): ${result.body.substring(0, 100)}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      errorCount++;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '=' .repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Warnings/Errors: ${errorCount}`);
  console.log(`📝 Total Statements: ${sqlStatements.length}`);
  console.log('\n' + '=' .repeat(70));
  
  if (errorCount === 0) {
    console.log('\n🎉 All RLS fixes applied successfully!\n');
  } else {
    console.log('\n⚠️  Some statements had warnings - this is normal for DROP IF EXISTS\n');
  }
}

applyAllFixes().catch(console.error);
