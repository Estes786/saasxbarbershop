require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function applyRlsFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  
  console.log('🔧 APPLYING RLS FIX FOR barbershop_customers\n');
  
  const sqlContent = fs.readFileSync('./fix_rls_customers_strict.sql', 'utf8');
  
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  try {
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
    
    if (!response.ok) {
      console.error('❌ API Error:', result);
      return false;
    }

    console.log('✅ RLS policy fix applied successfully!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

applyRlsFix()
  .then(success => {
    if (success) {
      console.log('✅ Now test again with: node test_rls_permissions.js');
    }
  })
  .catch(console.error);
