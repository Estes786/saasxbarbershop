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
          resolve({ success: true });
        } else {
          reject({ success: false, statusCode: res.statusCode, error: body });
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
  console.log('🔐 Applying Corrected RLS Fix...\n');
  
  const sql = fs.readFileSync('FIX_RLS_CORRECT.sql', 'utf8');
  
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      return s.length > 0 && 
             !s.startsWith('--') && 
             !s.includes('SELECT tablename') &&
             !s.includes('SELECT schemaname') &&
             !s.includes('FROM pg_tables') &&
             !s.includes('FROM pg_policies');
    });

  console.log(`📄 Found ${statements.length} SQL statements\n`);
  
  let successCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    const preview = statement.substring(0, 70).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);
    
    try {
      await executeSQL(statement + ';');
      console.log('✅');
      successCount++;
    } catch (err) {
      const errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      if (errorMsg.includes('does not exist') || errorMsg.includes('already exists')) {
        console.log('⚠️  (expected)');
      } else {
        console.log('❌', errorMsg.substring(0, 100));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log(`\n🎉 Applied ${successCount}/${statements.length} statements successfully!\n`);
}

applySQLFile().catch(console.error);
