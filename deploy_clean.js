const fs = require('fs');

async function deployClean() {
  console.log('🚀 Deploy Schema - Clean Version (without utility functions)...\n');
  
  let sqlContent = fs.readFileSync('/home/user/uploaded_files/DEPLOY_TO_SUPABASE (5).sql', 'utf8');
  
  // Remove STEP 9 (trigger functions)
  const step9Start = sqlContent.indexOf('-- STEP 9: CREATE TRIGGER FUNCTIONS');
  const step10Start = sqlContent.indexOf('-- STEP 10: ENABLE ROW LEVEL SECURITY');
  
  if (step9Start > 0 && step10Start > 0) {
    sqlContent = sqlContent.substring(0, step9Start) + sqlContent.substring(step10Start);
  }
  
  // Remove STEP 17 (utility functions - calculate_churn_risk)
  const step17Start = sqlContent.indexOf('-- STEP 17: CREATE UTILITY FUNCTIONS');
  const deployCompleteStart = sqlContent.indexOf('-- DEPLOYMENT COMPLETE!');
  
  if (step17Start > 0 && deployCompleteStart > 0) {
    sqlContent = sqlContent.substring(0, step17Start) + sqlContent.substring(deployCompleteStart);
    console.log('✅ Removed problematic functions\n');
  }
  
  const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';
  const projectRef = 'qwqmhvwqeynnyxaecqzw';
  
  console.log('📤 Deploying to Supabase...\n');
  
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
      console.log('✅ Schema deployed successfully!\n');
      console.log('Result:', JSON.stringify(result, null, 2).substring(0, 500));
      return true;
    } else {
      console.log('❌ Deployment failed:');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

deployClean();
