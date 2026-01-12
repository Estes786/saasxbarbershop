const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deploySchema() {
  console.log('🚀 Starting database schema deployment...\n');
  
  try {
    // Read SQL file
    const sqlFile = path.join(__dirname, 'DEPLOY_TO_SUPABASE.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log(`📊 File size: ${sqlContent.length} characters\n`);
    
    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`📄 Preview: ${statement.substring(0, 100)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Try alternative method - direct query
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });
          
          if (!response.ok) {
            console.log(`⚠️  Statement ${i + 1} may have issues (continuing...)`);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  Error on statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n========================================');
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('========================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Errors: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    console.log('========================================\n');
    
    if (errorCount === 0) {
      console.log('🎉 Database schema deployed successfully!');
    } else {
      console.log('⚠️  Deployment completed with some warnings.');
      console.log('💡 Please verify your database schema in Supabase dashboard.');
    }
    
    console.log('\n📍 Next steps:');
    console.log('1. Verify tables in Supabase Dashboard > Table Editor');
    console.log('2. Check RLS policies in Authentication > Policies');
    console.log('3. Enable Google OAuth in Authentication > Providers');
    console.log('4. Run: npm run build && npm run dev\n');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deploySchema();
