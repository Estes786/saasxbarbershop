const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function deploySQLToSupabase() {
  console.log('🚀 Starting SQL deployment to Supabase...\n');
  
  // Read SQL file
  const sqlContent = fs.readFileSync('/home/user/uploaded_files/DEPLOY_TO_SUPABASE (5).sql', 'utf8');
  
  const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';
  const projectRef = 'qwqmhvwqeynnyxaecqzw';
  
  console.log('📤 Sending SQL to Supabase Management API...\n');
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: sqlContent
        })
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SQL deployment successful!\n');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Deployment failed:');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error during deployment:', error.message);
  }
}

deploySQLToSupabase();
