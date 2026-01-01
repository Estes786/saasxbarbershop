const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getDetailedSchema() {
  console.log('🔍 GETTING DETAILED SCHEMA INFORMATION...\n');
  
  const tables = [
    'user_profiles',
    'barbershop_profiles', 
    'barbershop_customers',
    'capsters',
    'service_catalog',
    'bookings',
    'barbershop_transactions'
  ];
  
  for (const tableName of tables) {
    console.log(`\n📊 TABLE: ${tableName}`);
    console.log('═'.repeat(70));
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const sample = data[0];
      console.log('\n📋 Columns and Sample Data:');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`  • ${key}: ${type} = ${JSON.stringify(value)?.substring(0, 50) || 'null'}`);
      });
    } else if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log('⚠️ Table exists but has no data yet');
      
      // Try to get at least column info by attempting insert (will fail but show columns)
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({});
      
      if (insertError) {
        console.log(`Column hints from error: ${insertError.message.substring(0, 200)}`);
      }
    }
  }
  
  // Check specific relationships
  console.log('\n\n🔗 CHECKING EXISTING RELATIONSHIPS...\n');
  
  // Check if barbershop_profiles exists and its structure
  const { data: profiles } = await supabase
    .from('barbershop_profiles')
    .select('*')
    .limit(1);
  
  if (profiles && profiles.length > 0) {
    console.log('✅ barbershop_profiles table exists with columns:');
    console.log('   ', Object.keys(profiles[0]).join(', '));
  }
  
  // Check capsters for any existing barbershop linkage
  const { data: capsters } = await supabase
    .from('capsters')
    .select('*')
    .limit(1);
  
  if (capsters && capsters.length > 0) {
    console.log('\n✅ capsters table structure:');
    console.log('   ', Object.keys(capsters[0]).join(', '));
    
    const locationRelated = Object.keys(capsters[0]).filter(k => 
      k.includes('barbershop') || k.includes('branch') || k.includes('location')
    );
    
    if (locationRelated.length > 0) {
      console.log('   🏢 Location-related fields:', locationRelated.join(', '));
    }
  }
}

getDetailedSchema().then(() => {
  console.log('\n\n✅ Detailed schema analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
