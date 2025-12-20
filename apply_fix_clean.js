require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function executeViaManagementApi() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  
  console.log('🚀 EXECUTING DATABASE FIX VIA MANAGEMENT API\n');
  console.log('📍 Project Ref:', projectRef);
  console.log('🔑 Access Token:', accessToken ? '✅ Set' : '❌ Missing');
  
  const sqlContent = fs.readFileSync('./fix_database_clean.sql', 'utf8');
  
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  try {
    console.log('\n📤 Sending request to Management API...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    const result = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('\n❌ API Error:', result);
      
      // Print helpful instructions
      console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ⚠️  MANUAL EXECUTION REQUIRED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Please execute the SQL manually:');
      console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
      console.log('2. Copy the contents of: fix_database_clean.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click "Run" button');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return false;
    }

    console.log('\n✅ DATABASE FIX EXECUTED SUCCESSFULLY!\n');
    return true;
    
  } catch (error) {
    console.error('\n❌ Error calling Management API:', error);
    return false;
  }
}

// Execute
executeViaManagementApi()
  .then(success => {
    if (success) {
      console.log('✅ All done! Now run: node verify_database.js');
    } else {
      console.log('⚠️ Please execute SQL manually in Supabase Dashboard');
    }
  })
  .catch(console.error);
