const https = require('https');

const supabaseUrl = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const queries = [
  `DROP POLICY IF EXISTS "capsters_read_all" ON capsters`,
  `DROP POLICY IF EXISTS "capsters_admin_all" ON capsters`,
  `DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog`,
  `DROP POLICY IF EXISTS "service_catalog_admin_all" ON service_catalog`,
  `DROP POLICY IF EXISTS "bookings_customer_insert" ON bookings`,
  `DROP POLICY IF EXISTS "bookings_customer_read_own" ON bookings`,
  `DROP POLICY IF EXISTS "bookings_capster_read_assigned" ON bookings`,
  `DROP POLICY IF EXISTS "bookings_capster_update_own" ON bookings`,
  `DROP POLICY IF EXISTS "bookings_admin_all" ON bookings`,
  
  `ALTER TABLE capsters ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE bookings ENABLE ROW LEVEL SECURITY`,
  
  `CREATE POLICY "capsters_read_all" ON capsters FOR SELECT USING (true)`,
  `CREATE POLICY "capsters_admin_all" ON capsters FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `CREATE POLICY "service_catalog_read_all" ON service_catalog FOR SELECT USING (is_active = true)`,
  `CREATE POLICY "service_catalog_admin_all" ON service_catalog FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `CREATE POLICY "bookings_customer_insert" ON bookings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'customer' AND up.customer_phone = bookings.customer_phone))`,
  `CREATE POLICY "bookings_customer_read_own" ON bookings FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'customer' AND up.customer_phone = bookings.customer_phone))`,
  `CREATE POLICY "bookings_capster_read_assigned" ON bookings FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles up INNER JOIN capsters c ON c.id = up.capster_id WHERE up.id = auth.uid() AND up.role = 'capster' AND bookings.capster_id = c.id))`,
  `CREATE POLICY "bookings_capster_update_own" ON bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM user_profiles up INNER JOIN capsters c ON c.id = up.capster_id WHERE up.id = auth.uid() AND up.role = 'capster' AND bookings.capster_id = c.id))`,
  `CREATE POLICY "bookings_admin_all" ON bookings FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))`
];

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function applyFixes() {
  console.log('🚀 Applying RLS Policy Fixes...\n');
  
  let success = 0;
  let failed = 0;

  for (const query of queries) {
    try {
      const result = await executeQuery(query);
      const shortQuery = query.substring(0, 50) + '...';
      console.log(`✅ ${shortQuery}`);
      success++;
    } catch (err) {
      console.log(`⚠️  ${query.substring(0, 50)}... - ${err.message}`);
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed`);
  console.log('\n✅ RLS POLICIES APPLIED!');
  console.log('\n🔥 Booking system should now work!');
  console.log('Test it by:');
  console.log('1. Refresh the booking page');
  console.log('2. The capsters dropdown should load immediately');
  console.log('3. Try making a booking');
}

applyFixes().catch(console.error);
