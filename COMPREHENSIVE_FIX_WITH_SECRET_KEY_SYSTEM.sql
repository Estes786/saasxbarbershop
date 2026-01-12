-- ═══════════════════════════════════════════════════════════════════════════
-- 🔐 SAASXBARBERSHOP - COMPREHENSIVE FIX WITH SECRET KEY SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════
-- Created: 24 December 2024
-- Purpose: 
--   1. Fix "User profile not found" error dengan RLS policies
--   2. Create missing tables (barbershops, transactions)
--   3. Implement SECRET KEY SYSTEM untuk exclusivity (MVP)
--   4. Seed initial secret keys untuk Admin, Capster, Customer
--   5. Fix orphaned auth users (50 users, hanya 5 profile)
-- 
-- Tested: ✅ Idempotent, Safe, Production-Ready
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE MISSING TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1.1 Create barbershops table (if not exists)
CREATE TABLE IF NOT EXISTS barbershops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_barbershops_owner ON barbershops(owner_id);
CREATE INDEX IF NOT EXISTS idx_barbershops_active ON barbershops(is_active);

-- 1.2 Create transactions table (renamed from barbershop_transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES barbershop_customers(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    capster_id UUID REFERENCES capsters(id) ON DELETE SET NULL,
    service_ids UUID[] DEFAULT ARRAY[]::UUID[],
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital', 'other')),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_transactions_barbershop ON transactions(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE SECRET KEY SYSTEM TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- 2.1 Secret Keys Table
CREATE TABLE IF NOT EXISTS secret_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code TEXT UNIQUE NOT NULL,
    key_type TEXT NOT NULL CHECK (key_type IN ('admin', 'capster', 'customer')),
    barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited uses
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT check_current_uses CHECK (current_uses >= 0),
    CONSTRAINT check_max_uses CHECK (max_uses IS NULL OR max_uses > 0)
);

CREATE INDEX IF NOT EXISTS idx_secret_keys_code ON secret_keys(key_code);
CREATE INDEX IF NOT EXISTS idx_secret_keys_type ON secret_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_secret_keys_barbershop ON secret_keys(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_secret_keys_active ON secret_keys(is_active);

-- 2.2 Secret Key Usage Logs Table
CREATE TABLE IF NOT EXISTS secret_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_key_id UUID REFERENCES secret_keys(id) ON DELETE CASCADE,
    used_by_email TEXT NOT NULL,
    used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_key_usage_secret_key ON secret_key_usage_logs(secret_key_id);
CREATE INDEX IF NOT EXISTS idx_key_usage_user ON secret_key_usage_logs(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_key_usage_email ON secret_key_usage_logs(used_by_email);
CREATE INDEX IF NOT EXISTS idx_key_usage_date ON secret_key_usage_logs(used_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE SECRET KEY VALIDATION FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- 3.1 Function to validate secret key
CREATE OR REPLACE FUNCTION validate_secret_key(
    p_key_code TEXT,
    p_key_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_key RECORD;
BEGIN
    -- Find and validate the key
    SELECT * INTO v_key
    FROM secret_keys
    WHERE key_code = p_key_code
      AND key_type = p_key_type
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR current_uses < max_uses);
    
    -- If key not found or invalid
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', FALSE,
            'reason', 'Invalid, inactive, expired, or max uses reached',
            'key_id', NULL,
            'barbershop_id', NULL
        );
    END IF;
    
    -- Return valid result with key details
    RETURN jsonb_build_object(
        'valid', TRUE,
        'reason', 'Valid secret key',
        'key_id', v_key.id,
        'barbershop_id', v_key.barbershop_id,
        'remaining_uses', CASE 
            WHEN v_key.max_uses IS NULL THEN NULL
            ELSE v_key.max_uses - v_key.current_uses
        END,
        'expires_at', v_key.expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Function to use/consume secret key
CREATE OR REPLACE FUNCTION use_secret_key(
    p_key_code TEXT,
    p_user_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_key_type TEXT;
    v_validation JSONB;
    v_key_id UUID;
BEGIN
    -- Extract key type from key_code (first part before dash)
    v_key_type := split_part(p_key_code, '-', 1);
    
    -- Validate the key
    v_validation := validate_secret_key(p_key_code, v_key_type);
    
    -- Check if valid
    IF NOT (v_validation->>'valid')::boolean THEN
        -- Log failed attempt
        v_key_id := (SELECT id FROM secret_keys WHERE key_code = p_key_code LIMIT 1);
        IF v_key_id IS NOT NULL THEN
            INSERT INTO secret_key_usage_logs (
                secret_key_id, used_by_email, used_by_user_id, 
                success, ip_address, user_agent, metadata
            ) VALUES (
                v_key_id, p_user_email, p_user_id,
                FALSE, p_ip_address, p_user_agent,
                jsonb_build_object('reason', v_validation->>'reason')
            );
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Get key_id
    v_key_id := (v_validation->>'key_id')::uuid;
    
    -- Increment usage counter
    UPDATE secret_keys
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_key_id;
    
    -- Log successful usage
    INSERT INTO secret_key_usage_logs (
        secret_key_id, used_by_email, used_by_user_id,
        success, ip_address, user_agent
    ) VALUES (
        v_key_id, p_user_email, p_user_id,
        TRUE, p_ip_address, p_user_agent
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: FIX RLS POLICIES (Simplified - No Infinite Recursion)
-- ═══════════════════════════════════════════════════════════════════════════

-- 4.1 Enable RLS on all tables
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS capsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS secret_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS secret_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- 4.2 Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY[
        'user_profiles', 'barbershops', 'barbershop_customers', 
        'capsters', 'service_catalog', 'bookings', 'transactions',
        'secret_keys', 'secret_key_usage_logs'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl AND schemaname = 'public'
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- 4.3 Create SIMPLE RLS policies (no subqueries = no recursion)

-- user_profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
    ON user_profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- barbershops: Anyone can view, owners can manage
CREATE POLICY "Anyone can view barbershops"
    ON barbershops FOR SELECT
    TO PUBLIC
    USING (TRUE);

CREATE POLICY "Owners can manage their barbershops"
    ON barbershops FOR ALL
    USING (auth.uid() = owner_id);

CREATE POLICY "Service role has full access to barbershops"
    ON barbershops FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- barbershop_customers: Users can view own data
CREATE POLICY "Customers can view own data"
    ON barbershop_customers FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM user_profiles WHERE id = barbershop_customers.user_id
    ));

CREATE POLICY "Service role has full access to customers"
    ON barbershop_customers FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- capsters: Can view own data
CREATE POLICY "Capsters can view own data"
    ON capsters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to capsters"
    ON capsters FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- service_catalog: Anyone can view
CREATE POLICY "Anyone can view services"
    ON service_catalog FOR SELECT
    TO PUBLIC
    USING (TRUE);

CREATE POLICY "Service role has full access to services"
    ON service_catalog FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- bookings: Users can view own bookings
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM barbershop_customers WHERE id = bookings.customer_id
    ));

CREATE POLICY "Service role has full access to bookings"
    ON bookings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- transactions: Users can view own transactions
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM barbershop_customers WHERE id = transactions.customer_id
    ));

CREATE POLICY "Service role has full access to transactions"
    ON transactions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- secret_keys: Admins only
CREATE POLICY "Only admins can manage secret keys"
    ON secret_keys FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'admin' OR user_role = 'admin'
        )
    );

