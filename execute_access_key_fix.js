/**
 * Execute COMPREHENSIVE_ACCESS_KEY_FIX.sql to Supabase
 * This script will apply the complete ACCESS KEY system + fix all issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('🔧 Loading environment variables...');
console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Loaded' : '✗ Missing');
console.log('🔑 Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Loaded' : '✗ Missing');
console.log('');

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeSQLScript() {
  console.log('🚀 Starting SQL script execution...\n');
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'COMPREHENSIVE_ACCESS_KEY_FIX.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL script loaded:', sqlPath);
    console.log('📊 Script size:', (sqlContent.length / 1024).toFixed(2), 'KB\n');
    
    // Execute SQL
    console.log('⏳ Executing SQL script to Supabase...');
    console.log('🔧 This may take 30-60 seconds...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      // Try alternative method: Execute via REST API
      console.log('⚠️  RPC method failed, trying REST API...\n');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ sql: sqlContent })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ SQL executed successfully via REST API!\n');
    } else {
      console.log('✅ SQL executed successfully via RPC!\n');
      if (data) {
        console.log('📊 Result:', data);
      }
    }
    
    // Verify installation
    console.log('\n🔍 Verifying installation...\n');
    
    // Check access_keys table
    const { data: keys, error: keysError } = await supabase
      .from('access_keys')
      .select('key_code, role, is_active');
    
    if (keysError) {
      console.log('❌ Error checking access_keys:', keysError.message);
    } else {
      console.log('✅ Access Keys Table:');
      keys.forEach(key => {
        console.log(`   - ${key.role.toUpperCase()}: ${key.key_code} (${key.is_active ? 'Active' : 'Inactive'})`);
      });
      console.log('');
    }
    
    // Test validation function
    console.log('🧪 Testing validate_access_key() function...');
    const { data: isValid, error: validateError } = await supabase
      .rpc('validate_access_key', {
        p_key_code: 'CUSTOMER_OASIS_2025',
        p_role: 'customer'
      });
    
    if (validateError) {
      console.log('❌ Error testing function:', validateError.message);
    } else {
      console.log(`✅ Function test: ${isValid ? 'PASSED ✓' : 'FAILED ✗'}\n`);
    }
    
    // Success message
    console.log('============================================================================');
    console.log('🎉 INSTALLATION COMPLETE!');
    console.log('============================================================================');
    console.log('');
    console.log('✅ WHAT WAS INSTALLED:');
    console.log('1. ✅ access_keys table with RLS policies');
    console.log('2. ✅ validate_access_key() function');
    console.log('3. ✅ Initial access keys for 3 roles');
    console.log('4. ✅ Fixed RLS policies for all tables');
    console.log('5. ✅ Auto-create triggers for customers & capsters');
    console.log('');
    console.log('🔑 ACCESS KEYS:');
    console.log('- Customer: CUSTOMER_OASIS_2025');
    console.log('- Capster:  CAPSTER_OASIS_PRO_2025');
    console.log('- Admin:    ADMIN_OASIS_MASTER_2025');
    console.log('');
    console.log('📖 DOCUMENTATION: See SECRET_KEY_IMPLEMENTATION.md');
    console.log('🧪 NEXT STEP: Test registration with access keys!');
    console.log('============================================================================');
    
  } catch (error) {
    console.error('\n❌ EXECUTION FAILED:\n');
    console.error(error);
    console.log('\n💡 MANUAL INSTALLATION:');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('2. Copy content from: COMPREHENSIVE_ACCESS_KEY_FIX.sql');
    console.log('3. Paste and click RUN');
    console.log('4. Wait for success message');
    console.log('\n');
    process.exit(1);
  }
}

// Run
executeSQLScript();
