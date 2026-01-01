#!/usr/bin/env node

/**
 * Script to apply Phase 1 Multi-Location Migration to Supabase
 * Uses Supabase Management API with Service Role Key
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

function executeSQLFile(sqlContent) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sqlContent });
    
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function applyMigration() {
  console.log('🚀 APPLYING PHASE 1: MULTI-LOCATION SUPPORT MIGRATION\n');
  console.log('=' .repeat(80));
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '01_multi_location_phase1_migration.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('\n📄 SQL Migration file loaded');
    console.log(`   Size: ${Math.round(sqlContent.length / 1024)} KB`);
    console.log(`   Lines: ${sqlContent.split('\n').length}`);
    
    console.log('\n⏳ Executing migration... (this may take a moment)\n');
    
    const result = await executeSQLFile(sqlContent);
    
    console.log('✅ MIGRATION EXECUTED SUCCESSFULLY!\n');
    console.log('=' .repeat(80));
    console.log('\n🎉 PHASE 1 COMPLETE!\n');
    console.log('Database schema has been updated with multi-location support.');
    console.log('\nYou can now:');
    console.log('  1. Create multiple branches for each barbershop');
    console.log('  2. Assign capsters to specific branches');
    console.log('  3. Allow customers to select branch when booking');
    console.log('  4. Track analytics per branch\n');
    
  } catch (error) {
    console.error('\n❌ ERROR APPLYING MIGRATION:');
    console.error(error.message);
    console.error('\n🔧 MANUAL APPLICATION REQUIRED');
    console.error('\nPlease apply the SQL file manually:');
    console.error('1. Go to Supabase Dashboard');
    console.error('2. Open SQL Editor');
    console.error('3. Copy content from: 01_multi_location_phase1_migration.sql');
    console.error('4. Run the query\n');
    process.exit(1);
  }
}

// Run migration
applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