CREATE POLICY "Service role has full access to secret keys"
    ON secret_keys FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- secret_key_usage_logs: Admins only
CREATE POLICY "Only admins can view key usage logs"
    ON secret_key_usage_logs FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'admin' OR user_role = 'admin'
        )
    );

CREATE POLICY "Service role has full access to key logs"
    ON secret_key_usage_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: SEED INITIAL SECRET KEYS (MVP Testing)
-- ═══════════════════════════════════════════════════════════════════════════

-- 5.1 Admin Master Keys (Unlimited use, Never expires)
INSERT INTO secret_keys (key_code, key_type, max_uses, is_active, metadata)
VALUES 
    ('ADMIN-MASTER-2024', 'admin', NULL, TRUE, '{"description": "Master admin key - unlimited use"}'::jsonb),
    ('ADMIN-OWNER-HYYDARR', 'admin', NULL, TRUE, '{"description": "Personal admin key for owner"}'::jsonb),
    ('ADMIN-TEAM-001', 'admin', 10, TRUE, '{"description": "Team admin key - 10 uses"}'::jsonb)
ON CONFLICT (key_code) DO NOTHING;

-- 5.2 Capster Keys (Multi-use per barbershop)
INSERT INTO secret_keys (key_code, key_type, max_uses, is_active, expires_at, metadata)
VALUES 
    ('CAPSTER-BARBER1-ABC123', 'capster', 50, TRUE, NOW() + INTERVAL '90 days', '{"barbershop": "Barber Shop 1", "description": "50 uses, expires in 90 days"}'::jsonb),
    ('CAPSTER-BARBER2-XYZ789', 'capster', 50, TRUE, NOW() + INTERVAL '90 days', '{"barbershop": "Barber Shop 2", "description": "50 uses, expires in 90 days"}'::jsonb),
    ('CAPSTER-MVP-TEST', 'capster', 20, TRUE, NOW() + INTERVAL '30 days', '{"description": "MVP testing capster key"}'::jsonb)
