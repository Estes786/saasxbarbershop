-- ========================================
-- OASIS BI PRO x BARBERSHOP
-- DEPLOYMENT SQL SCRIPT
-- ========================================
-- Version: 1.0
-- Date: December 18, 2025
-- Purpose: Deploy complete database schema to Supabase
-- Execution Time: ~2-3 minutes
-- ========================================

-- ========================================
-- STEP 1: ENABLE EXTENSIONS
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- ========================================
-- STEP 2: CREATE user_profiles TABLE (RBAC)
-- ========================================

-- Drop existing table if you want to reset (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  customer_phone TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_phone ON user_profiles(customer_phone);

-- ========================================
-- STEP 3: CREATE barbershop_transactions TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transaction Info
  transaction_date TIMESTAMPTZ NOT NULL,
  net_revenue NUMERIC(10,2) GENERATED ALWAYS AS (atv_amount - discount_amount) STORED,
  
  -- Customer Info
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_area TEXT,
  
  -- Service Info
  service_tier TEXT NOT NULL CHECK (service_tier IN ('Basic', 'Premium', 'Mastery')),
  upsell_items TEXT,
  capster_name TEXT,
  
  -- Financial Info
  atv_amount NUMERIC(10,2) NOT NULL CHECK (atv_amount >= 0),
  discount_amount NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  
  -- Flags
  is_coupon_redeemed BOOLEAN DEFAULT FALSE,
  is_google_review_asked BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_phone CHECK (customer_phone ~ '^\+?[0-9]{10,15}$'),
  CONSTRAINT valid_discount CHECK (discount_amount <= atv_amount)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trans_date ON barbershop_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_trans_customer_phone ON barbershop_transactions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_trans_service_tier ON barbershop_transactions(service_tier);
CREATE INDEX IF NOT EXISTS idx_trans_net_revenue ON barbershop_transactions(net_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_trans_customer_area ON barbershop_transactions(customer_area);
CREATE INDEX IF NOT EXISTS idx_trans_customer_name_trgm ON barbershop_transactions USING gin (customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trans_date_customer ON barbershop_transactions(transaction_date, customer_phone);

-- ========================================
-- STEP 4: CREATE barbershop_customers TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_customers (
  customer_phone TEXT PRIMARY KEY CHECK (customer_phone ~ '^\+?[0-9]{10,15}$'),
  
  -- Profile Info
  customer_name TEXT NOT NULL,
  customer_area TEXT,
  
  -- Calculated Metrics
  total_visits INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  average_atv NUMERIC(10,2) DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  average_recency_days INTEGER,
  
  -- Segmentation
  customer_segment TEXT CHECK (customer_segment IN ('New', 'Regular', 'VIP', 'Churned')),
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  
  -- Loyalty
  coupon_count INTEGER DEFAULT 0,
  coupon_eligible BOOLEAN DEFAULT FALSE,
  google_review_given BOOLEAN DEFAULT FALSE,
  
  -- Predictive Metrics
  next_visit_prediction TIMESTAMPTZ,
  churn_risk_score NUMERIC(3,2) DEFAULT 0,
  
  -- Metadata
  first_visit_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cust_segment ON barbershop_customers(customer_segment);
CREATE INDEX IF NOT EXISTS idx_cust_last_visit ON barbershop_customers(last_visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_cust_lifetime_value ON barbershop_customers(lifetime_value DESC);
CREATE INDEX IF NOT EXISTS idx_cust_coupon_eligible ON barbershop_customers(coupon_eligible) WHERE coupon_eligible = TRUE;
CREATE INDEX IF NOT EXISTS idx_cust_churn_risk ON barbershop_customers(churn_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_cust_area ON barbershop_customers(customer_area);
CREATE INDEX IF NOT EXISTS idx_cust_name_trgm ON barbershop_customers USING gin (customer_name gin_trgm_ops);

-- Add foreign key from user_profiles to barbershop_customers (optional but recommended)
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_customer_phone_fkey;
  
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_customer_phone_fkey 
  FOREIGN KEY (customer_phone) 
  REFERENCES barbershop_customers(customer_phone) 
  ON DELETE SET NULL;

-- ========================================
-- STEP 5: CREATE bookings TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone),
  customer_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_tier TEXT NOT NULL CHECK (service_tier IN ('Basic', 'Premium', 'Mastery')),
  requested_capster TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ========================================
-- STEP 6: CREATE barbershop_analytics_daily TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_analytics_daily (
  date DATE PRIMARY KEY,
  
  -- Revenue Metrics
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  average_atv NUMERIC(10,2) DEFAULT 0,
  
  -- Customer Metrics
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  total_unique_customers INTEGER DEFAULT 0,
  
  -- Service Metrics
  basic_tier_count INTEGER DEFAULT 0,
  premium_tier_count INTEGER DEFAULT 0,
  mastery_tier_count INTEGER DEFAULT 0,
  upsell_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Loyalty Metrics
  coupons_redeemed INTEGER DEFAULT 0,
  reviews_requested INTEGER DEFAULT 0,
  
  -- KHL Progress
  khl_target NUMERIC(10,2) DEFAULT 2500000,
  khl_progress NUMERIC(5,2) DEFAULT 0,
  month_to_date_revenue NUMERIC(10,2) DEFAULT 0,
  
  -- Day Analysis
  day_of_week TEXT,
  is_weekend BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_date ON barbershop_analytics_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_month ON barbershop_analytics_daily(EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date));
CREATE INDEX IF NOT EXISTS idx_analytics_dow ON barbershop_analytics_daily(day_of_week);

-- ========================================
-- STEP 7: CREATE barbershop_actionable_leads TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_actionable_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lead Info
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  
  -- Lead Segment
  lead_segment TEXT NOT NULL CHECK (lead_segment IN (
    'high_value_churn',
    'ready_to_visit',
    'coupon_eligible',
    'review_target',
    'new_customer_welcome'
  )),
  
  -- Priority
  priority TEXT NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  
  -- Action Info
  recommended_action TEXT NOT NULL,
  whatsapp_message_template TEXT,
  
  -- Metrics
  days_since_last_visit INTEGER,
  average_atv NUMERIC(10,2),
  total_visits INTEGER,
  lifetime_value NUMERIC(10,2),
  
  -- Tracking
  is_contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMPTZ,
  contact_result TEXT,
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_segment ON barbershop_actionable_leads(lead_segment);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON barbershop_actionable_leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_contacted ON barbershop_actionable_leads(is_contacted);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON barbershop_actionable_leads(customer_phone);
CREATE INDEX IF NOT EXISTS idx_leads_expires ON barbershop_actionable_leads(expires_at);
CREATE INDEX IF NOT EXISTS idx_leads_active ON barbershop_actionable_leads(is_contacted, expires_at) 
  WHERE is_contacted = FALSE AND expires_at > NOW();

-- ========================================
-- STEP 8: CREATE barbershop_campaign_tracking TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_campaign_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Campaign Info
  campaign_name TEXT NOT NULL,
  campaign_type TEXT CHECK (campaign_type IN (
    'retention',
    'upsell',
    'review_request',
    'new_customer',
    'seasonal_promo'
  )),
  
  -- Target Segment
  target_segment TEXT,
  total_targets INTEGER DEFAULT 0,
  
  -- Execution
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  
  -- Results
  messages_sent INTEGER DEFAULT 0,
  responses_received INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN messages_sent > 0 THEN (responses_received::NUMERIC / messages_sent * 100) ELSE 0 END
  ) STORED,
  conversion_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN messages_sent > 0 THEN (conversions::NUMERIC / messages_sent * 100) ELSE 0 END
  ) STORED,
  
  -- ROI Tracking
  campaign_cost NUMERIC(10,2) DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  roi NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN campaign_cost > 0 THEN ((revenue_generated - campaign_cost) / campaign_cost * 100) ELSE 0 END
  ) STORED,
  
  -- Metadata
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_status ON barbershop_campaign_tracking(status);
CREATE INDEX IF NOT EXISTS idx_campaign_type ON barbershop_campaign_tracking(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaign_dates ON barbershop_campaign_tracking(start_date, end_date);

-- ========================================
-- STEP 9: CREATE TRIGGER FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON barbershop_transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON barbershop_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON barbershop_customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON barbershop_customers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_updated_at ON barbershop_analytics_daily;
CREATE TRIGGER update_analytics_updated_at 
  BEFORE UPDATE ON barbershop_analytics_daily
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON barbershop_actionable_leads;
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON barbershop_actionable_leads
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_updated_at ON barbershop_campaign_tracking;
CREATE TRIGGER update_campaign_updated_at 
  BEFORE UPDATE ON barbershop_campaign_tracking
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 10: ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_actionable_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_campaign_tracking ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 11: CREATE RLS POLICIES - user_profiles
-- ========================================

-- Admin full access
DROP POLICY IF EXISTS "Admin full access user_profiles" ON user_profiles;
CREATE POLICY "Admin full access user_profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer see own profile
DROP POLICY IF EXISTS "Customer see own profile" ON user_profiles;
CREATE POLICY "Customer see own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- Customer update own profile
DROP POLICY IF EXISTS "Customer update own profile" ON user_profiles;
CREATE POLICY "Customer update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- ========================================
-- STEP 12: CREATE RLS POLICIES - barbershop_transactions
-- ========================================

-- Admin full access
DROP POLICY IF EXISTS "Admin full access transactions" ON barbershop_transactions;
CREATE POLICY "Admin full access transactions" ON barbershop_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer see own transactions
DROP POLICY IF EXISTS "Customer see own transactions" ON barbershop_transactions;
CREATE POLICY "Customer see own transactions" ON barbershop_transactions
  FOR SELECT USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ========================================
-- STEP 13: CREATE RLS POLICIES - barbershop_customers
-- ========================================

-- Admin full access
DROP POLICY IF EXISTS "Admin full access customers" ON barbershop_customers;
CREATE POLICY "Admin full access customers" ON barbershop_customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer see own customer profile
DROP POLICY IF EXISTS "Customer see own customer profile" ON barbershop_customers;
CREATE POLICY "Customer see own customer profile" ON barbershop_customers
  FOR SELECT USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customer update own customer profile
DROP POLICY IF EXISTS "Customer update own customer profile" ON barbershop_customers;
CREATE POLICY "Customer update own customer profile" ON barbershop_customers
  FOR UPDATE USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ========================================
-- STEP 14: CREATE RLS POLICIES - bookings
-- ========================================

-- Admin full access
DROP POLICY IF EXISTS "Admin full access bookings" ON bookings;
CREATE POLICY "Admin full access bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer see own bookings
DROP POLICY IF EXISTS "Customer see own bookings" ON bookings;
CREATE POLICY "Customer see own bookings" ON bookings
  FOR SELECT USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customer create own bookings
DROP POLICY IF EXISTS "Customer create own bookings" ON bookings;
CREATE POLICY "Customer create own bookings" ON bookings
  FOR INSERT WITH CHECK (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customer update own pending bookings
DROP POLICY IF EXISTS "Customer update own bookings" ON bookings;
CREATE POLICY "Customer update own bookings" ON bookings
  FOR UPDATE USING (
    customer_phone = (
      SELECT customer_phone FROM user_profiles 
      WHERE id = auth.uid()
    )
    AND status = 'pending'
  );

-- ========================================
-- STEP 15: CREATE RLS POLICIES - OTHER TABLES (Admin Only)
-- ========================================

-- Analytics: Admin only
DROP POLICY IF EXISTS "Admin only analytics" ON barbershop_analytics_daily;
CREATE POLICY "Admin only analytics" ON barbershop_analytics_daily
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Leads: Admin only
DROP POLICY IF EXISTS "Admin only leads" ON barbershop_actionable_leads;
CREATE POLICY "Admin only leads" ON barbershop_actionable_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Campaigns: Admin only
DROP POLICY IF EXISTS "Admin only campaigns" ON barbershop_campaign_tracking;
CREATE POLICY "Admin only campaigns" ON barbershop_campaign_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- STEP 16: GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON barbershop_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON barbershop_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bookings TO authenticated;
GRANT SELECT ON barbershop_analytics_daily TO authenticated;
GRANT SELECT ON barbershop_actionable_leads TO authenticated;
GRANT SELECT ON barbershop_campaign_tracking TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- STEP 17: CREATE UTILITY FUNCTIONS
-- ========================================

-- Function: Calculate churn risk score
CREATE OR REPLACE FUNCTION calculate_churn_risk(p_customer_phone TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_days_since_last_visit INTEGER;
  v_avg_recency INTEGER;
  v_total_visits INTEGER;
  v_risk_score NUMERIC;
BEGIN
  SELECT 
    EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400,
    average_recency_days,
    total_visits
  INTO v_days_since_last_visit, v_avg_recency, v_total_visits
  FROM barbershop_customers
  WHERE customer_phone = p_customer_phone;
  
  IF v_avg_recency IS NULL OR v_avg_recency = 0 THEN
    v_risk_score := 0;
  ELSE
    v_risk_score := LEAST(1.0, (v_days_since_last_visit::NUMERIC / (v_avg_recency * 1.5)));
  END IF;
  
  -- Adjust for loyalty
  IF v_total_visits >= 10 THEN
    v_risk_score := v_risk_score * 0.7;
  ELSIF v_total_visits >= 5 THEN
    v_risk_score := v_risk_score * 0.85;
  END IF;
  
  RETURN ROUND(v_risk_score, 2);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DEPLOYMENT COMPLETE! ✅
-- ========================================

-- Verify deployment
SELECT 'user_profiles' AS table_name, COUNT(*) AS row_count FROM user_profiles
UNION ALL
SELECT 'barbershop_transactions', COUNT(*) FROM barbershop_transactions
UNION ALL
SELECT 'barbershop_customers', COUNT(*) FROM barbershop_customers
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'barbershop_analytics_daily', COUNT(*) FROM barbershop_analytics_daily
UNION ALL
SELECT 'barbershop_actionable_leads', COUNT(*) FROM barbershop_actionable_leads
UNION ALL
SELECT 'barbershop_campaign_tracking', COUNT(*) FROM barbershop_campaign_tracking;

-- Show all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'user_profiles%' OR tablename LIKE 'barbershop%' OR tablename = 'bookings'
ORDER BY tablename, policyname;

-- ========================================
-- NOTES:
-- - All tables created with RLS enabled
-- - Admin has full access to all tables
-- - Customer can only see their own data
-- - Indexes optimized for dashboard queries
-- - Triggers for automatic updated_at timestamps
-- ========================================
