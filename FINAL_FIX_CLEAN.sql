-- ===============================================================================
-- FINAL COMPREHENSIVE FIX - SaaSxBarbershop (CLEAN VERSION)
-- ===============================================================================
-- Purpose: Fix "User profile not found" error and ALL authentication issues
-- ===============================================================================

-- STEP 1: FIX FUNCTION VOLATILITY
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- STEP 2: ENSURE ALL REQUIRED TABLES EXIST
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

-- STEP 3: DROP PROBLEMATIC FOREIGN KEY CONSTRAINT
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_customer_phone_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_customer_phone_fkey;
    END IF;
END $$;

-- STEP 4: ENABLE RLS ON ALL TABLES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

-- STEP 5: DROP ALL EXISTING POLICIES
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'barbershop_customers') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON barbershop_customers', r.policyname);
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'capsters') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON capsters', r.policyname);
    END LOOP;
END $$;

-- STEP 6: CREATE SIMPLIFIED RLS POLICIES

-- USER_PROFILES POLICIES
CREATE POLICY "service_role_all_user_profiles"
ON user_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_select_own_profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "anon_insert_profile"
ON user_profiles FOR INSERT
TO anon
WITH CHECK (true);

-- BARBERSHOP_CUSTOMERS POLICIES
CREATE POLICY "service_role_all_customers"
ON barbershop_customers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_select_customers"
ON barbershop_customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_insert_customers"
ON barbershop_customers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_customers"
ON barbershop_customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_delete_customers"
ON barbershop_customers FOR DELETE
TO authenticated
USING (true);

-- CAPSTERS POLICIES
CREATE POLICY "service_role_all_capsters"
ON capsters FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_select_capsters"
ON capsters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_insert_capsters"
ON capsters FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_capsters"
ON capsters FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_delete_capsters"
ON capsters FOR DELETE
TO authenticated
USING (true);

-- STEP 7: AUTO-CREATE CUSTOMER TRIGGER
DROP TRIGGER IF EXISTS trigger_auto_create_barbershop_customer ON user_profiles;
DROP FUNCTION IF EXISTS auto_create_barbershop_customer() CASCADE;

CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_phone IS NOT NULL AND NEW.role = 'customer' THEN
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
            COALESCE(NEW.customer_name, NEW.full_name, NEW.email),
            0, 0, 0, 0, 0,
            false, false, 0.00,
            CURRENT_DATE
        )
        ON CONFLICT (customer_phone) DO UPDATE
        SET customer_name = COALESCE(EXCLUDED.customer_name, barbershop_customers.customer_name),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_barbershop_customer
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_barbershop_customer();

-- STEP 8: AUTO-CREATE CAPSTER TRIGGER
DROP TRIGGER IF EXISTS trigger_auto_create_capster ON user_profiles;
DROP FUNCTION IF EXISTS auto_create_capster() CASCADE;

CREATE OR REPLACE FUNCTION auto_create_capster()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'capster' THEN
        IF NOT EXISTS (SELECT 1 FROM capsters WHERE user_id = NEW.id) THEN
            INSERT INTO capsters (
                user_id,
                capster_name,
                phone,
                specialization,
                rating,
                total_customers_served,
                total_revenue_generated,
                is_available,
                years_of_experience
            ) VALUES (
                NEW.id,
                COALESCE(NEW.full_name, NEW.customer_name, NEW.email),
                NEW.customer_phone,
                'all',
                0.00,
                0,
                0,
                true,
                0
            );
            
            UPDATE user_profiles 
            SET capster_id = (SELECT id FROM capsters WHERE user_id = NEW.id)
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_capster
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_capster();

-- STEP 9: RECREATE UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
DROP TRIGGER IF EXISTS update_capsters_updated_at ON capsters;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON barbershop_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capsters_updated_at
    BEFORE UPDATE ON capsters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
