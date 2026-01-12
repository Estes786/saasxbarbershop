const fs = require('fs');

async function deployTriggers() {
  console.log('🚀 Deploying Trigger Functions (with STABLE marking)...\n');
  
  const sqlContent = fs.readFileSync('/home/user/uploaded_files/FIX_SQL_FUNCTION (5).sql', 'utf8');
  
  const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';
  const projectRef = 'qwqmhvwqeynnyxaecqzw';
  
  console.log('📤 Deploying trigger functions...\n');
  
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
      console.log('✅ Trigger functions deployed successfully!\n');
      console.log('🔄 Triggers created for auto-updating updated_at columns\n');
      return true;
    } else {
      console.log('❌ Trigger deployment failed:');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

deployTriggers();
