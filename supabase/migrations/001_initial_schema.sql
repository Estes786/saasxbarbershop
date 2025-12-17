-- ========================================
-- OASIS BI PRO x BARBERSHOP INTEGRATION
-- Supabase Database Schema
-- ========================================
-- Version: 1.0
-- Date: December 17, 2025
-- Purpose: Complete database schema for barbershop data monetization
-- ========================================

-- Enable necessary extensions
-- uuid-ossp and pg_trgm are already enabled in Supabase by default

-- ========================================
-- TABLE 1: barbershop_transactions
-- Purpose: Store all transaction data from Google Sheets
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Info
  transaction_date TIMESTAMPTZ NOT NULL,
  net_revenue NUMERIC(10,2) GENERATED ALWAYS AS (atv_amount - discount_amount) STORED,
  
  -- Customer Info
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_area TEXT,
  
  -- Service Info
  service_tier TEXT NOT NULL CHECK (service_tier IN ('Basic', 'Premium', 'Mastery')),
  upsell_items TEXT, -- Comma-separated: "Tonic, Massage"
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

-- Indexes for fast queries
CREATE INDEX idx_trans_date ON barbershop_transactions(transaction_date DESC);
CREATE INDEX idx_trans_customer_phone ON barbershop_transactions(customer_phone);
CREATE INDEX idx_trans_service_tier ON barbershop_transactions(service_tier);
CREATE INDEX idx_trans_net_revenue ON barbershop_transactions(net_revenue DESC);
CREATE INDEX idx_trans_created_at ON barbershop_transactions(created_at DESC);
CREATE INDEX idx_trans_customer_area ON barbershop_transactions(customer_area);

-- Full-text search index for customer names
CREATE INDEX idx_trans_customer_name_trgm ON barbershop_transactions USING gin (customer_name gin_trgm_ops);

-- Composite index for date range queries
CREATE INDEX idx_trans_date_customer ON barbershop_transactions(transaction_date, customer_phone);

