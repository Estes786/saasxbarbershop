#!/usr/bin/env node
/**
 * Deep Database Schema Analysis
 * Get actual table names and structure
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSchema() {
  console.log('\n🔍 DEEP DATABASE SCHEMA ANALYSIS\n');
  console.log('=' .repeat(60));
  
  const tables = [
    'barbershop_profiles',
    'branches',
    'capsters',
    'bookings',
    'customers',
    'customer_profiles',
    'user_profiles',
    'profiles',
    'service_catalog',
    'services'
  ];

  const existingTables = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
        console.log(`✅ ${table} - EXISTS`);
        
        // Get column names
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
        } else {
          console.log(`   (empty table)`);
        }
      }
    } catch (e) {
      // Table doesn't exist
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 FOUND ${existingTables.length} TABLES:\n`);
  existingTables.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t}`);
  });
  
  // Check for user-related tables
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 CHECKING USER/CUSTOMER TABLES:\n');
  
  const userTables = ['customers', 'customer_profiles', 'user_profiles', 'profiles'];
  
  for (const table of userTables) {
    if (existingTables.includes(table)) {
      console.log(`\n✅ ${table} table exists`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (!error && data) {
        console.log(`   📊 Sample data (${data.length} rows):`);
        data.forEach((row, i) => {
          console.log(`   ${i + 1}. Columns: ${Object.keys(row).join(', ')}`);
        });
        
        // Check for preferred_branch_id
        if (data.length > 0) {
          const hasPreferredBranch = 'preferred_branch_id' in data[0];
          if (hasPreferredBranch) {
            console.log(`   ✅ Has preferred_branch_id column`);
          } else {
            console.log(`   ❌ Missing preferred_branch_id column`);
          }
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n');
}

analyzeSchema()
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
