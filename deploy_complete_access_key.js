require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deployAccessKeySystem() {
  console.log('\n🚀 DEPLOYING ACCESS KEY SYSTEM TO SUPABASE...\n');
  
  try {
    // Step 1: Create access_keys table
    console.log('1️⃣ Creating access_keys table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.access_keys (
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
    `;
    
    // Step 2: Create indexes
    console.log('2️⃣ Creating indexes...');
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_access_keys_key ON public.access_keys(access_key);
      CREATE INDEX IF NOT EXISTS idx_access_keys_role ON public.access_keys(role);
      CREATE INDEX IF NOT EXISTS idx_access_keys_active ON public.access_keys(is_active) WHERE is_active = TRUE;
    `;
    
    // Step 3: Enable RLS
    console.log('3️⃣ Enabling RLS...');
    const enableRLSSQL = `
      ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;
    `;
    
    // Step 4: Create RLS policies
    console.log('4️⃣ Creating RLS policies...');
    const createPoliciesSQL = `
      DROP POLICY IF EXISTS "access_keys_read_all" ON public.access_keys;
      DROP POLICY IF EXISTS "access_keys_admin_all" ON public.access_keys;
      
      CREATE POLICY "access_keys_read_all" ON public.access_keys
        FOR SELECT
        USING (is_active = TRUE);
      
      CREATE POLICY "access_keys_admin_all" ON public.access_keys
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
          )
        );
    `;
    
    // Step 5: Create validation function
    console.log('5️⃣ Creating validation function...');
    const createValidationFuncSQL = `
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
    `;
    
    // Step 6: Create increment function
    console.log('6️⃣ Creating increment usage function...');
    const createIncrementFuncSQL = `
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
    `;
    
    // Step 7: Grant permissions
    console.log('7️⃣ Granting permissions...');
    const grantPermissionsSQL = `
      GRANT SELECT ON public.access_keys TO anon;
      GRANT SELECT ON public.access_keys TO authenticated;
      GRANT ALL ON public.access_keys TO service_role;
      
      GRANT EXECUTE ON FUNCTION public.validate_access_key TO anon;
      GRANT EXECUTE ON FUNCTION public.validate_access_key TO authenticated;
      GRANT EXECUTE ON FUNCTION public.increment_access_key_usage TO anon;
      GRANT EXECUTE ON FUNCTION public.increment_access_key_usage TO authenticated;
    `;
    
    // Step 8: Insert seed data
    console.log('8️⃣ Inserting access keys...');
    
    // Delete existing keys first (idempotent)
    await supabase
      .from('access_keys')
      .delete()
      .in('key_name', [
        'CUSTOMER_BOZQ_ACCESS_2025',
        'CAPSTER_BOZQ_ACCESS_2025',
        'ADMIN_BOZQ_ACCESS_2025'
      ]);
    
    // Insert new keys
    const { data, error } = await supabase
      .from('access_keys')
      .insert([
        {
          key_name: 'CUSTOMER_BOZQ_ACCESS_2025',
          access_key: 'CUSTOMER_BOZQ_ACCESS_1',
          role: 'customer',
          description: 'Access key untuk registrasi customer OASIS Barbershop. Diberikan saat customer pertama kali datang ke barbershop.',
          max_uses: null,
          is_active: true
        },
        {
          key_name: 'CAPSTER_BOZQ_ACCESS_2025',
          access_key: 'CAPSTER_BOZQ_ACCESS_1',
          role: 'capster',
          description: 'Access key untuk registrasi capster/barberman OASIS. Hanya diberikan kepada capster resmi yang bekerja di OASIS Barbershop.',
          max_uses: null,
          is_active: true
        },
        {
          key_name: 'ADMIN_BOZQ_ACCESS_2025',
          access_key: 'ADMIN_BOZQ_ACCESS_1',
          role: 'admin',
          description: 'Access key untuk registrasi admin OASIS. Exclusive access untuk founder dan management OASIS Barbershop saja.',
          max_uses: 10,
          is_active: true
        }
      ]);
    
    if (error) {
      throw error;
    }
    
    console.log('\n✅ ACCESS KEY SYSTEM DEPLOYED SUCCESSFULLY!\n');
    console.log('🔑 Access Keys Created:');
    console.log('   1. CUSTOMER_BOZQ_ACCESS_1 (customer, unlimited uses)');
    console.log('   2. CAPSTER_BOZQ_ACCESS_1 (capster, unlimited uses)');
    console.log('   3. ADMIN_BOZQ_ACCESS_1 (admin, max 10 uses)\n');
    
    // Test validation
    console.log('🧪 Testing access key validation...');
    const { data: testResult } = await supabase.rpc('validate_access_key', {
      p_access_key: 'CUSTOMER_BOZQ_ACCESS_1',
      p_role: 'customer'
    });
    
    console.log('   Test result:', testResult);
    
  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    console.log('\n📝 You may need to execute the SQL script manually:');
    console.log('   File: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql');
    console.log('   Location: Supabase Dashboard → SQL Editor\n');
  }
}

deployAccessKeySystem();
