-- ULTRA STRICT RLS for barbershop_customers
-- This will use a more explicit approach

BEGIN;

-- Disable RLS temporarily
ALTER TABLE public.barbershop_customers DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'barbershop_customers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.barbershop_customers';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.barbershop_customers ENABLE ROW LEVEL SECURITY;

-- Create single policy: Only admins can do ANYTHING
CREATE POLICY "only_admins_full_access"
ON public.barbershop_customers
FOR ALL
TO authenticated
USING (
    -- Check if current user has admin role in user_profiles
    (SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    -- Check if current user has admin role in user_profiles
    (SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Service role bypass (for backend operations)
CREATE POLICY "service_role_bypass"
ON public.barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly DENY anon role
CREATE POLICY "deny_anon_users"
ON public.barbershop_customers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

COMMIT;

-- Verify
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'barbershop_customers';
