-- ===========================================
-- CLEAN DATABASE FIX - DROP AND RECREATE
-- ===========================================

BEGIN;

-- Step 1: DROP all existing policies completely
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles';
    END LOOP;
    
    -- Drop all policies on barbershop_customers
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'barbershop_customers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.barbershop_customers';
    END LOOP;
    
    -- Drop all policies on barbershop_admins if table exists
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'barbershop_admins') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.barbershop_admins';
    END LOOP;
END $$;

-- Step 2: Create barbershop_admins table
CREATE TABLE IF NOT EXISTS public.barbershop_admins (
    admin_email TEXT PRIMARY KEY,
    admin_name TEXT NOT NULL,
    admin_role TEXT DEFAULT 'admin' CHECK (admin_role IN ('admin', 'super_admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_admins ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW simplified RLS policies

-- USER_PROFILES policies
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_service_role"
ON public.user_profiles FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- BARBERSHOP_CUSTOMERS policies (admin only)
CREATE POLICY "customers_admin_all_access"
ON public.barbershop_customers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.user_role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.user_role = 'admin'
    )
);

CREATE POLICY "customers_service_role"
ON public.barbershop_customers FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- BARBERSHOP_ADMINS policies
CREATE POLICY "admins_select_own"
ON public.barbershop_admins FOR SELECT
TO authenticated
USING (
    admin_email IN (
        SELECT email FROM public.user_profiles
        WHERE id = auth.uid() AND user_role = 'admin'
    )
);

CREATE POLICY "admins_service_role"
ON public.barbershop_admins FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Step 5: Drop and recreate trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role_value TEXT := 'customer';
    user_full_name TEXT := '';
BEGIN
    -- Check if email is in barbershop_admins
    IF EXISTS (SELECT 1 FROM public.barbershop_admins WHERE admin_email = NEW.email) THEN
        user_role_value := 'admin';
        SELECT admin_name INTO user_full_name FROM public.barbershop_admins WHERE admin_email = NEW.email;
    ELSE
        user_full_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        );
    END IF;

    -- Insert or update user_profiles
    INSERT INTO public.user_profiles (
        id, email, role, user_role, full_name, created_at, updated_at
    ) VALUES (
        NEW.id, NEW.email, user_role_value, user_role_value, user_full_name, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        user_role = EXCLUDED.user_role,
        full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Step 6: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;
GRANT ALL ON public.user_profiles TO authenticated, service_role;
GRANT ALL ON public.barbershop_customers TO authenticated, service_role;
GRANT ALL ON public.barbershop_admins TO authenticated, service_role;
GRANT SELECT ON public.user_profiles TO anon;

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON public.user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_barbershop_admins_email ON public.barbershop_admins(admin_email);

COMMIT;
