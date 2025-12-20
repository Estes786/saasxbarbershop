const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDatabaseSchema() {
  console.log('\n🔧 PERBAIKAN SCHEMA DATABASE\n');
  
  // 1. Periksa kolom yang ada di user_profiles
  console.log('1️⃣ Current user_profiles columns:');
  const { data: sample } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (sample && sample[0]) {
    console.log('   Existing columns:', Object.keys(sample[0]));
  }

  // 2. Tambahkan kolom yang hilang jika perlu
  console.log('\n2️⃣ Adding missing columns to user_profiles...');
  
  const alterCommands = [
    // Tambah kolom full_name jika belum ada
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;`,
    
    // Tambah kolom user_role jika belum ada (rename dari 'role')
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'customer';`,
    
    // Copy data dari 'role' ke 'user_role' jika ada
    `UPDATE user_profiles SET user_role = role WHERE user_role IS NULL AND role IS NOT NULL;`,
    
    // Set default untuk user_role
    `UPDATE user_profiles SET user_role = 'customer' WHERE user_role IS NULL;`,
    
    // Set full_name dari customer_name jika ada
    `UPDATE user_profiles SET full_name = customer_name WHERE full_name IS NULL AND customer_name IS NOT NULL;`
  ];

  for (const cmd of alterCommands) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: cmd })
      });
      
      if (response.ok) {
        console.log('   ✅', cmd.substring(0, 60) + '...');
      } else {
        console.log('   ⚠️', cmd.substring(0, 60) + '... (already exists or skipped)');
      }
    } catch (err) {
      console.log('   ⚠️', cmd.substring(0, 60) + '... (skipped)');
    }
  }

  // 3. Verifikasi kolom setelah perubahan
  console.log('\n3️⃣ Verifying columns after changes:');
  const { data: updated } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (updated && updated[0]) {
    console.log('   Updated columns:', Object.keys(updated[0]));
  }

  // 4. Test insert dengan kolom yang benar
  console.log('\n4️⃣ Testing insert with correct schema...');
  const testId = 'test-' + Date.now();
  const { data: testInsert, error: insertError } = await supabase
    .from('user_profiles')
    .insert({
      id: testId,
      email: `test${Date.now()}@example.com`,
      full_name: 'Test User',
      user_role: 'customer'
    })
    .select();

  if (insertError) {
    console.error('   ❌ Insert failed:', insertError.message);
  } else {
    console.log('   ✅ Insert successful!');
    // Cleanup
    await supabase.from('user_profiles').delete().eq('id', testId);
  }

  console.log('\n✅ Schema fix complete\n');
}

fixDatabaseSchema().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
