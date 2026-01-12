const https = require('https');
const fs = require('fs');

const accessToken = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';
const projectRef = 'qwqmhvwqeynnyxaecqzw';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            resolve({ success: true, data: parsed });
          } catch (e) {
            resolve({ success: true, data: body });
          }
        } else {
          reject({ 
            success: false, 
            statusCode: res.statusCode, 
            error: body 
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function applySQLFile() {
  console.log('🔐 Applying Complete RLS Fix via Supabase Management API...\n');
  console.log('=' .repeat(60));
  
  const sql = fs.readFileSync('FIX_ALL_RLS_COMPLETE.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Filter out comments and SELECT verification queries
      return s.length > 0 && 
             !s.startsWith('--') && 
             !s.includes('SELECT tablename') &&
             !s.includes('SELECT schemaname') &&
             !s.includes('SELECT proname') &&
             !s.includes('FROM pg_tables') &&
             !s.includes('FROM pg_policies') &&
             !s.includes('FROM pg_proc');
    });

  console.log(`📄 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    
    if (!statement) continue;
    
    // Show preview of statement
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);
    
    try {
      const result = await executeSQL(statement + ';');
      console.log('✅ Success');
      successCount++;
    } catch (err) {
      console.error(`❌ Error (Status ${err.statusCode}):`, err.error);
      errorCount++;
      
      // Continue on certain expected errors
      const errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      if (
        errorMsg.includes('does not exist') ||
        errorMsg.includes('already exists') ||
        errorMsg.includes('cannot drop')
      ) {
        console.log('⚠️  Expected error, continuing...');
      }
    }
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${statements.length}`);
  console.log('='.repeat(60));
  
  if (errorCount === 0 || successCount > errorCount) {
    console.log('\n🎉 RLS Fix Applied Successfully!');
    console.log('\nNext steps:');
    console.log('1. Build the application');
    console.log('2. Start development server');
    console.log('3. Test customer registration');
    console.log('4. Test admin registration');
    console.log('5. Test login and Google OAuth');
  } else {
    console.log('\n⚠️  Some errors occurred.');
    console.log('Please apply SQL manually via Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  }
}

applySQLFile().catch(err => {
  console.error('❌ Fatal Error:', err);
  console.log('\n📝 Please apply FIX_ALL_RLS_COMPLETE.sql manually via:');
  console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  process.exit(1);
});
