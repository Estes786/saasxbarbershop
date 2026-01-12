const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwqmhvwqeynnyxaecqzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk'
);

async function fixCapsters() {
  console.log('🔧 Fixing capster approval status...\n');

  // Get all capsters
  const { data: capsters, error: fetchError } = await supabase
    .from('capsters')
    .select('id, capster_name, status');

  if (fetchError) {
    console.error('❌ Error fetching capsters:', fetchError);
    return;
  }

  console.log(`Found ${capsters.length} capsters`);
  console.log('Current status distribution:');
  console.log('  - Approved:', capsters.filter(c => c.status === 'approved').length);
  console.log('  - Pending:', capsters.filter(c => c.status === 'pending').length);
  console.log('  - Rejected:', capsters.filter(c => c.status === 'rejected').length);

  // Update all pending capsters to approved
  const { data: updated, error: updateError } = await supabase
    .from('capsters')
    .update({ status: 'approved' })
    .eq('status', 'pending')
    .select();

  if (updateError) {
    console.error('❌ Error updating capsters:', updateError);
    return;
  }

  console.log(`\n✅ Successfully approved ${updated.length} capsters!`);
  console.log('Sample approved capsters:');
  updated.slice(0, 5).forEach(c => {
    console.log(`   - ${c.capster_name} (${c.id})`);
  });
}

fixCapsters().catch(console.error);
