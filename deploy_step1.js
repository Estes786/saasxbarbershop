const fs = require('fs');

async function deployStep1() {
  console.log('🚀 STEP 1: Deploy Schema WITHOUT trigger functions...\n');
  
  // Read original SQL and remove problematic trigger function section
  let sqlContent = fs.readFileSync('/home/user/uploaded_files/DEPLOY_TO_SUPABASE (5).sql', 'utf8');
  
  // Remove STEP 9 (trigger functions) - we'll add this later with proper STABLE marking
  const step9Start = sqlContent.indexOf('-- STEP 9: CREATE TRIGGER FUNCTIONS');
  const step10Start = sqlContent.indexOf('-- STEP 10: ENABLE ROW LEVEL SECURITY');
  
  if (step9Start > 0 && step10Start > 0) {
    sqlContent = sqlContent.substring(0, step9Start) + sqlContent.substring(step10Start);
    console.log('✅ Removed STEP 9 (trigger functions) - will add later\n');
  }
  
  const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';
  const projectRef = 'qwqmhvwqeynnyxaecqzw';
  
  console.log('📤 Sending SQL to Supabase...\n');
  
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
      console.log('✅ STEP 1 COMPLETE: Schema deployed successfully!\n');
      return true;
    } else {
      console.log('❌ STEP 1 FAILED:');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

deployStep1();
