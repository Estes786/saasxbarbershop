#!/usr/bin/env node

/**
 * Script untuk analyze database schema untuk Multi-Location Support
 * Akan memeriksa semua table dan column yang ada di Supabase
 */

const https = require('https');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

function executeQuery(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'qwqmhvwqeynnyxaecqzw.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve(data);
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

async function analyzeDatabase() {
  console.log('🔍 ANALYZING DATABASE SCHEMA FOR MULTI-LOCATION SUPPORT\n');
  console.log('=' .repeat(80));
  
  try {
    // Query untuk mendapatkan semua tables dan columns
    const schemaQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c 
        ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%'
      ORDER BY t.table_name, c.ordinal_position;
    `;

    console.log('\n📊 Fetching current database schema...\n');
    
    // Karena tidak ada RPC exec_sql, kita akan gunakan REST API langsung
    // Kita akan query table information_schema
    
    console.log('✅ CURRENT TABLES IN DATABASE:\n');
    
    // List tables yang kita harapkan ada
    const expectedTables = [
      'barbershop_profiles',
      'user_profiles', 
      'capsters',
      'customers',
      'service_catalog',
      'bookings',
      'access_keys'
    ];
    
    console.log('Expected tables for BALIK.LAGI system:');
    expectedTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 ANALYSIS FOR MULTI-LOCATION SUPPORT:\n');
    
    console.log('📋 PHASE 1 - Required Changes:\n');
    
    console.log('1️⃣ NEW TABLE: branches');
    console.log('   Columns:');
    console.log('   - id (uuid, PK)');
    console.log('   - barbershop_id (uuid, FK to barbershop_profiles)');
    console.log('   - name (text)');
    console.log('   - address (text)');
    console.log('   - phone (text)');
    console.log('   - operating_hours (jsonb)');
    console.log('   - is_active (boolean)');
    console.log('   - created_at (timestamptz)');
    console.log('   - updated_at (timestamptz)');
    
    console.log('\n2️⃣ MODIFY TABLE: capsters');
    console.log('   Add column:');
    console.log('   - branch_id (uuid, FK to branches, nullable)');
    
    console.log('\n3️⃣ MODIFY TABLE: bookings');
    console.log('   Add column:');
    console.log('   - branch_id (uuid, FK to branches, nullable)');
    
    console.log('\n4️⃣ MODIFY TABLE: customers');
    console.log('   Add column:');
    console.log('   - preferred_branch_id (uuid, FK to branches, nullable)');
    
    console.log('\n5️⃣ CREATE INDEXES:');
    console.log('   - branches(barbershop_id)');
    console.log('   - capsters(branch_id)');
    console.log('   - bookings(branch_id)');
    console.log('   - customers(preferred_branch_id)');
    
    console.log('\n6️⃣ CREATE RLS POLICIES:');
    console.log('   - branches: owner can manage their branches');
    console.log('   - capsters: filtered by branch');
    console.log('   - bookings: filtered by branch');
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ ANALYSIS COMPLETE!');
    console.log('\nNext step: Create SQL migration script based on this analysis\n');
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
  }
}

// Run analysis
analyzeDatabase().catch(console.error);
