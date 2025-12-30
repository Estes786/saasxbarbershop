/**
 * EXECUTE ONBOARDING FIX USING PG LIBRARY
 * This will directly execute the SQL using PostgreSQL wire protocol
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.qwqmhvwqeynnyxaecqzw:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

// Read SQL script
const sqlScript = fs.readFileSync(
  path.join(__dirname, 'ULTIMATE_ONBOARDING_FIX_CORRECT_SYNTAX.sql'),
  'utf8'
);

console.log('🚀 Starting Ultimate Onboarding Fix via PostgreSQL...\n');
console.log('📋 Script size:', sqlScript.length, 'characters\n');

async function executeFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⏳ Executing migration script...\n');
    
    // Execute the SQL script
    const result = await client.query(sqlScript);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Print notices if any
    if (client._queryable && client._queryable.notices) {
      console.log('📋 NOTICES FROM DATABASE:');
      console.log('=' .repeat(60));
      client._queryable.notices.forEach(notice => {
        console.log(notice.message);
      });
      console.log('=' .repeat(60));
    }
    
    console.log('\n🎉 ALL DONE! Database is now ready for onboarding!\n');
    
    // Verify the fix
    console.log('🔍 Verifying database state...\n');
    
    const checks = [
      {
        name: 'Check if name column exists in capsters',
        query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'capsters' AND column_name IN ('name', 'capster_name', 'barbershop_id')
          ORDER BY column_name
        `
      },
      {
        name: 'Check barbershop_id constraint',
        query: `
          SELECT 
            tc.constraint_name, 
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.table_name = 'capsters' AND kcu.column_name = 'barbershop_id'
        `
      },
      {
        name: 'Check if sync trigger exists',
        query: `
          SELECT trigger_name, event_manipulation, action_timing
          FROM information_schema.triggers
          WHERE trigger_name = 'sync_capster_name_trigger'
        `
      },
      {
        name: 'Check helper functions',
        query: `
          SELECT routine_name, routine_type
          FROM information_schema.routines
          WHERE routine_name IN ('complete_onboarding', 'get_onboarding_status', 'generate_access_key', 'sync_capster_name')
          ORDER BY routine_name
        `
      }
    ];
    
    for (const check of checks) {
      console.log(`📌 ${check.name}:`);
      const result = await client.query(check.query);
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('   (No results - might be expected depending on check)\n');
      }
    }
    
    console.log('✅ Verification complete!\n');
    console.log('🚀 You can now test the onboarding flow at:');
    console.log('   https://saasxbarbershop.vercel.app\n');
    
  } catch (error) {
    console.error('\n❌ ERROR during migration:');
    console.error('=' .repeat(60));
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    if (error.position) {
      console.error('Error Position:', error.position);
      const lines = sqlScript.split('\n');
      const errorLine = parseInt(error.position);
      console.error('Context:');
      console.error(lines.slice(Math.max(0, errorLine - 3), errorLine + 2).join('\n'));
    }
    
    console.error('=' .repeat(60));
    console.error('');
    console.error('💡 TIP: If you see "password authentication failed",');
    console.error('     set the DATABASE_URL environment variable with your password:');
    console.error('');
    console.error('     export DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.qwqmhvwqeynnyxaecqzw.supabase.co:5432/postgres"');
    console.error('     node execute_with_pg.js');
    console.error('');
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database\n');
  }
}

// Run the migration
executeFix().catch(console.error);
