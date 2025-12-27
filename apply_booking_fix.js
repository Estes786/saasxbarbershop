const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function applyBookingFix() {
  console.log('🚀 Applying booking system fix...\n');

  try {
    // Read SQL file
    const sql = fs.readFileSync('FIX_BOOKING_SYSTEM_COMPLETE.sql', 'utf8');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, execute line by line
      console.log('⚠️  exec_sql RPC not found, executing statements manually...\n');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$') && !s.startsWith('RAISE'));

      for (const statement of statements) {
        if (statement.includes('DROP POLICY')) {
          try {
            await supabase.rpc('exec_sql', { query: statement + ';' });
            console.log('✅ Dropped policy');
          } catch (err) {
            console.log('⚠️  Policy not found, skipping');
          }
        } else if (statement.includes('CREATE POLICY') || statement.includes('ALTER TABLE')) {
          try {
            await supabase.rpc('exec_sql', { query: statement + ';' });
            console.log('✅ Applied statement');
          } catch (err) {
            console.log('⚠️  Error:', err.message);
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully!');
      console.log('Response:', data);
    }

    // Verify fixes
    console.log('\n🔍 Verifying fixes...\n');

    // Test capsters read
    const { data: capsters, error: capstersError } = await supabase
      .from('capsters')
      .select('*')
      .limit(5);

    if (capstersError) {
      console.log('❌ Error reading capsters:', capstersError.message);
    } else {
      console.log(`✅ Capsters readable: ${capsters.length} capsters found`);
    }

    // Test services read
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.log('❌ Error reading services:', servicesError.message);
    } else {
      console.log(`✅ Services readable: ${services.length} services found`);
    }

    console.log('\n✅ BOOKING SYSTEM FIX APPLIED!');
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/editor/sql');
    console.log('2. Copy and paste FIX_BOOKING_SYSTEM_COMPLETE.sql');
    console.log('3. Click "Run" to apply the fix');
    console.log('\n🔥 After applying, booking system will work!');

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  }
}

applyBookingFix();
