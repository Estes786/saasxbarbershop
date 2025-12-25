#!/usr/bin/env node

const https = require('https');

const PROJECT_REF = 'qwqmhvwqeynnyxaecqzw';
const ACCESS_TOKEN = 'sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4';

async function query(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔍 Analyzing current database schema...\\n');
  
  try {
    // Check barbershop_customers columns
    console.log('📋 Checking barbershop_customers table columns...');
    const customerColumns = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'barbershop_customers'
      ORDER BY ordinal_position;
    `);
    
    console.log('\\nColumns in barbershop_customers:');
    customerColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check bookings columns
    console.log('\\n📋 Checking bookings table columns...');
    const bookingColumns = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);
    
    console.log('\\nColumns in bookings:');
    bookingColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check which tables exist
    console.log('\\n📋 Checking which tables exist...');
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\\nExisting tables:');
    tables.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });
    
    // Check if new tables from FASE 2/3 exist
    console.log('\\n🔍 Checking FASE 2/3 tables...');
    const fase23Tables = ['customer_visit_history', 'customer_predictions'];
    for (const tableName of fase23Tables) {
      const exists = tables.some(t => t.table_name === tableName);
      console.log(`  - ${tableName}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('\\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
