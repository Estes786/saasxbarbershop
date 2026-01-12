#!/usr/bin/env node

const SUPABASE_URL = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate entries...\n');
  
  try {
    // Get all service_catalog entries
    console.log('📋 Fetching service_catalog...');
    const servicesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/service_catalog?select=*&order=created_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (!servicesResp.ok) {
      console.error('❌ Failed to fetch service_catalog');
      return;
    }
    
    const services = await servicesResp.json();
    console.log(`  Found ${services.length} services`);
    
    // Group by service_name to find duplicates
    const serviceGroups = {};
    services.forEach(service => {
      if (!serviceGroups[service.service_name]) {
        serviceGroups[service.service_name] = [];
      }
      serviceGroups[service.service_name].push(service);
    });
    
    // Keep oldest, delete newer duplicates
    for (const [name, group] of Object.entries(serviceGroups)) {
      if (group.length > 1) {
        console.log(`\n  🔍 Found ${group.length} duplicates for "${name}"`);
        // Keep first (oldest), delete rest
        const toDelete = group.slice(1);
        for (const service of toDelete) {
          console.log(`    ❌ Deleting duplicate: ${service.id}`);
          const deleteResp = await fetch(
            `${SUPABASE_URL}/rest/v1/service_catalog?id=eq.${service.id}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          if (deleteResp.ok) {
            console.log(`    ✅ Deleted successfully`);
          } else {
            console.log(`    ⚠️ Failed to delete`);
          }
        }
      }
    }
    
    // Get all capsters
    console.log('\n📋 Fetching capsters...');
    const capstersResp = await fetch(
      `${SUPABASE_URL}/rest/v1/capsters?select=*&order=created_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (!capstersResp.ok) {
      console.error('❌ Failed to fetch capsters');
      return;
    }
    
    const capsters = await capstersResp.json();
    console.log(`  Found ${capsters.length} capsters`);
    
    // Group by capster_name to find duplicates
    const capsterGroups = {};
    capsters.forEach(capster => {
      if (!capsterGroups[capster.capster_name]) {
        capsterGroups[capster.capster_name] = [];
      }
      capsterGroups[capster.capster_name].push(capster);
    });
    
    // Keep oldest, delete newer duplicates
    for (const [name, group] of Object.entries(capsterGroups)) {
      if (group.length > 1) {
        console.log(`\n  🔍 Found ${group.length} duplicates for "${name}"`);
        // Keep first (oldest), delete rest
        const toDelete = group.slice(1);
        for (const capster of toDelete) {
          console.log(`    ❌ Deleting duplicate: ${capster.id}`);
          const deleteResp = await fetch(
            `${SUPABASE_URL}/rest/v1/capsters?id=eq.${capster.id}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          if (deleteResp.ok) {
            console.log(`    ✅ Deleted successfully`);
          } else {
            console.log(`    ⚠️ Failed to delete`);
          }
        }
      }
    }
    
    console.log('\n✨ Cleanup complete!\n');
    
    // Verify final counts
    const finalServicesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/service_catalog?select=count`,
      {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    const finalCapstersResp = await fetch(
      `${SUPABASE_URL}/rest/v1/capsters?select=count`,
      {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    const serviceCount = finalServicesResp.headers.get('content-range')?.split('/')[1] || '0';
    const capsterCount = finalCapstersResp.headers.get('content-range')?.split('/')[1] || '0';
    
    console.log('📊 FINAL COUNTS:');
    console.log(`  ✅ service_catalog: ${serviceCount} rows`);
    console.log(`  ✅ capsters: ${capsterCount} rows\n`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

cleanupDuplicates();
