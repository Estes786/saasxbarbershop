#!/usr/bin/env node

/**
 * APPLY FINAL ONBOARDING FIX
 * Purpose: Execute comprehensive onboarding fix to Supabase database
 * Date: 31 December 2025
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Supabase credentials
const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

console.log('========================================');
console.log('🚀 FINAL ONBOARDING FIX - EXECUTOR');
console.log('========================================\n');

// Read SQL file
const sqlFilePath = path.join(__dirname, 'FINAL_ONBOARDING_FIX_2025_TESTED.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ ERROR: SQL file not found:', sqlFilePath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('✓ SQL file loaded successfully');
console.log(`✓ File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

// Function to execute SQL via Supabase Management API
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'qwqmhvwqeynnyxaecqzw.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Length': data.length,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, body, statusCode: res.statusCode });
        } else {
          reject({ 
            success: false, 
            error: body, 
            statusCode: res.statusCode 
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

// Alternative: Use psql-style execution via pg library (if available)
async function executeViaPg() {
  try {
    // Try using @supabase/supabase-js
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔧 Executing SQL via Supabase client...\n');

    // Split SQL into executable chunks (by semicolons outside functions)
    const statements = sqlContent
      .split(/;\s*(?![^$]*\$\$)/g) // Split by ; but not inside $$ blocks
      .filter(s => s.trim().length > 0)
      .map(s => s.trim() + ';');

    console.log(`📝 Total statements to execute: ${statements.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip comments-only statements
      if (stmt.match(/^--/) || stmt.match(/^\s*$/)) {
        continue;
      }

      try {
        // Use rpc to execute raw SQL (if you have a custom function)
        // Or use direct query execution
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          console.log(`❌ Statement ${i + 1}: ERROR`);
          console.log(`   ${error.message}\n`);
          errorCount++;
        } else {
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`✓ Processed ${i + 1}/${statements.length} statements...`);
          }
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1}: EXCEPTION`);
        console.log(`   ${err.message}\n`);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('📊 EXECUTION SUMMARY');
    console.log('========================================');
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📁 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 ALL FIXES APPLIED SUCCESSFULLY!\n');
      return true;
    } else {
      console.log('\n⚠️  Some statements failed. Check errors above.\n');
      return false;
    }

  } catch (err) {
    console.error('❌ Error loading Supabase client:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Try method 1: Via Supabase JS client
    const success = await executeViaPg();

    if (!success) {
      console.log('\n💡 ALTERNATIVE: Copy SQL to Supabase SQL Editor');
      console.log('   1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql');
      console.log('   2. Paste contents of: FINAL_ONBOARDING_FIX_2025_TESTED.sql');
      console.log('   3. Click "Run"\n');
    }

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('\n💡 MANUAL EXECUTION REQUIRED:');
    console.error('   1. Open Supabase SQL Editor');
    console.error('   2. Copy file: FINAL_ONBOARDING_FIX_2025_TESTED.sql');
    console.error('   3. Paste and run in SQL Editor\n');
    process.exit(1);
  }
}

// Check if @supabase/supabase-js is installed
try {
  require.resolve('@supabase/supabase-js');
  main();
} catch (e) {
  console.log('⚠️  @supabase/supabase-js not found\n');
  console.log('📋 MANUAL EXECUTION INSTRUCTIONS:');
  console.log('========================================\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql\n');
  console.log('2. Copy contents of file:');
  console.log('   FINAL_ONBOARDING_FIX_2025_TESTED.sql\n');
  console.log('3. Paste into SQL Editor and click "Run"\n');
  console.log('4. Wait for completion (should take 5-10 seconds)\n');
  console.log('5. Check for success message at the end\n');
  console.log('========================================\n');
  console.log('✅ File is ready at:');
  console.log(`   ${sqlFilePath}\n`);
  process.exit(0);
}
