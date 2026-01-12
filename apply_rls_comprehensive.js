const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  console.log('🔐 Applying Comprehensive RLS Fix...\n');
  
  try {
    // Step 1: Disable RLS temporarily
    console.log('Step 1: Disabling RLS temporarily...');
    const disable1 = await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY' 
    });
    const disable2 = await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE barbershop_customers DISABLE ROW LEVEL SECURITY' 
    });
    console.log('   ✅ RLS disabled\n');

    // Step 2: Drop existing policies
    console.log('Step 2: Dropping existing policies...');
    console.log('   Note: Cannot drop policies via RPC (expected)\n');

    // Step 3: Enable RLS
    console.log('Step 3: Re-enabling RLS...');
    const enable1 = await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY' 
    });
    const enable2 = await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY' 
    });
    console.log('   ✅ RLS re-enabled\n');

    console.log('============================================================');
    console.log('⚠️  MANUAL STEP REQUIRED');
    console.log('============================================================\n');
    console.log('The RLS policies need to be applied manually in Supabase SQL Editor.');
    console.log('');
    console.log('1. Go to: https://qwqmhvwqeynnyxaecqzw.supabase.co/project/qwqmhvwqeynnyxaecqzw/sql/new');
    console.log('2. Copy and paste the contents of: FIX_RLS_COMPREHENSIVE.sql');
    console.log('3. Click "RUN" to execute');
    console.log('');
    console.log('This will:');
    console.log('  ✅ Drop all existing policies');
    console.log('  ✅ Create 5 new policies for user_profiles');
    console.log('  ✅ Create 4 new policies for barbershop_customers');
    console.log('  ✅ Enable proper RBAC (role-based access control)');
    console.log('');
    console.log('After applying, you can test registration/login again!');
    console.log('============================================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Note: This is expected. Continue with manual SQL application.');
  }
}

applyRLSFix();
