-- ========================================
-- FIX RLS POLICIES FOR DASHBOARD ACCESS
-- ========================================
-- Run this SQL in Supabase SQL Editor
-- Purpose: Allow anon key to read data for dashboard display
-- ========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON barbershop_transactions;
DROP POLICY IF EXISTS "Authenticated users can read customers" ON barbershop_customers;
DROP POLICY IF EXISTS "Authenticated users can read analytics" ON barbershop_analytics_daily;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON barbershop_actionable_leads;
DROP POLICY IF EXISTS "Authenticated users can read campaigns" ON barbershop_campaign_tracking;

-- Create new permissive policies for anon role (read-only)
CREATE POLICY "Anon can read transactions" 
ON barbershop_transactions FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Anon can read customers" 
ON barbershop_customers FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Anon can read analytics" 
ON barbershop_analytics_daily FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Anon can read leads" 
ON barbershop_actionable_leads FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Anon can read campaigns" 
ON barbershop_campaign_tracking FOR SELECT 
TO anon
USING (true);

-- Service role keeps full access (already exists, recreate if needed)
CREATE POLICY "Service role full access transactions" 
ON barbershop_transactions FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access customers" 
ON barbershop_customers FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access analytics" 
ON barbershop_analytics_daily FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access leads" 
ON barbershop_actionable_leads FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access campaigns" 
ON barbershop_campaign_tracking FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Grant explicit SELECT permissions to anon role
GRANT SELECT ON barbershop_transactions TO anon;
GRANT SELECT ON barbershop_customers TO anon;
GRANT SELECT ON barbershop_analytics_daily TO anon;
GRANT SELECT ON barbershop_actionable_leads TO anon;
GRANT SELECT ON barbershop_campaign_tracking TO anon;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify data exists:

-- Check transactions count
SELECT COUNT(*) as transaction_count FROM barbershop_transactions;

-- Check customers count
SELECT COUNT(*) as customer_count FROM barbershop_customers;

-- Check analytics data
SELECT COUNT(*) as analytics_count FROM barbershop_analytics_daily;

-- Check leads data
SELECT COUNT(*) as leads_count FROM barbershop_actionable_leads;

-- Sample transaction data
SELECT * FROM barbershop_transactions ORDER BY transaction_date DESC LIMIT 5;
