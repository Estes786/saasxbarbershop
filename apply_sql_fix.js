#!/usr/bin/env node

/**
 * APPLY SQL FIX VIA SUPABASE CLI
 * 
 * This script helps apply the FINAL_DATABASE_FIX.sql using Supabase CLI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Applying Database Fix to Supabase...\n');

// Check if Supabase CLI is available
try {
  execSync('npx supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI detected\n');
} catch (error) {
  console.error('❌ Supabase CLI not found');
  console.error('Please install: npm install -D supabase');
  process.exit(1);
}

// Check if SQL file exists
const sqlPath = path.join(__dirname, 'FINAL_DATABASE_FIX.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('❌ FINAL_DATABASE_FIX.sql not found');
  process.exit(1);
}

console.log('📄 SQL File: FINAL_DATABASE_FIX.sql');
console.log('📍 Supabase Project: qwqmhvwqeynnyxaecqzw\n');

console.log('⚠️  IMPORTANT: This requires Supabase access token\n');

// Read access token from file or prompt
let accessToken = '';

if (fs.existsSync('.supabase_access_token')) {
  accessToken = fs.readFileSync('.supabase_access_token', 'utf-8').trim();
  console.log('✅ Using access token from .supabase_access_token\n');
} else {
  console.log('📌 Access token not found in .supabase_access_token');
  console.log('');
  console.log('To get your access token:');
  console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
  console.log('2. Click "Generate new token"');
  console.log('3. Copy and save to .supabase_access_token file');
  console.log('4. Run this script again');
  console.log('');
  console.log('OR apply manually via Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('');
  process.exit(1);
}

// Try to apply SQL using Supabase CLI
console.log('🔧 Applying SQL fix via Supabase CLI...\n');

try {
  // First, link to project
  console.log('🔗 Linking to Supabase project...');
  execSync('npx supabase link --project-ref qwqmhvwqeynnyxaecqzw', {
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });

  console.log('\n📤 Pushing database changes...');
  
  // Execute SQL file
  execSync(`npx supabase db execute --file ${sqlPath}`, {
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });

  console.log('\n✅ SQL fix applied successfully!');
  console.log('\n🔍 Verifying changes...');

  // Verify tables
  const verifySQL = `
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'barbershop_customers', 'capsters')
ORDER BY tablename;
  `.trim();

  execSync(`echo "${verifySQL}" | npx supabase db query`, {
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });

  console.log('\n✅ Database fix complete!');
  console.log('\n📖 Next steps:');
  console.log('1. Configure Google OAuth (see PANDUAN_FIX_LENGKAP.md)');
  console.log('2. Test registration flows');
  console.log('3. Start building FASE 3 features');

} catch (error) {
  console.error('\n❌ Failed to apply SQL via CLI');
  console.error('Error:', error.message);
  console.log('\n⚠️  Alternative: Apply manually via Supabase SQL Editor');
  console.log('📍 URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
  console.log('📄 File: FINAL_DATABASE_FIX.sql');
  console.log('\nCopy-paste the entire SQL content and click RUN');
  process.exit(1);
}