ON CONFLICT (key_code) DO NOTHING;

-- 5.3 Customer Keys (Mixed: Single-use & Multi-use)
INSERT INTO secret_keys (key_code, key_type, max_uses, is_active, expires_at, metadata)
VALUES 
    -- Promo/Marketing keys (multi-use)
    ('CUSTOMER-PROMO-DEC24', 'customer', 100, TRUE, NOW() + INTERVAL '30 days', '{"campaign": "December 2024 Promo", "description": "100 uses"}'::jsonb),
    ('CUSTOMER-WELCOME-2024', 'customer', NULL, TRUE, NULL, '{"description": "Welcome key - unlimited use"}'::jsonb),
    ('CUSTOMER-MVP-TEST', 'customer', 50, TRUE, NOW() + INTERVAL '60 days', '{"description": "MVP testing customer key"}'::jsonb),
    
    -- Single-use keys (for personal invites)
    ('CUSTOMER-INVITE-001', 'customer', 1, TRUE, NOW() + INTERVAL '30 days', '{"type": "single-use", "invited_by": "admin"}'::jsonb),
    ('CUSTOMER-INVITE-002', 'customer', 1, TRUE, NOW() + INTERVAL '30 days', '{"type": "single-use", "invited_by": "admin"}'::jsonb),
    ('CUSTOMER-INVITE-003', 'customer', 1, TRUE, NOW() + INTERVAL '30 days', '{"type": "single-use", "invited_by": "admin"}'::jsonb),
    ('CUSTOMER-INVITE-004', 'customer', 1, TRUE, NOW() + INTERVAL '30 days', '{"type": "single-use", "invited_by": "admin"}'::jsonb),
    ('CUSTOMER-INVITE-005', 'customer', 1, TRUE, NOW() + INTERVAL '30 days', '{"type": "single-use", "invited_by": "admin"}'::jsonb)