-- ========================================
-- TABLE 2: barbershop_customers
-- Purpose: Aggregated customer profile with calculated metrics
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_customers (
  -- Primary Key
  customer_phone TEXT PRIMARY KEY CHECK (customer_phone ~ '^\+?[0-9]{10,15}$'),
  
  -- Profile Info
  customer_name TEXT NOT NULL,
  customer_area TEXT,
  
  -- Calculated Metrics (Updated by Edge Function)
  total_visits INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  average_atv NUMERIC(10,2) DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  average_recency_days INTEGER, -- Avg days between visits
  
  -- Segmentation
  customer_segment TEXT CHECK (customer_segment IN ('New', 'Regular', 'VIP', 'Churned')),
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  
  -- Loyalty
  coupon_count INTEGER DEFAULT 0, -- Number of coupons earned (visits / 4)
  coupon_eligible BOOLEAN DEFAULT FALSE, -- Ready for 4+1 redemption
  google_review_given BOOLEAN DEFAULT FALSE,
  
  -- Predictive Metrics
  next_visit_prediction TIMESTAMPTZ, -- Predicted next visit date
  churn_risk_score NUMERIC(3,2) DEFAULT 0, -- 0-1 score (0=no risk, 1=high risk)
  
  -- Metadata
  first_visit_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_cust_segment ON barbershop_customers(customer_segment);
CREATE INDEX idx_cust_last_visit ON barbershop_customers(last_visit_date DESC);
CREATE INDEX idx_cust_lifetime_value ON barbershop_customers(lifetime_value DESC);
CREATE INDEX idx_cust_coupon_eligible ON barbershop_customers(coupon_eligible) WHERE coupon_eligible = TRUE;
CREATE INDEX idx_cust_churn_risk ON barbershop_customers(churn_risk_score DESC);
CREATE INDEX idx_cust_area ON barbershop_customers(customer_area);

-- Full-text search index
CREATE INDEX idx_cust_name_trgm ON barbershop_customers USING gin (customer_name gin_trgm_ops);

-- ========================================
-- TABLE 3: barbershop_analytics_daily
-- Purpose: Daily aggregated metrics for dashboard
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_analytics_daily (
  -- Primary Key
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
  upsell_rate NUMERIC(5,2) DEFAULT 0, -- Percentage (0-100)
  
  -- Loyalty Metrics
  coupons_redeemed INTEGER DEFAULT 0,
  reviews_requested INTEGER DEFAULT 0,
  
  -- KHL Progress (Monthly Target)
  khl_target NUMERIC(10,2) DEFAULT 2500000,
  khl_progress NUMERIC(5,2) DEFAULT 0, -- Percentage (0-100)
  month_to_date_revenue NUMERIC(10,2) DEFAULT 0,
  
  -- Day of Week Analysis
  day_of_week TEXT, -- Monday, Tuesday, etc.
  is_weekend BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for date range queries
CREATE INDEX idx_analytics_date ON barbershop_analytics_daily(date DESC);
CREATE INDEX idx_analytics_month ON barbershop_analytics_daily(EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date));
CREATE INDEX idx_analytics_dow ON barbershop_analytics_daily(day_of_week);

-- ========================================
-- TABLE 4: barbershop_actionable_leads
-- Purpose: Pre-calculated lead lists for dashboard
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_actionable_leads (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
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
  contact_result TEXT, -- 'success', 'no_response', 'declined', etc.
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Lead expires after certain time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_segment ON barbershop_actionable_leads(lead_segment);
CREATE INDEX idx_leads_priority ON barbershop_actionable_leads(priority);
CREATE INDEX idx_leads_contacted ON barbershop_actionable_leads(is_contacted);
CREATE INDEX idx_leads_phone ON barbershop_actionable_leads(customer_phone);
CREATE INDEX idx_leads_expires ON barbershop_actionable_leads(expires_at);

-- Composite index for active leads (removed NOW() as it's not immutable)
CREATE INDEX idx_leads_active ON barbershop_actionable_leads(is_contacted, expires_at) 
WHERE is_contacted = FALSE;

-- ========================================
-- TABLE 5: barbershop_campaign_tracking
-- Purpose: Track marketing campaigns and their effectiveness
-- ========================================

CREATE TABLE IF NOT EXISTS barbershop_campaign_tracking (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
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
  conversions INTEGER DEFAULT 0, -- Actual visits/purchases
  response_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN messages_sent > 0 THEN (responses_received::NUMERIC / messages_sent * 100) ELSE 0 END
  ) STORED,
  conversion_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN messages_sent > 0 THEN (conversions::NUMERIC / messages_sent * 100) ELSE 0 END
  ) STORED,
  
  -- ROI Tracking
  campaign_cost NUMERIC(10,2) DEFAULT 0, -- If any paid ads/promotions
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  roi NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN campaign_cost > 0 THEN ((revenue_generated - campaign_cost) / campaign_cost * 100) ELSE 0 END
  ) STORED,
  
  -- Metadata
  created_by TEXT, -- User who created campaign
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_status ON barbershop_campaign_tracking(status);
CREATE INDEX idx_campaign_type ON barbershop_campaign_tracking(campaign_type);
CREATE INDEX idx_campaign_dates ON barbershop_campaign_tracking(start_date, end_date);

-- ========================================
-- TRIGGER FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON barbershop_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON barbershop_customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON barbershop_analytics_daily
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON barbershop_actionable_leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_updated_at BEFORE UPDATE ON barbershop_campaign_tracking
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE barbershop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_actionable_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_campaign_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all data
CREATE POLICY "Authenticated users can read transactions" 
ON barbershop_transactions FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read customers" 
ON barbershop_customers FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics" 
ON barbershop_analytics_daily FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read leads" 
ON barbershop_actionable_leads FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read campaigns" 
ON barbershop_campaign_tracking FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access transactions" 
ON barbershop_transactions FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access customers" 
ON barbershop_customers FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access analytics" 
ON barbershop_analytics_daily FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access leads" 
ON barbershop_actionable_leads FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access campaigns" 
ON barbershop_campaign_tracking FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- UTILITY FUNCTIONS (PostgreSQL)
-- ========================================

-- Function: Calculate customer churn risk score
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
  
  -- Risk calculation logic
  -- If days since last visit > 1.5x average recency, churn risk increases
  IF v_avg_recency IS NULL OR v_avg_recency = 0 THEN
    v_risk_score := 0;
  ELSE
    v_risk_score := LEAST(1.0, (v_days_since_last_visit::NUMERIC / (v_avg_recency * 1.5)));
  END IF;
  
  -- Adjust for loyalty (more visits = lower risk)
  IF v_total_visits >= 10 THEN
    v_risk_score := v_risk_score * 0.7;
  ELSIF v_total_visits >= 5 THEN
    v_risk_score := v_risk_score * 0.85;
  END IF;
  
  RETURN ROUND(v_risk_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: Get monthly KHL progress
CREATE OR REPLACE FUNCTION get_khl_progress(p_month INTEGER DEFAULT NULL, p_year INTEGER DEFAULT NULL)
RETURNS TABLE (
  target_khl NUMERIC,
  current_revenue NUMERIC,
  progress_percentage NUMERIC,
  days_in_month INTEGER,
  days_elapsed INTEGER,
  days_remaining INTEGER,
  daily_target_remaining NUMERIC
) AS $$
DECLARE
  v_month INTEGER := COALESCE(p_month, EXTRACT(MONTH FROM NOW()));
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM NOW()));
  v_target NUMERIC := 2500000;
  v_revenue NUMERIC;
  v_month_start DATE;
  v_month_end DATE;
  v_days_total INTEGER;
  v_days_elapsed INTEGER;
