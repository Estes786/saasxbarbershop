-- ===========================================
-- COMPREHENSIVE DATABASE FIX FOR RBAC
-- ===========================================
-- This script will:
-- 1. Create missing barbershop_admins table
-- 2. Fix user_profiles structure
-- 3. Create proper RLS policies
-- 4. Create trigger functions for auto role assignment
-- ===========================================

-- Step 1: Create barbershop_admins table if not exists
CREATE TABLE IF NOT EXISTS public.barbershop_admins (
    admin_email TEXT PRIMARY KEY,
    admin_name TEXT NOT NULL,
    admin_role TEXT DEFAULT 'admin' CHECK (admin_role IN ('admin', 'super_admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Ensure user_profiles has correct schema
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add user_role if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'user_role'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN user_role TEXT DEFAULT 'customer' CHECK (user_role IN ('customer', 'admin'));
    END IF;

    -- Add full_name if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    END IF;

    -- Sync role with user_role for existing records
    UPDATE public.user_profiles SET user_role = role WHERE user_role IS NULL OR user_role != role;
END $$;

-- Step 3: Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_admins ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_profiles;

DROP POLICY IF EXISTS "Customers full access own data" ON public.barbershop_customers;
DROP POLICY IF EXISTS "Admins full access customers" ON public.barbershop_customers;
DROP POLICY IF EXISTS "Service role full access customers" ON public.barbershop_customers;

DROP POLICY IF EXISTS "Admins read own data" ON public.barbershop_admins;
DROP POLICY IF EXISTS "Admins insert own data" ON public.barbershop_admins;
DROP POLICY IF EXISTS "Service role full access admins" ON public.barbershop_admins;

-- Step 5: Create SIMPLE and WORKING RLS policies

-- USER_PROFILES: Allow authenticated users to manage their own profile
CREATE POLICY "authenticated_users_all_access"
ON public.user_profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service_role full access (for backend operations)
CREATE POLICY "service_role_all_access"
ON public.user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- BARBERSHOP_CUSTOMERS: Admins have full access, customers can't access
CREATE POLICY "admins_full_access_customers"
ON public.barbershop_customers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() 
        AND user_role = 'admin'
    )
);

-- Service role full access
CREATE POLICY "service_role_full_access_customers"
ON public.barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- BARBERSHOP_ADMINS: Only admins can read their own data
CREATE POLICY "admins_read_own_data"
ON public.barbershop_admins
FOR SELECT
TO authenticated
USING (
    admin_email IN (
        SELECT email FROM public.user_profiles
        WHERE id = auth.uid() 
        AND user_role = 'admin'
    )
);

-- Service role full access
CREATE POLICY "service_role_full_access_admins"
ON public.barbershop_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 6: Create trigger function for auto-creating user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value TEXT := 'customer';
    user_full_name TEXT := '';
BEGIN
    -- Check if user registered as admin
    IF EXISTS (
        SELECT 1 FROM public.barbershop_admins 
        WHERE admin_email = NEW.email
    ) THEN
        user_role_value := 'admin';
        SELECT admin_name INTO user_full_name 
        FROM public.barbershop_admins 
        WHERE admin_email = NEW.email;
    ELSE
        -- Extract name from metadata if available
        user_full_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        );
    END IF;

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (
        id, 
        email, 
        role, 
        user_role, 
        full_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_role_value,
        user_role_value,
        user_full_name,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = user_role_value,
        user_role = user_role_value,
        full_name = COALESCE(user_profiles.full_name, user_full_name),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;
GRANT ALL ON public.user_profiles TO authenticated, service_role;
GRANT ALL ON public.barbershop_customers TO authenticated, service_role;
GRANT ALL ON public.barbershop_admins TO authenticated, service_role;

-- Grant SELECT to anon for public access if needed
GRANT SELECT ON public.user_profiles TO anon;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_barbershop_admins_email ON public.barbershop_admins(admin_email);

-- Step 10: Insert default admin if needed (OPTIONAL - commented out)
-- INSERT INTO public.barbershop_admins (admin_email, admin_name, admin_role, is_verified)
-- VALUES ('hywhwhwywhwgwh@gmail.com', 'Admin Test', 'admin', true)
-- ON CONFLICT (admin_email) DO NOTHING;

-- ===========================================
-- VERIFICATION QUERIES (commented out)
-- ===========================================
-- SELECT * FROM public.user_profiles ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM public.barbershop_admins;
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

COMMIT;
