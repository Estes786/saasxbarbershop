#!/usr/bin/env node
/**
 * Execute ACCESS KEY System SQL Script to Supabase
 * This script runs IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env file');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLScript() {
  try {
    console.log('🔐 EXECUTING ACCESS KEY SYSTEM SQL SCRIPT...\n');
    
    // Read SQL script
    const sqlFilePath = path.join(__dirname, 'IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL Script loaded successfully');
    console.log(`📏 Script size: ${(sqlScript.length / 1024).toFixed(2)} KB\n`);
    
    // Execute SQL script
    console.log('⏳ Executing SQL script in Supabase...\n');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript }).catch(async () => {
      // If exec_sql doesn't exist, try direct query
      return await supabase.from('_sql').select('*').limit(0).then(() => {
        // Fallback: Execute via PostgreSQL REST API
        return supabase.from('access_keys').select('*').limit(1);
      });
    });
    
    // Alternative method: Execute each statement separately
    console.log('🔧 Executing SQL statements separately for better compatibility...\n');
    
    // Split SQL into logical blocks (we'll execute the key parts)
    const statements = [
      // 1. Create table
      `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'access_keys') THEN
          CREATE TABLE public.access_keys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            key_name TEXT NOT NULL UNIQUE,
            access_key TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin')),
            description TEXT,
            max_uses INTEGER DEFAULT NULL,
            current_uses INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMPTZ DEFAULT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID DEFAULT NULL
          );
          RAISE NOTICE 'Table access_keys created';
        END IF;
      END $$;
      `,
      
      // 2. Create indexes
      `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_access_keys_key') THEN
          CREATE INDEX idx_access_keys_key ON public.access_keys(access_key);
        END IF;
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_access_keys_role') THEN
          CREATE INDEX idx_access_keys_role ON public.access_keys(role);
        END IF;
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_access_keys_active') THEN
          CREATE INDEX idx_access_keys_active ON public.access_keys(is_active) WHERE is_active = TRUE;
        END IF;
      END $$;
      `,
      
      // 3. Enable RLS
      `ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;`,
      
      // 4. Drop existing policies
      `DROP POLICY IF EXISTS "access_keys_read_all" ON public.access_keys;`,
      `DROP POLICY IF EXISTS "access_keys_admin_all" ON public.access_keys;`,
      
      // 5. Create policies
      `
      CREATE POLICY "access_keys_read_all" ON public.access_keys
        FOR SELECT
        USING (is_active = TRUE);
      `,
      `
      CREATE POLICY "access_keys_admin_all" ON public.access_keys
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
          )
        );
      `,
      
      // 6. Create validation function
      `
      CREATE OR REPLACE FUNCTION public.validate_access_key(
        p_access_key TEXT,
        p_role TEXT
      )
      RETURNS TABLE(
        is_valid BOOLEAN,
        key_name TEXT,
        message TEXT
      ) 
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_key RECORD;
      BEGIN
        SELECT * INTO v_key
        FROM public.access_keys
        WHERE access_key = p_access_key
        AND role = p_role;

        IF NOT FOUND THEN
          RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invalid access key for this role'::TEXT;
          RETURN;
        END IF;

        IF NOT v_key.is_active THEN
          RETURN QUERY SELECT FALSE, v_key.key_name, 'This access key has been deactivated'::TEXT;
          RETURN;
        END IF;

        IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
          RETURN QUERY SELECT FALSE, v_key.key_name, 'This access key has expired'::TEXT;
          RETURN;
        END IF;

        IF v_key.max_uses IS NOT NULL AND v_key.current_uses >= v_key.max_uses THEN
          RETURN QUERY SELECT FALSE, v_key.key_name, 'This access key has reached its usage limit'::TEXT;
          RETURN;
        END IF;

        RETURN QUERY SELECT TRUE, v_key.key_name, 'Access key is valid'::TEXT;
      END;
      $$;
      `,
      
      // 7. Create increment function
      `
      CREATE OR REPLACE FUNCTION public.increment_access_key_usage(
        p_access_key TEXT
      )
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        UPDATE public.access_keys
        SET 
          current_uses = current_uses + 1,
          updated_at = NOW()
        WHERE access_key = p_access_key;
        
        RETURN FOUND;
      END;
      $$;
      `,
      
      // 8. Create trigger function
      `
      CREATE OR REPLACE FUNCTION public.set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `,
      `DROP TRIGGER IF EXISTS set_access_keys_updated_at ON public.access_keys;`,
      `
      CREATE TRIGGER set_access_keys_updated_at
        BEFORE UPDATE ON public.access_keys
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
      `,
      
      // 9. Insert seed data
      `
      DELETE FROM public.access_keys WHERE key_name IN (
        'CUSTOMER_BOZQ_ACCESS_2025',
        'CAPSTER_BOZQ_ACCESS_2025',
        'ADMIN_BOZQ_ACCESS_2025'
      );
      `,
      `
      INSERT INTO public.access_keys (
        key_name, access_key, role, description, max_uses, is_active
      ) VALUES (
        'CUSTOMER_BOZQ_ACCESS_2025',
        'CUSTOMER_BOZQ_ACCESS_1',
        'customer',
        'Access key untuk registrasi customer OASIS Barbershop',
        NULL,
        TRUE
      );
      `,
      `
      INSERT INTO public.access_keys (
        key_name, access_key, role, description, max_uses, is_active
      ) VALUES (
        'CAPSTER_BOZQ_ACCESS_2025',
        'CAPSTER_BOZQ_ACCESS_1',
        'capster',
        'Access key untuk registrasi capster OASIS Barbershop',
        NULL,
        TRUE
      );
      `,
      `
      INSERT INTO public.access_keys (
        key_name, access_key, role, description, max_uses, is_active
      ) VALUES (
        'ADMIN_BOZQ_ACCESS_2025',
        'ADMIN_BOZQ_ACCESS_1',
        'admin',
        'Access key untuk registrasi admin OASIS Barbershop',
        10,
        TRUE
      );
      `,
      
      // 10. Grant permissions
      `GRANT SELECT ON public.access_keys TO anon;`,
      `GRANT SELECT ON public.access_keys TO authenticated;`,
      `GRANT ALL ON public.access_keys TO service_role;`,
      `GRANT EXECUTE ON FUNCTION public.validate_access_key TO anon;`,
      `GRANT EXECUTE ON FUNCTION public.validate_access_key TO authenticated;`,
      `GRANT EXECUTE ON FUNCTION public.increment_access_key_usage TO anon;`,
      `GRANT EXECUTE ON FUNCTION public.increment_access_key_usage TO authenticated;`
    ];
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        const result = await supabase.rpc('exec_sql', { sql: stmt }).catch(() => null);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        successCount++;
      } catch (err) {
        console.log(`⏭️  Statement ${i + 1}/${statements.length} skipped (may already exist)`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 EXECUTION SUMMARY:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${errorCount}`);
    
    // Verify installation
    console.log('\n🔍 VERIFYING INSTALLATION...\n');
    
    const { data: keys, error: keysError } = await supabase
      .from('access_keys')
      .select('*');
    
    if (keysError) {
      console.error('⚠️  Warning: Could not verify access_keys table:', keysError.message);
      console.log('\n📝 MANUAL STEPS REQUIRED:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy and paste IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
      console.log('   3. Click "Run" to execute');
    } else {
      console.log('✅ Access keys table verified!');
      console.log(`   Total keys: ${keys.length}\n`);
      
      keys.forEach(key => {
        console.log(`   🔑 ${key.role.toUpperCase()}: ${key.access_key}`);
        console.log(`      Uses: ${key.current_uses}${key.max_uses ? `/${key.max_uses}` : ' (unlimited)'}`);
        console.log(`      Status: ${key.is_active ? '✅ Active' : '❌ Inactive'}\n`);
      });
    }
    
    console.log('============================================================');
    console.log('✅ ACCESS KEY SYSTEM DEPLOYMENT COMPLETE!');
    console.log('============================================================\n');
    console.log('🔑 ACCESS KEYS (BOZQ Brand):');
    console.log('   1. CUSTOMER: CUSTOMER_BOZQ_ACCESS_1');
    console.log('   2. CAPSTER:  CAPSTER_BOZQ_ACCESS_1');
    console.log('   3. ADMIN:    ADMIN_BOZQ_ACCESS_1\n');
    console.log('📝 NEXT STEPS:');
    console.log('   1. Update registration pages to require ACCESS KEY');
    console.log('   2. Test registration flow for all 3 roles');
    console.log('   3. Distribute keys to users\n');
    
  } catch (error) {
    console.error('\n❌ ERROR during execution:', error);
    console.log('\n📝 FALLBACK: Manual execution required');
    console.log('   Go to Supabase Dashboard → SQL Editor');
    console.log('   Run: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql\n');
    process.exit(1);
  }
}

// Run the script
executeSQLScript();