BEGIN
  v_month_start := DATE(v_year || '-' || v_month || '-01');
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_days_total := EXTRACT(DAY FROM v_month_end);
  v_days_elapsed := CASE 
    WHEN CURRENT_DATE > v_month_end THEN v_days_total
    WHEN CURRENT_DATE < v_month_start THEN 0
    ELSE EXTRACT(DAY FROM CURRENT_DATE)
  END;
  
  SELECT COALESCE(SUM(net_revenue), 0)
  INTO v_revenue
  FROM barbershop_transactions
  WHERE transaction_date >= v_month_start
    AND transaction_date <= v_month_end;
  
  RETURN QUERY SELECT
    v_target,
    v_revenue,
    ROUND((v_revenue / v_target * 100), 2),
    v_days_total,
    v_days_elapsed::INTEGER,
    (v_days_total - v_days_elapsed)::INTEGER,
    CASE 
      WHEN (v_days_total - v_days_elapsed) > 0 
      THEN ROUND((v_target - v_revenue) / (v_days_total - v_days_elapsed), 0)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Function: Get service tier distribution
CREATE OR REPLACE FUNCTION get_service_distribution(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  service_tier TEXT,
  total_count BIGINT,
  total_revenue NUMERIC,
  avg_atv NUMERIC,
  percentage NUMERIC
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_total_transactions BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_transactions
  FROM barbershop_transactions
  WHERE transaction_date >= v_start_date AND transaction_date <= v_end_date;
  
  RETURN QUERY
  SELECT 
    t.service_tier,
    COUNT(*)::BIGINT AS total_count,
    ROUND(SUM(t.net_revenue), 2) AS total_revenue,
    ROUND(AVG(t.atv_amount), 2) AS avg_atv,
    ROUND((COUNT(*)::NUMERIC / v_total_transactions * 100), 2) AS percentage
  FROM barbershop_transactions t
  WHERE t.transaction_date >= v_start_date AND t.transaction_date <= v_end_date
  GROUP BY t.service_tier
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA (FOR TESTING)
-- ========================================

-- Insert sample transactions (comment out in production)
/*
INSERT INTO barbershop_transactions (
  transaction_date, customer_phone, customer_name, service_tier, 
  upsell_items, atv_amount, discount_amount, customer_area
) VALUES
  ('2025-12-17 10:30:00+07', '081234567890', 'Budi Santoso', 'Basic', NULL, 20000, 0, 'Patikraja'),
  ('2025-12-17 11:15:00+07', '082345678901', 'Agus Wijaya', 'Premium', 'Hair Tonic', 45000, 0, 'Kedungrandu'),
  ('2025-12-17 13:00:00+07', '083456789012', 'Dedi Kurniawan', 'Mastery', 'Coloring, Massage', 75000, 0, 'Banyumas'),
  ('2025-12-17 14:30:00+07', '081234567890', 'Budi Santoso', 'Basic', NULL, 20000, 0, 'Patikraja'),
  ('2025-12-17 16:00:00+07', '084567890123', 'Eko Prasetyo', 'Premium', 'Hair Tonic', 40000, 5000, 'Kebumen');
*/

-- ========================================
-- MAINTENANCE QUERIES
-- ========================================

-- Query to check table sizes
/*
SELECT 
  schemaname AS schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS data_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'barbershop%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/

-- Query to check index usage
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'barbershop%'
ORDER BY idx_scan DESC;
*/

-- ========================================
-- BACKUP AND RESTORE
-- ========================================

-- Backup command (run from terminal)
-- pg_dump -h qwqmhvwqeynnyxaecqzw.supabase.co -U postgres -d postgres -t 'barbershop_*' > barbershop_backup.sql

-- Restore command (run from terminal)
-- psql -h qwqmhvwqeynnyxaecqzw.supabase.co -U postgres -d postgres < barbershop_backup.sql

-- ========================================
-- NOTES
-- ========================================

-- 1. Remember to run this script in Supabase SQL Editor
-- 2. All tables use Row Level Security for data protection
-- 3. Indexes are optimized for dashboard queries
-- 4. Edge Functions should use service_role key for write operations
-- 5. Backup database regularly (Supabase provides daily backups)
-- 6. Monitor table sizes and index usage for optimization

-- ========================================
-- END OF SCHEMA
-- ========================================
