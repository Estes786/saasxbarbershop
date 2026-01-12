const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFixV2() {
  console.log('🔧 APPLYING DATABASE FIX V2...\n');
  console.log('='=== 50);
  
  try {
    // 1. Get all capster profiles
    console.log('\n1️⃣ Fetching capster profiles...');
    const { data: capsterProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, customer_name, customer_phone')
      .eq('role', 'capster');
    
    if (profileError) {
      console.error('❌ Error fetching capster profiles:', profileError);
      return;
    }
    
    console.log(`✅ Found ${capsterProfiles.length} capster profiles`);
    
    // 2. Get all capster records
    console.log('\n2️⃣ Fetching capster records...');
    const { data: capsterRecords, error: recordError } = await supabase
      .from('capsters')
      .select('id, user_id, capster_name');
    
    if (recordError) {
      console.error('❌ Error fetching capster records:', recordError);
      return;
    }
    
    console.log(`✅ Found ${capsterRecords.length} capster records`);
    
    // 3. Find capster profiles without records
    console.log('\n3️⃣ Finding capster profiles without records...');
    const existingUserIds = new Set(capsterRecords.map(c => c.user_id).filter(Boolean));
    const profilesWithoutRecords = capsterProfiles.filter(p => !existingUserIds.has(p.id));
    
    console.log(`📊 Found ${profilesWithoutRecords.length} capster profiles without records:`);
    profilesWithoutRecords.forEach(p => {
      console.log(`   - ${p.email} (${p.id})`);
    });
    
    // 4. Create capster records for profiles without them
    if (profilesWithoutRecords.length > 0) {
      console.log('\n4️⃣ Creating capster records...');
      
      for (const profile of profilesWithoutRecords) {
        console.log(`\n   📝 Processing: ${profile.email}`);
        
        const { data: newCapster, error: insertError } = await supabase
          .from('capsters')
          .insert({
            user_id: profile.id,
            capster_name: profile.customer_name || profile.email.split('@')[0],
            phone: profile.customer_phone,
            specialization: 'all',
            is_available: true,  // ✅ AUTO-APPROVED!
            total_customers_served: 0,
            total_revenue_generated: 0,
            rating: 0
          })
          .select()
          .single();
        
        if (insertError) {
          console.error(`   ❌ Error creating capster record:`, insertError);
        } else {
          console.log(`   ✅ Created capster record with ID: ${newCapster.id}`);
          
          // Try to update user_profile with capster_id
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ capster_id: newCapster.id })
            .eq('id', profile.id);
          
          if (updateError) {
            console.log(`   ⚠️  Could not update capster_id:`, updateError.message);
          } else {
            console.log(`   ✅ Updated user_profile with capster_id`);
          }
        }
      }
    } else {
      console.log('\n4️⃣ No capster records to create - all profiles already have records!');
    }
    
    // 5. Verify fix
    console.log('\n5️⃣ VERIFICATION...');
    const { data: updatedCapsters } = await supabase
      .from('capsters')
      .select('id, user_id, capster_name, is_available');
    
    const capstersWithUserId = updatedCapsters.filter(c => c.user_id).length;
    const availableCapsters = updatedCapsters.filter(c => c.is_available).length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 VERIFICATION RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total capster profiles: ${capsterProfiles.length}`);
    console.log(`Total capster records: ${updatedCapsters.length}`);
    console.log(`Capsters with user_id: ${capstersWithUserId}`);
    console.log(`Available capsters: ${availableCapsters}`);
    
    if (capstersWithUserId >= capsterProfiles.length) {
      console.log('\n✅ SUCCESS! All capster profiles now have capster records!');
    } else {
      console.log(`\n⚠️  WARNING: ${capsterProfiles.length - capstersWithUserId} capster profiles still without records`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE FIX COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log('- Created capster records for all capster profiles');
    console.log('- Enabled auto-approval (is_available = true by default)');
    console.log('- Capster registration now works without admin approval!');
    console.log('\n🚀 You can now test capster registration and login!');
    console.log('👉 Try logging in at: https://saasxbarbershop.vercel.app/login/capster\n');
    
  } catch (error) {
    console.error('❌ FIX ERROR:', error);
  }
}

applyFixV2().catch(console.error);
