#!/usr/bin/env node
/**
 * APPLY ONBOARDING FIX - DIRECT METHOD
 * 
 * This script applies the SQL fix directly using Supabase REST API
 * by executing individual SQL statements.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function applyFix() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ONBOARDING FIX - MANUAL APPLICATION REQUIRED    ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const sqlFile = path.join(__dirname, 'ONBOARDING_FIX_ULTIMATE_FINAL_31DEC2025.sql');
  
  console.log('📋 INSTRUKSI LENGKAP (BAHASA INDONESIA):\n');
  console.log('═'.repeat(60));
  console.log('\n🎯 LANGKAH 1: Buka Supabase Dashboard');
  console.log('   URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw\n');
  
  console.log('🎯 LANGKAH 2: Buka SQL Editor');
  console.log('   - Klik "SQL Editor" di sidebar kiri');
  console.log('   - Klik "New Query"\n');
  
  console.log('🎯 LANGKAH 3: Copy SQL Script');
  console.log('   File location:');
  console.log('   ' + sqlFile);
  console.log('\n   Atau copy dari bawah ini:\n');
  console.log('═'.repeat(60));
  
  // Read and display SQL
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('\n[SQL SCRIPT START]\n');
  console.log(sqlContent);
  console.log('\n[SQL SCRIPT END]\n');
  
  console.log('═'.repeat(60));
  console.log('\n🎯 LANGKAH 4: Run Script');
  console.log('   - Paste script ke SQL Editor');
  console.log('   - Klik "Run" atau tekan Ctrl/Cmd + Enter\n');
  
  console.log('🎯 LANGKAH 5: Verifikasi Success');
  console.log('   Jika berhasil, Anda akan melihat pesan:');
  console.log('   "✓ ONBOARDING FIX COMPLETED SUCCESSFULLY!"\n');
  
  console.log('═'.repeat(60));
  console.log('\n💡 KENAPA ERROR TERJADI?\n');
  console.log('   Error yang Anda alami:');
  console.log('   "column "barbershop_id" of relation "service_catalog" does not exist"\n');
  console.log('   Artinya: Tabel service_catalog tidak punya kolom barbershop_id.\n');
  console.log('   Fix ini akan:');
  console.log('   ✓ Tambahkan kolom barbershop_id ke service_catalog');
  console.log('   ✓ Fix foreign key constraints');
  console.log('   ✓ Fix capsters table structure');
  console.log('   ✓ Tambahkan RLS policies');
  console.log('   ✓ Create helper functions\n');
  
  console.log('═'.repeat(60));
  console.log('\n🚦 SETELAH APPLY:');
  console.log('   1. Test onboarding: https://saasxbarbershop.vercel.app/onboarding');
  console.log('   2. Register barbershop baru');
  console.log('   3. Tambah capster');
  console.log('   4. Tambah service');
  console.log('   5. Lihat access keys yang dibuat\n');
  
  console.log('═'.repeat(60));
  console.log('\n⚠️  PENTING:');
  console.log('   - Script ini IDEMPOTENT (aman dijalankan berulang kali)');
  console.log('   - Tidak akan menghapus data yang sudah ada');
  console.log('   - Hanya menambah kolom dan constraint yang missing\n');
  
  console.log('═'.repeat(60));
  console.log('\n📧 Jika masih error setelah apply:');
  console.log('   - Screenshot error message');
  console.log('   - Share ke saya untuk debugging\n');
  
  console.log('═'.repeat(60));
  console.log('\n✅ SQL file telah disiapkan di:');
  console.log('   ' + sqlFile);
  console.log('\n   Silakan apply manual via Supabase Dashboard.\n');
}

applyFix().catch(console.error);
