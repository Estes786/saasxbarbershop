#!/usr/bin/env node
/**
 * 🔍 COMPREHENSIVE BOOKING ANALYSIS
 * Date: 2026-01-07
 * 
 * Tujuan: Analisis mendalam masalah booking online
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeBookingIssue() {
  console.log('🔍 ANALISIS MENDALAM MASALAH BOOKING ONLINE\n');
  console.log('='.repeat(70) + '\n');
  
  try {
    // 1. Check customer3test@gmail.com
    console.log('1️⃣ Mengecek user customer3test@gmail.com...\n');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error getting auth users:', authError.message);
    } else {
      const customer3 = authUsers.users.find(u => u.email === 'customer3test@gmail.com');
      if (customer3) {
        console.log('✅ User ditemukan di auth.users:');
        console.log(`   - User ID: ${customer3.id}`);
        console.log(`   - Email: ${customer3.email}`);
        console.log(`   - Phone (metadata): ${customer3.user_metadata?.phone || 'undefined'}`);
        console.log(`   - Created: ${customer3.created_at}`);
        console.log('');
        
        // Check barbershop_customers
        const { data: customer, error: custError } = await supabase
          .from('barbershop_customers')
          .select('*')
          .eq('user_id', customer3.id)
          .single();
        
        if (custError) {
          console.log('❌ Customer TIDAK ADA di barbershop_customers!');
          console.log(`   Error: ${custError.message}`);
        } else if (customer) {
          console.log('✅ Customer record found:');
          console.log(`   - Customer Phone: ${customer.customer_phone}`);
          console.log(`   - Customer Name: ${customer.customer_name}`);
          console.log(`   - Total Visits: ${customer.total_visits}`);
          console.log('');
          
          // Check bookings dengan phone customer
          const { data: bookings, error: bookError } = await supabase
            .from('bookings')
            .select('*')
            .eq('customer_phone', customer.customer_phone)
            .order('created_at', { ascending: false });
          
          if (bookError) {
            console.log('❌ Error checking bookings:', bookError.message);
          } else {
            console.log(`📋 Bookings untuk phone ${customer.customer_phone}: ${bookings?.length || 0}`);
            if (bookings && bookings.length > 0) {
              console.log('\nSample booking:');
              console.log(JSON.stringify(bookings[0], null, 2));
            }
          }
        }
        
        // Also check dengan phone variants
        console.log('\n2️⃣ Mengecek phone variants...\n');
        const phoneVariants = [
          '0852336988523',
          '+62852336988523',
          '62852336988523',
          '+628123456789',
          '08123456789'
        ];
        
        for (const phone of phoneVariants) {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('customer_phone', phone);
          
          if (bookings && bookings.length > 0) {
            console.log(`   ✅ ${phone}: ${bookings.length} bookings`);
          }
        }
      } else {
        console.log('❌ User customer3test@gmail.com TIDAK DITEMUKAN!');
      }
    }
    
    // 2. Check services
    console.log('\n3️⃣ Mengecek services...\n');
    const { data: services, error: svcError } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('is_active', true);
    
    if (svcError) {
      console.log('❌ Error:', svcError.message);
    } else {
      console.log(`✅ Services available: ${services?.length || 0}`);
      if (services && services.length > 0) {
        console.log('\nSample services:');
        services.slice(0, 3).forEach(s => {
          console.log(`   - ${s.service_name}: Rp ${s.base_price} (${s.duration_minutes} menit)`);
        });
      }
    }
    
    // 3. Check capsters
    console.log('\n4️⃣ Mengecek capsters...\n');
    const { data: capsters, error: capError } = await supabase
      .from('capsters')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true);
    
    if (capError) {
      console.log('❌ Error:', capError.message);
    } else {
      console.log(`✅ Capsters approved: ${capsters?.length || 0}`);
      
      // Check berapa yang punya branch
      const withBranch = capsters?.filter(c => c.branch_id) || [];
      const withoutBranch = capsters?.filter(c => !c.branch_id) || [];
      console.log(`   - Dengan branch: ${withBranch.length}`);
      console.log(`   - Tanpa branch: ${withoutBranch.length}`);
    }
    
    // 4. Check total bookings
    console.log('\n5️⃣ Mengecek total bookings...\n');
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error:', countError.message);
    } else {
      console.log(`✅ Total bookings di database: ${count || 0}`);
    }
    
    // 5. Performance check - check indexes
    console.log('\n6️⃣ Mengecek database indexes...\n');
    const { data: indexes, error: idxError } = await supabase
      .rpc('get_indexes', {});
    
    if (idxError) {
      console.log('⚠️ Tidak bisa check indexes (function mungkin belum ada)');
    } else if (indexes) {
      console.log('✅ Indexes ditemukan:');
      console.log(indexes);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 KESIMPULAN ANALISIS:\n');
    
    console.log('Berdasarkan analisis di atas, kita bisa identifikasi:');
    console.log('1. Apakah customer3test@gmail.com ada di database');
    console.log('2. Apakah ada mismatch phone number');
    console.log('3. Apakah services dan capsters tersedia');
    console.log('4. Apakah bookings bisa dibuat');
    console.log('5. Apakah ada masalah performance (indexes)');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

// Run analysis
analyzeBookingIssue()
  .then(() => {
    console.log('\n✅ Analisis selesai!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analisis gagal:', error.message);
    process.exit(1);
  });
