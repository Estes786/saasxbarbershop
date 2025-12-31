-- ============================================================================
-- FIX ONBOARDING SCHEMA - 31 DESEMBER 2025
-- ============================================================================
-- TUJUAN: Memperbaiki schema untuk mendukung onboarding barbershop admin
-- MASALAH YANG DIPERBAIKI:
--   1. Column "barbershop_id" does not exist in service_catalog
--   2. Memastikan semua foreign key constraints benar
--   3. Menambahkan barbershop_profiles sebagai tabel utama
-- 
-- IDEMPOTENT: Script ini aman dijalankan berkali-kali
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Pastikan barbershop_profiles table memiliki struktur yang benar
-- ============================================================================

-- Tambahkan kolom yang mungkin kurang di barbershop_profiles
DO $$ 
BEGIN
    -- owner_id (user_id dari owner barbershop)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added owner_id to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ owner_id already exists in barbershop_profiles';
    END IF;

    -- barbershop_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'barbershop_name'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN barbershop_name TEXT NOT NULL DEFAULT 'My Barbershop';
        
        RAISE NOTICE '✅ Added barbershop_name to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ barbershop_name already exists in barbershop_profiles';
    END IF;

    -- address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN address TEXT;
        
        RAISE NOTICE '✅ Added address to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ address already exists in barbershop_profiles';
    END IF;

    -- phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN phone TEXT;
        
        RAISE NOTICE '✅ Added phone to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ phone already exists in barbershop_profiles';
    END IF;

    -- operating_hours
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'operating_hours'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN operating_hours JSONB DEFAULT '{"monday": "09:00-21:00", "tuesday": "09:00-21:00", "wednesday": "09:00-21:00", "thursday": "09:00-21:00", "friday": "09:00-21:00", "saturday": "09:00-21:00", "sunday": "09:00-21:00"}'::jsonb;
        
        RAISE NOTICE '✅ Added operating_hours to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ operating_hours already exists in barbershop_profiles';
    END IF;

    -- logo_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN logo_url TEXT;
        
        RAISE NOTICE '✅ Added logo_url to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ logo_url already exists in barbershop_profiles';
    END IF;

    -- is_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbershop_profiles' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE barbershop_profiles 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        RAISE NOTICE '✅ Added is_active to barbershop_profiles';
    ELSE
        RAISE NOTICE '✓ is_active already exists in barbershop_profiles';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Tambahkan barbershop_id ke service_catalog
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_catalog' 
        AND column_name = 'barbershop_id'
    ) THEN
        -- Tambahkan kolom barbershop_id
        ALTER TABLE service_catalog 
        ADD COLUMN barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added barbershop_id to service_catalog';
    ELSE
        RAISE NOTICE '✓ barbershop_id already exists in service_catalog';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Pastikan capsters.barbershop_id memiliki proper foreign key
-- ============================================================================

DO $$
BEGIN
    -- Cek apakah constraint sudah ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'capsters_barbershop_id_fkey'
        AND table_name = 'capsters'
    ) THEN
        -- Tambahkan foreign key constraint jika belum ada
        ALTER TABLE capsters
        ADD CONSTRAINT capsters_barbershop_id_fkey 
        FOREIGN KEY (barbershop_id) 
        REFERENCES barbershop_profiles(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added foreign key constraint capsters_barbershop_id_fkey';
    ELSE
        RAISE NOTICE '✓ Foreign key constraint capsters_barbershop_id_fkey already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Create or replace function untuk onboarding
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_barbershop_onboarding(
    p_owner_id UUID,
    p_barbershop_name TEXT,
    p_address TEXT,
    p_phone TEXT,
    p_operating_hours JSONB,
    p_capsters JSONB,  -- Array of {name, phone, specialization}
    p_services JSONB   -- Array of {service_name, category, price, duration}
)
RETURNS JSONB AS $$
DECLARE
    v_barbershop_id UUID;
    v_capster JSONB;
    v_service JSONB;
    v_capster_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Create barbershop profile
    INSERT INTO barbershop_profiles (
        owner_id,
        barbershop_name,
        address,
        phone,
        operating_hours,
        is_active
    ) VALUES (
        p_owner_id,
        p_barbershop_name,
        p_address,
        p_phone,
        p_operating_hours,
        true
    )
    ON CONFLICT (owner_id) 
    DO UPDATE SET
        barbershop_name = EXCLUDED.barbershop_name,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        operating_hours = EXCLUDED.operating_hours,
        updated_at = NOW()
    RETURNING id INTO v_barbershop_id;

    -- 2. Update user_profiles role to admin
    UPDATE user_profiles
    SET role = 'admin',
        user_role = 'admin',
        updated_at = NOW()
    WHERE id = p_owner_id;

    -- 3. Create capsters
    FOR v_capster IN SELECT * FROM jsonb_array_elements(p_capsters)
    LOOP
        INSERT INTO capsters (
            barbershop_id,
            user_id,
            capster_name,
            name,
            phone,
            specialization,
            status,
            is_active,
            is_available
        ) VALUES (
            v_barbershop_id,
            p_owner_id,  -- Sementara pakai owner_id, nanti bisa diubah
            v_capster->>'name',
            v_capster->>'name',
            v_capster->>'phone',
            v_capster->>'specialization',
            'approved',
            true,
            true
        )
        ON CONFLICT (user_id, barbershop_id)
        DO NOTHING;
    END LOOP;

    -- 4. Create services
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
        INSERT INTO service_catalog (
            barbershop_id,
            service_name,
            service_category,
            base_price,
            duration_minutes,
            is_active
        ) VALUES (
            v_barbershop_id,
            v_service->>'service_name',
            v_service->>'category',
            (v_service->>'price')::INTEGER,
            (v_service->>'duration')::INTEGER,
            true
        )
        ON CONFLICT (barbershop_id, service_name)
        DO NOTHING;
    END LOOP;

    -- Return success response
    v_result := jsonb_build_object(
        'success', true,
        'barbershop_id', v_barbershop_id,
        'message', 'Onboarding completed successfully'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_barbershop_onboarding TO authenticated;

-- ============================================================================
-- STEP 6: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_barbershop_profiles_owner_id 
ON barbershop_profiles(owner_id);

CREATE INDEX IF NOT EXISTS idx_service_catalog_barbershop_id 
ON service_catalog(barbershop_id);

CREATE INDEX IF NOT EXISTS idx_capsters_barbershop_id 
ON capsters(barbershop_id);

-- ============================================================================
-- FINAL: Print success message
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '✅ ONBOARDING SCHEMA FIX COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes applied:';
    RAISE NOTICE '   1. ✓ barbershop_profiles table enhanced';
    RAISE NOTICE '   2. ✓ barbershop_id added to service_catalog';
    RAISE NOTICE '   3. ✓ Foreign key constraints verified';
    RAISE NOTICE '   4. ✓ complete_barbershop_onboarding function created';
    RAISE NOTICE '   5. ✓ Indexes created for performance';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   - Test onboarding flow from frontend';
    RAISE NOTICE '   - Register as admin and complete setup wizard';
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
END $$;

COMMIT;