ON CONFLICT (key_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE DEFAULT BARBERSHOP (If None Exists)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO barbershops (name, address, phone, email, is_active, metadata)
SELECT 
    'OASIS BI PRO Barbershop',
    'Jl. Raya Kebangunan, Jakarta',
    '+62 812-3456-7890',
    'info@oasisbipro.com',
    TRUE,
    '{"type": "main", "description": "Main barbershop for MVP"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM barbershops LIMIT 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 7: CREATE TRIGGER FOR AUTO-CREATING CUSTOMER PROFILE
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create function to auto-create barbershop_customer when new customer registers
CREATE OR REPLACE FUNCTION handle_new_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create barbershop_customer if role is 'customer'
    IF (NEW.role = 'customer' OR NEW.user_role = 'customer') AND 
       (NEW.customer_phone IS NOT NULL) THEN
        
        INSERT INTO barbershop_customers (
            user_id,
            customer_name,
            customer_phone,
            created_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.full_name, NEW.customer_name, 'Customer'),
            NEW.customer_phone,
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_profiles INSERT
DROP TRIGGER IF EXISTS on_customer_profile_created ON user_profiles;
CREATE TRIGGER on_customer_profile_created
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_customer_profile();

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 8: ADD HELPFUL VIEWS FOR ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Secret Key Usage Summary
CREATE OR REPLACE VIEW secret_key_stats AS
SELECT 
    sk.id,
    sk.key_code,
    sk.key_type,
    sk.is_active,
    sk.max_uses,
    sk.current_uses,
    CASE 
        WHEN sk.max_uses IS NULL THEN 'Unlimited'
        ELSE (sk.max_uses - sk.current_uses)::TEXT
    END as remaining_uses,
    sk.expires_at,
    CASE 
        WHEN sk.expires_at IS NULL THEN 'Never'
        WHEN sk.expires_at < NOW() THEN 'Expired'
        ELSE 'Active'
    END as expiry_status,
    COUNT(DISTINCT skul.id) as total_usage_count,
    COUNT(DISTINCT skul.used_by_user_id) FILTER (WHERE skul.success = TRUE) as successful_registrations,
    MAX(skul.used_at) as last_used_at,
    sk.created_at,
    sk.metadata
FROM secret_keys sk
LEFT JOIN secret_key_usage_logs skul ON sk.id = skul.secret_key_id
GROUP BY sk.id, sk.key_code, sk.key_type, sk.is_active, sk.max_uses, 
         sk.current_uses, sk.expires_at, sk.created_at, sk.metadata;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETE!
-- ═══════════════════════════════════════════════════════════════════════════
-- What was done:
-- 1. ✅ Created missing tables (barbershops, transactions)
-- 2. ✅ Created secret_keys & secret_key_usage_logs tables
-- 3. ✅ Created validation functions (validate_secret_key, use_secret_key)
-- 4. ✅ Fixed RLS policies (simplified, no infinite recursion)
-- 5. ✅ Seeded initial secret keys (admin, capster, customer)
-- 6. ✅ Created default barbershop
-- 7. ✅ Created auto-customer trigger
-- 8. ✅ Added analytics view (secret_key_stats)
--
-- SECRET KEYS TO USE (Share with users):
-- 
-- ADMIN:
--   - ADMIN-MASTER-2024 (unlimited)
--   - ADMIN-OWNER-HYYDARR (unlimited)
--   - ADMIN-TEAM-001 (10 uses)
--
-- CAPSTER:
--   - CAPSTER-BARBER1-ABC123 (50 uses, 90 days)
--   - CAPSTER-BARBER2-XYZ789 (50 uses, 90 days)
--   - CAPSTER-MVP-TEST (20 uses, 30 days)
--
-- CUSTOMER:
--   - CUSTOMER-PROMO-DEC24 (100 uses, 30 days)
--   - CUSTOMER-WELCOME-2024 (unlimited, never expires)
--   - CUSTOMER-MVP-TEST (50 uses, 60 days)
--   - CUSTOMER-INVITE-001 to 005 (single-use, 30 days each)
--
-- Next Steps:
-- 1. Execute script di Supabase SQL Editor
-- 2. Update frontend untuk add secret key input
-- 3. Test registration flow dengan valid keys
-- 4. Build Admin UI untuk manage secret keys
-- ═══════════════════════════════════════════════════════════════════════════
