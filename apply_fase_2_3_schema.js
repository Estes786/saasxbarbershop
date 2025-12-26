#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://qwqmhvwqeynnyxaecqzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath) {
  console.log('\n🚀 Starting FASE 2 & 3 Database Enhancement...\n');
  
  try {
    // Read SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split into individual statements (simple approach)
    // This is a basic split - for production, use a proper SQL parser
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.log(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}\n`);
    
    if (errorCount === 0) {
      console.log('🎉 FASE 2 & 3 Database Enhancement completed successfully!\n');
    } else {
      console.log('⚠️  Some errors occurred. Please check the output above.\n');
    }
    
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

// Main execution
const sqlFilePath = path.join(__dirname, 'uploaded_files', 'FASE_2_3_DATABASE_ENHANCEMENT.sql');
executeSQLFile(sqlFilePath);
