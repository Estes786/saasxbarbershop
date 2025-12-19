const fs = require('fs');

async function deployFinal() {
  console.log('🚀 Deploying Schema - Final Version...\n');
  
  let sqlContent = fs.readFileSync('/home/user/uploaded_files/DEPLOY_TO_SUPABASE (5).sql', 'utf8');
  
  // Remove STEP 9 (trigger functions) - will add later with proper STABLE marking
  const step9Start = sqlContent.indexOf('-- STEP 9: CREATE TRIGGER FUNCTIONS');
  const step10Start = sqlContent.indexOf('-- STEP 10: ENABLE ROW LEVEL SECURITY');
  
  if (step9Start > 0 && step10Start > 0) {
    sqlContent = sqlContent.substring(0, step9Start) + sqlContent.substring(step10Start);
    console.log('✅ Removed STEP 9 (trigger functions)\n');
  }
  
  // Remove STEP 17 (utility functions)
  const step17Start = sqlContent.indexOf('-- STEP 17: CREATE UTILITY FUNCTIONS');
  const deployCompleteStart = sqlContent.indexOf('-- DEPLOYMENT COMPLETE!');
  
  if (step17Start > 0 && deployCompleteStart > 0) {
    sqlContent = sqlContent.substring(0, step17Start) + sqlContent.substring(deployCompleteStart);
    console.log('✅ Removed STEP 17 (utility functions)\n');
  }
  
  // Remove the problematic index with NOW()
  const problematicIndex = 'CREATE INDEX IF NOT EXISTS idx_leads_active ON barbershop_actionable_leads(is_contacted, expires_at) \n  WHERE is_contacted = FALSE AND expires_at > NOW();';
  sqlContent = sqlContent.replace(problematicIndex, '-- Removed problematic index with NOW()');
  console.log('✅ Removed problematic index with NOW()\n');
  
  const accessToken = 'sbp_4fe482a9b41afba4b7a00e76d178f58e9b69cfac';
  const projectRef = 'qwqmhvwqeynnyxaecqzw';
  
  console.log('📤 Deploying to Supabase...\n');
  console.log('This may take 30-60 seconds...\n');
  
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
      console.log('✅ ✅ ✅ SCHEMA DEPLOYED SUCCESSFULLY! ✅ ✅ ✅\n');
      console.log('📊 Tables created:');
      console.log('  - user_profiles (RBAC)');
      console.log('  - barbershop_transactions');
      console.log('  - barbershop_customers');
      console.log('  - bookings');
      console.log('  - barbershop_analytics_daily');
      console.log('  - barbershop_actionable_leads');
      console.log('  - barbershop_campaign_tracking\n');
      console.log('🔒 Row Level Security (RLS) enabled\n');
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

deployFinal();
