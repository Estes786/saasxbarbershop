-- Fix RLS policy for barbershop_customers
-- Problem: Customers can access barbershop_customers table
-- Solution: Make sure policy only allows authenticated users with admin role

BEGIN;

-- Drop existing policies for barbershop_customers
DROP POLICY IF EXISTS "customers_admin_all_access" ON public.barbershop_customers;
DROP POLICY IF EXISTS "customers_service_role" ON public.barbershop_customers;
DROP POLICY IF EXISTS "Admins full access customers" ON public.barbershop_customers;
DROP POLICY IF EXISTS "Service role full access customers" ON public.barbershop_customers;

-- Recreate with STRICT admin-only access
CREATE POLICY "customers_admins_only_all"
ON public.barbershop_customers
FOR ALL
TO authenticated
USING (
    -- Only allow if user_role = 'admin' in user_profiles
    auth.uid() IN (
        SELECT id FROM public.user_profiles
        WHERE user_role = 'admin'
    )
)
WITH CHECK (
    -- Only allow if user_role = 'admin' in user_profiles
    auth.uid() IN (
        SELECT id FROM public.user_profiles
        WHERE user_role = 'admin'
    )
);

-- Service role still has full access
CREATE POLICY "customers_service_role_full"
ON public.barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
