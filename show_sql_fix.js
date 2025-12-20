#!/usr/bin/env node

/**
 * This script provides the SQL command that you need to run in Supabase SQL Editor
 * It reads the fix_rls_comprehensive.sql file and displays it
 */

const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'fix_rls_comprehensive.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   📋 SQL SCRIPT TO RUN IN SUPABASE SQL EDITOR');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new');
console.log('2. Copy the SQL below and paste it into the SQL Editor');
console.log('3. Click "Run" to execute\n');
console.log('─────────────────────────────────────────────────────────────────\n');
console.log(sql);
console.log('\n─────────────────────────────────────────────────────────────────\n');
console.log('✅ After running this in Supabase SQL Editor, authentication should work!');
console.log('\n═══════════════════════════════════════════════════════════════\n');

// Also save to a separate clean file for easy copy
const cleanSqlPath = path.join(__dirname, 'RUN_IN_SUPABASE_SQL_EDITOR.sql');
fs.writeFileSync(cleanSqlPath, sql);
console.log(`📄 SQL also saved to: ${cleanSqlPath}`);
console.log('   You can open this file and copy-paste its contents to Supabase SQL Editor\n');
