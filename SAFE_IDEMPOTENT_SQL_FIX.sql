-- =====================================================
-- SAFE IDEMPOTENT SQL FIX - SaaSxBarbershop
-- Created: 21 Desember 2024
-- Purpose: Fix foreign key constraint error & RLS policies
-- Can be run multiple times safely
-- =====================================================

-- ===========================
-- PART 1: DROP PROBLEMATIC FOREIGN KEY CONSTRAINT
-- ===========================

-- Remove the foreign key constraint that causes the registration error
DO $$ 
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_customer_phone_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_customer_phone_fkey;
        RAISE NOTICE '✅ Dropped user_profiles_customer_phone_fkey constraint';
    ELSE
        RAISE NOTICE '✓ Constraint user_profiles_customer_phone_fkey does not exist (OK)';
    END IF;
END $$;

-- ===========================
-- PART 2: CREATE AUTO-TRIGGER FOR BARBERSHOP_CUSTOMERS
-- ===========================

-- Create trigger function (idempotent)
CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create customer record if customer_phone is provided and role is 'customer'
    IF NEW.customer_phone IS NOT NULL AND NEW.role = 'customer' THEN
        -- Check if customer already exists
        IF NOT EXISTS (
            SELECT 1 FROM barbershop_customers 
            WHERE customer_phone = NEW.customer_phone
        ) THEN
            -- Insert new customer record
            INSERT INTO barbershop_customers (
                customer_phone,
                customer_name,
                total_visits,
                total_revenue,
                average_atv,
                lifetime_value,
                coupon_count,
                coupon_eligible,
                google_review_given,
                churn_risk_score,
                first_visit_date
            ) VALUES (
                NEW.customer_phone,
                COALESCE(NEW.customer_name, NEW.email),
                0,
                0,
                0,
                0,
                0,
                false,
                false,
                0.00,
                CURRENT_DATE
            );
            
            RAISE NOTICE '✅ Auto-created barbershop_customers record for phone: %', NEW.customer_phone;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_barbershop_customer ON user_profiles;

-- Create new trigger
CREATE TRIGGER trigger_auto_create_barbershop_customer
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_barbershop_customer();

RAISE NOTICE '✅ Trigger auto_create_barbershop_customer created successfully';

-- ===========================
-- PART 3: FIX FUNCTION VOLATILITY (Prevent Infinite Recursion)
-- ===========================

-- Drop and recreate update_updated_at_column with STABLE volatility
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

RAISE NOTICE '✅ Function update_updated_at_column created with STABLE volatility';

-- ===========================
-- PART 4: ENSURE ALL TABLES EXIST
-- ===========================

-- Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin', 'barbershop')),
    customer_phone TEXT,
    customer_name TEXT,
    capster_id UUID,
    full_name TEXT,
    user_role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure barbershop_customers table exists
CREATE TABLE IF NOT EXISTS barbershop_customers (
    customer_phone TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    total_visits INTEGER DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    average_atv NUMERIC(10,2) DEFAULT 0,
    lifetime_value NUMERIC(12,2) DEFAULT 0,
    coupon_count INTEGER DEFAULT 0,
    coupon_eligible BOOLEAN DEFAULT FALSE,
    google_review_given BOOLEAN DEFAULT FALSE,
    churn_risk_score NUMERIC(3,2) DEFAULT 0.00 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1),
    first_visit_date DATE,
    last_visit_date DATE,
    days_since_last_visit INTEGER,
    visit_frequency TEXT,
    preferred_services TEXT[],
    average_days_between_visits INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure capsters table exists
CREATE TABLE IF NOT EXISTS capsters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    capster_name TEXT NOT NULL,
    phone TEXT,
    specialization TEXT DEFAULT 'all' CHECK (specialization IN ('haircut', 'grooming', 'coloring', 'all')),
    rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_customers_served INTEGER DEFAULT 0,
    total_revenue_generated NUMERIC(12,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "20:00"}, "tuesday": {"start": "09:00", "end": "20:00"}, "wednesday": {"start": "09:00", "end": "20:00"}, "thursday": {"start": "09:00", "end": "20:00"}, "friday": {"start": "09:00", "end": "20:00"}, "saturday": {"start": "09:00", "end": "21:00"}, "sunday": {"start": "09:00", "end": "21:00"}}'::jsonb,
    profile_image_url TEXT,
    bio TEXT,
    years_of_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

