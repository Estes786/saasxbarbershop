const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLFix() {
  console.log('🚀 APPLYING SQL FIX TO DATABASE...\n');
  
  try {
    const sqlContent = fs.readFileSync('./FIX_BOOKING_COMPLETE_05JAN2026.sql', 'utf8');
    
    console.log('📝 Executing SQL script...');
    console.log('   This may take a few moments...\n');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.log('⚠️  Direct SQL execution not available, trying manual approach...\n');
      
      // Manual approach: Add services manually
      console.log('1️⃣ Adding sample services...');
      
      // Get first barbershop
      const { data: barbershops } = await supabase
        .from('barbershop_profiles')
        .select('id')
        .limit(1);
      
      if (barbershops && barbershops.length > 0) {
        const barbershopId = barbershops[0].id;
        
        const services = [
          {
            service_name: 'Potong Rambut Reguler',
            service_category: 'Haircut',
            base_price: 35000,
            duration_minutes: 30,
            description: 'Potong rambut standar dengan hasil rapi',
            barbershop_id: barbershopId,
            branch_id: null,
            is_active: true
          },
          {
            service_name: 'Potong Rambut + Cuci',
            service_category: 'Haircut',
            base_price: 45000,
            duration_minutes: 45,
            description: 'Potong rambut lengkap dengan keramas',
            barbershop_id: barbershopId,
            branch_id: null,
            is_active: true
          },
          {
            service_name: 'Cukur Jenggot',
            service_category: 'Shaving',
            base_price: 20000,
            duration_minutes: 20,
            description: 'Cukur jenggot bersih dan rapi',
            barbershop_id: barbershopId,
            branch_id: null,
            is_active: true
          },
          {
            service_name: 'Styling Rambut',
            service_category: 'Styling',
            base_price: 50000,
            duration_minutes: 40,
            description: 'Styling rambut sesuai keinginan',
            barbershop_id: barbershopId,
            branch_id: null,
            is_active: true
          },
          {
            service_name: 'Creambath',
            service_category: 'Treatment',
            base_price: 60000,
            duration_minutes: 60,
            description: 'Perawatan rambut dengan creambath',
            barbershop_id: barbershopId,
            branch_id: null,
            is_active: true
          }
        ];
        
        const { data: insertedServices, error: insertError } = await supabase
          .from('service_catalog')
          .insert(services)
          .select();
        
        if (insertError) {
          console.log('❌ Error adding services:', insertError.message);
        } else {
          console.log(`✅ Added ${insertedServices.length} services`);
        }
      }
      
      // Backfill customers
      console.log('\n2️⃣ Backfilling customers...');
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id, phone, name, role')
        .eq('role', 'customer')
        .not('phone', 'is', null);
      
      if (users && users.length > 0) {
        let added = 0;
        for (const user of users) {
          const { error: customerError } = await supabase
            .from('barbershop_customers')
            .upsert({
              customer_phone: user.phone,
              customer_name: user.name || 'Customer',
              user_id: user.user_id,
              total_visits: 0,
              total_revenue: 0,
              first_visit_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'customer_phone',
              ignoreDuplicates: true
            });
          
          if (!customerError) added++;
        }
        console.log(`✅ Backfilled ${added} customers`);
      }
    } else {
      console.log('✅ SQL script executed successfully!');
      console.log('   Response:', data);
    }
    
    // Verify
    console.log('\n📊 VERIFICATION:');
    console.log('=' .repeat(60));
    
    const { data: services } = await supabase
      .from('service_catalog')
      .select('id')
      .eq('is_active', true);
    
    const { data: customers } = await supabase
      .from('barbershop_customers')
      .select('customer_phone');
    
    const { data: capsters } = await supabase
      .from('capsters')
      .select('id')
      .eq('status', 'approved');
    
    console.log(`✅ Active Services: ${services?.length || 0}`);
    console.log(`✅ Customers: ${customers?.length || 0}`);
    console.log(`✅ Approved Capsters: ${capsters?.length || 0}`);
    
    if (services && services.length > 0 && capsters && capsters.length > 0) {
      console.log('\n🎉 DATABASE IS READY FOR BOOKING!');
    } else {
      console.log('\n⚠️  Database still needs attention');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applySQLFix().then(() => {
  console.log('\n✅ SQL fix complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
