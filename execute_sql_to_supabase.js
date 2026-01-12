require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const https = require('https');

async function executeSQLScript() {
  console.log('\n🚀 EXECUTING ACCESS KEY SYSTEM SQL SCRIPT...\n');
  
  try {
    // Read SQL script
    const sqlScript = fs.readFileSync('./IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql', 'utf8');
    
    const projectRef = 'qwqmhvwqeynnyxaecqzw';
    const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
    
    const data = JSON.stringify({
      query: sqlScript
    });
    
    const options = {
      hostname: 'qwqmhvwqeynnyxaecqzw.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', responseData);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('\n✅ SQL Script executed successfully!');
        } else {
          console.log('\n⚠️  Could not execute via API');
          console.log('\n📝 MANUAL STEPS REQUIRED:');
          console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw');
          console.log('   2. Go to SQL Editor');
          console.log('   3. Copy and paste content from: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
          console.log('   4. Click "Run" to execute');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      console.log('\n📝 ALTERNATIVE: Execute manually via Supabase SQL Editor');
    });
    
    req.write(data);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQLScript();
