require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function applyUltraStrictFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  
  console.log('🔧 APPLYING ULTRA STRICT RLS FIX\n');
  
  const sqlContent = fs.readFileSync('./fix_rls_ultra_strict.sql', 'utf8');
  
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
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('\n❌ API Error:', result);
      return false;
    }

    console.log('\n✅ Ultra strict RLS applied!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

applyUltraStrictFix().catch(console.error);
