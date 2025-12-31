#!/usr/bin/env node

/**
 * Script untuk menganalisis ACTUAL database schema di Supabase
 * Ini akan menunjukkan tabel apa saja yang ada dan struktur kolomnya
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL atau SERVICE_ROLE_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING SUPABASE DATABASE SCHEMA...\n');
  console.log('=' .repeat(80));

  try {
    // Query untuk mendapatkan semua tabel
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      // Fallback: coba query langsung dengan rpc
      console.log('⚠️  Tidak bisa akses information_schema, mencoba metode alternatif...\n');
      
      // Coba akses tabel satu per satu yang kita expect
      const expectedTables = [
        'auth_users',
        'user_profiles',
        'barbershop_profiles',
        'capsters',
        'customers',
        'service_catalog',
        'bookings',
        'access_keys'
      ];

      console.log('📊 CHECKING EXPECTED TABLES:\n');

      for (const tableName of expectedTables) {
        try {
          // Coba query tabel untuk cek apakah ada
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) {
            if (error.code === '42P01') {
              console.log(`❌ Table "${tableName}" DOES NOT EXIST`);
            } else {
              console.log(`⚠️  Table "${tableName}" - Error: ${error.message}`);
            }
          } else {
            console.log(`✅ Table "${tableName}" EXISTS (${count || 0} rows)`);
            
            // Coba ambil 1 row untuk lihat struktur
            const { data: sampleData } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);

            if (sampleData && sampleData.length > 0) {
              const columns = Object.keys(sampleData[0]);
              console.log(`   Columns: ${columns.join(', ')}`);
            } else {
              // Coba ambil informasi kolom dari API
              console.log(`   (Table kosong, tidak bisa mendapatkan info kolom)`);
            }
          }
        } catch (err) {
          console.log(`❌ Table "${tableName}" - Error: ${err.message}`);
        }
        console.log('');
      }

      // Cek spesifik untuk service_catalog dan barbershop_id
      console.log('=' .repeat(80));
      console.log('\n🔬 DETAILED CHECK: service_catalog table\n');

      const { data: serviceCatalog, error: scError } = await supabase
        .from('service_catalog')
        .select('*')
        .limit(1);

      if (scError) {
        console.log(`❌ ERROR accessing service_catalog:`);
        console.log(`   Code: ${scError.code}`);
        console.log(`   Message: ${scError.message}`);
        console.log(`   Details: ${scError.details || 'N/A'}`);
        console.log(`   Hint: ${scError.hint || 'N/A'}`);
      } else {
        if (serviceCatalog && serviceCatalog.length > 0) {
          const columns = Object.keys(serviceCatalog[0]);
          console.log(`✅ service_catalog columns found:`);
          columns.forEach(col => {
            console.log(`   - ${col}: ${typeof serviceCatalog[0][col]}`);
          });

          if (columns.includes('barbershop_id')) {
            console.log(`\n✅ Column "barbershop_id" EXISTS in service_catalog`);
          } else {
            console.log(`\n❌ Column "barbershop_id" DOES NOT EXIST in service_catalog`);
            console.log(`   Available columns: ${columns.join(', ')}`);
          }
        } else {
          console.log(`⚠️  service_catalog table is empty, cannot determine columns`);
        }
      }

      // Cek barbershop_profiles
      console.log('\n' + '=' .repeat(80));
      console.log('\n🔬 DETAILED CHECK: barbershop_profiles table\n');

      const { data: barbershopProfiles, error: bpError } = await supabase
        .from('barbershop_profiles')
        .select('*')
        .limit(1);

      if (bpError) {
        console.log(`❌ ERROR accessing barbershop_profiles:`);
        console.log(`   Code: ${bpError.code}`);
        console.log(`   Message: ${bpError.message}`);
      } else {
        if (barbershopProfiles && barbershopProfiles.length > 0) {
          const columns = Object.keys(barbershopProfiles[0]);
          console.log(`✅ barbershop_profiles columns found:`);
          columns.forEach(col => {
            console.log(`   - ${col}: ${typeof barbershopProfiles[0][col]}`);
          });
        } else {
          console.log(`⚠️  barbershop_profiles table is empty`);
        }
      }

      // Cek capsters
      console.log('\n' + '=' .repeat(80));
      console.log('\n🔬 DETAILED CHECK: capsters table\n');

      const { data: capsters, error: capError } = await supabase
        .from('capsters')
        .select('*')
        .limit(1);

      if (capError) {
        console.log(`❌ ERROR accessing capsters:`);
        console.log(`   Code: ${capError.code}`);
        console.log(`   Message: ${capError.message}`);
      } else {
        if (capsters && capsters.length > 0) {
          const columns = Object.keys(capsters[0]);
          console.log(`✅ capsters columns found:`);
          columns.forEach(col => {
            console.log(`   - ${col}: ${typeof capsters[0][col]}`);
          });

          if (columns.includes('name')) {
            console.log(`\n✅ Column "name" EXISTS in capsters`);
          } else {
            console.log(`\n❌ Column "name" DOES NOT EXIST in capsters`);
            console.log(`   Available columns: ${columns.join(', ')}`);
          }
        } else {
          console.log(`⚠️  capsters table is empty`);
        }
      }

    } else {
      console.log(`✅ Found ${tables.length} tables in public schema\n`);
      
      // Analisis setiap tabel
      for (const table of tables) {
        await analyzeTable(table.table_name);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ DATABASE ANALYSIS COMPLETE\n');

  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
    process.exit(1);
  }
}

async function analyzeTable(tableName) {
  console.log(`\n📋 Table: ${tableName}`);
  console.log('-'.repeat(80));

  try {
    // Get table structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`   Columns (${columns.length}):`);
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
    } else {
      console.log(`   ⚠️  Table is empty`);
    }

    // Get row count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`   📊 Total rows: ${count || 0}`);

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Run analysis
analyzeDatabase();