RAISE NOTICE '✅ All tables ensured to exist';

-- ===========================
-- PART 5: FIX RLS POLICIES
-- ===========================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop user_profiles policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
    END LOOP;
    
    -- Drop barbershop_customers policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'barbershop_customers') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON barbershop_customers', r.policyname);
    END LOOP;
    
    -- Drop capsters policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'capsters') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON capsters', r.policyname);
    END LOOP;
    
    RAISE NOTICE '✅ All existing policies dropped';
END $$;

-- ===========================
-- USER_PROFILES RLS POLICIES
-- ===========================

-- Service role full access (CRITICAL for triggers)
CREATE POLICY "service_role_user_profiles_access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can INSERT their own profile during registration
CREATE POLICY "users_insert_own_profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can SELECT their own profile
CREATE POLICY "users_select_own_profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can UPDATE their own profile
CREATE POLICY "users_update_own_profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "admin_read_all_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

RAISE NOTICE '✅ user_profiles RLS policies created';

-- ===========================
-- BARBERSHOP_CUSTOMERS RLS POLICIES
-- ===========================

-- Service role full access
CREATE POLICY "service_role_customers_access"
ON barbershop_customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Customers can read their own data
CREATE POLICY "customers_read_own"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (
    customer_phone IN (
        SELECT customer_phone 
        FROM user_profiles 
        WHERE id = auth.uid() AND role = 'customer'
    )
);

-- Staff (capster, admin, barbershop) can read all
CREATE POLICY "staff_read_all_customers"
ON barbershop_customers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('capster', 'admin', 'barbershop')
    )
);

-- Admin can modify all
CREATE POLICY "admin_modify_customers"
ON barbershop_customers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

RAISE NOTICE '✅ barbershop_customers RLS policies created';

-- ===========================
-- CAPSTERS RLS POLICIES
-- ===========================

-- Service role full access
CREATE POLICY "service_role_capsters_access"
ON capsters
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All authenticated users can read capsters
CREATE POLICY "capsters_read_all"
ON capsters
FOR SELECT
TO authenticated
USING (true);

-- Capster can INSERT their own record
CREATE POLICY "capsters_insert_own"
ON capsters
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Capster can update their own profile
CREATE POLICY "capsters_update_own"
ON capsters
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can do everything
CREATE POLICY "admin_manage_capsters"
ON capsters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

RAISE NOTICE '✅ capsters RLS policies created';

-- ===========================
-- PART 6: RECREATE TRIGGERS
-- ===========================

-- Recreate updated_at triggers for all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON barbershop_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_capsters_updated_at ON capsters;
CREATE TRIGGER update_capsters_updated_at
    BEFORE UPDATE ON capsters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ Updated_at triggers recreated for all tables';

-- ===========================
-- PART 7: VERIFICATION QUERIES
-- ===========================

-- Check RLS is enabled
SELECT 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'barbershop_customers', 'capsters')
ORDER BY tablename;

-- Check policies count
SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'barbershop_customers', 'capsters')
GROUP BY tablename
ORDER BY tablename;

-- Check function volatility (should be 's' for STABLE)
SELECT 
    proname as function_name,
    CASE provolatile 
        WHEN 'i' THEN '❌ IMMUTABLE (Bad!)' 
        WHEN 's' THEN '✅ STABLE (Good!)' 
        WHEN 'v' THEN '⚠️ VOLATILE' 
    END as volatility_status
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- =====================================================
-- ✅ SAFE IDEMPOTENT SQL FIX COMPLETE
-- This script can be safely run multiple times
-- =====================================================
