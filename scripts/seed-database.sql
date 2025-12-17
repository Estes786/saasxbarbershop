-- ========================================
-- SEED DATABASE - Sample Data for Testing
-- ========================================
-- Project: OASIS BI PRO x Barbershop
-- Date: December 17, 2025
-- Purpose: Populate database with test data
-- ========================================

-- Step 1: Insert Sample Transactions
-- ========================================
INSERT INTO barbershop_transactions (
  transaction_date, 
  customer_phone, 
  customer_name, 
  service_tier, 
  upsell_items, 
  atv_amount, 
  discount_amount, 
  is_coupon_redeemed, 
  is_google_review_asked, 
  customer_area, 
  capster_name
) VALUES
  -- Today's transactions
  (NOW(), '081234567890', 'Budi Santoso', 'Basic', NULL, 20000, 0, FALSE, FALSE, 'Patikraja', 'Owner'),
  (NOW() - INTERVAL '1 hour', '082345678901', 'Agus Wijaya', 'Premium', 'Hair Tonic', 45000, 0, FALSE, TRUE, 'Kedungrandu', 'Owner'),
  (NOW() - INTERVAL '2 hours', '083456789012', 'Dedi Kurniawan', 'Mastery', 'Coloring, Massage', 75000, 0, FALSE, FALSE, 'Banyumas', 'Staff 1'),
  
  -- Yesterday's transactions
  (NOW() - INTERVAL '1 day', '081234567890', 'Budi Santoso', 'Basic', NULL, 20000, 0, FALSE, FALSE, 'Patikraja', 'Owner'),
  (NOW() - INTERVAL '1 day' - INTERVAL '3 hours', '084567890123', 'Eko Prasetyo', 'Premium', 'Hair Tonic', 40000, 5000, TRUE, TRUE, 'Kebumen', 'Staff 2'),
  
  -- 2 days ago
  (NOW() - INTERVAL '2 days', '085678901234', 'Fauzi Rahman', 'Mastery', 'Coloring, Beard Trim', 80000, 0, FALSE, FALSE, 'Patikraja', 'Owner'),
  (NOW() - INTERVAL '2 days' - INTERVAL '2 hours', '086789012345', 'Gunawan Saputra', 'Premium', 'Hair Tonic', 45000, 0, FALSE, FALSE, 'Kedungrandu', 'Staff 1'),
  
  -- 3 days ago
  (NOW() - INTERVAL '3 days', '087890123456', 'Hendra Wijaya', 'Basic', NULL, 20000, 0, FALSE, TRUE, 'Banyumas', 'Owner'),
  (NOW() - INTERVAL '3 days' - INTERVAL '1 hour', '088901234567', 'Irfan Hakim', 'Premium', 'Hair Tonic', 42000, 0, FALSE, FALSE, 'Patikraja', 'Staff 2'),
  
  -- 4 days ago
  (NOW() - INTERVAL '4 days', '089012345678', 'Joko Santoso', 'Mastery', 'Coloring', 70000, 0, FALSE, FALSE, 'Kedungrandu', 'Owner'),
  (NOW() - INTERVAL '4 days' - INTERVAL '3 hours', '081234567890', 'Budi Santoso', 'Basic', NULL, 20000, 0, FALSE, FALSE, 'Patikraja', 'Owner'),
  
  -- 5-7 days ago (older transactions for trend analysis)
  (NOW() - INTERVAL '5 days', '082345678901', 'Agus Wijaya', 'Premium', 'Hair Tonic', 45000, 0, FALSE, FALSE, 'Kedungrandu', 'Staff 1'),
  (NOW() - INTERVAL '6 days', '083456789012', 'Dedi Kurniawan', 'Mastery', 'Massage', 75000, 0, FALSE, TRUE, 'Banyumas', 'Owner'),
  (NOW() - INTERVAL '7 days', '090123456789', 'Krisna Adi', 'Premium', 'Hair Tonic', 43000, 0, FALSE, FALSE, 'Kebumen', 'Staff 2'),
  
  -- Repeat customers untuk testing loyalty program
  (NOW() - INTERVAL '10 days', '081234567890', 'Budi Santoso', 'Basic', NULL, 20000, 0, FALSE, FALSE, 'Patikraja', 'Owner'),
  (NOW() - INTERVAL '15 days', '082345678901', 'Agus Wijaya', 'Premium', NULL, 40000, 0, FALSE, FALSE, 'Kedungrandu', 'Owner'),
  (NOW() - INTERVAL '20 days', '083456789012', 'Dedi Kurniawan', 'Mastery', 'Coloring', 78000, 0, FALSE, FALSE, 'Banyumas', 'Staff 1'),
  
  -- High-value customers for churn risk testing
  (NOW() - INTERVAL '50 days', '091234567890', 'Luthfi Hakim', 'Mastery', 'Coloring, Massage', 90000, 0, FALSE, TRUE, 'Patikraja', 'Owner'),
  (NOW() - INTERVAL '55 days', '092345678901', 'Made Wirawan', 'Mastery', 'Premium Package', 85000, 0, FALSE, FALSE, 'Kedungrandu', 'Staff 2'),
  (NOW() - INTERVAL '60 days', '093456789012', 'Nanda Pratama', 'Premium', 'Hair Tonic', 48000, 0, FALSE, FALSE, 'Banyumas', 'Owner');

-- Verify transactions inserted
SELECT COUNT(*) as total_transactions FROM barbershop_transactions;

-- Step 2: Update Customer Profiles
-- ========================================
-- This will auto-calculate metrics for each customer

-- Get unique customers
DO $$
DECLARE
  phone TEXT;
  customer_rec RECORD;
BEGIN
  FOR phone IN SELECT DISTINCT customer_phone FROM barbershop_transactions LOOP
    -- Get customer transactions
    SELECT 
      COUNT(*) as total_visits,
      SUM(net_revenue) as total_revenue,
      AVG(atv_amount) as average_atv,
      MAX(transaction_date) as last_visit_date,
      MIN(transaction_date) as first_visit_date,
      MAX(customer_name) as customer_name,
      MAX(customer_area) as customer_area
    INTO customer_rec
    FROM barbershop_transactions
    WHERE customer_phone = phone;
    
    -- Calculate coupon eligibility
    INSERT INTO barbershop_customers (
      customer_phone,
      customer_name,
      customer_area,
      total_visits,
      total_revenue,
      average_atv,
      last_visit_date,
      first_visit_date,
      customer_segment,
      lifetime_value,
      coupon_count,
      coupon_eligible,
      updated_at
    ) VALUES (
      phone,
      customer_rec.customer_name,
      customer_rec.customer_area,
      customer_rec.total_visits,
      customer_rec.total_revenue,
      customer_rec.average_atv,
      customer_rec.last_visit_date,
      customer_rec.first_visit_date,
      CASE 
        WHEN customer_rec.total_visits >= 10 THEN 'VIP'
        WHEN customer_rec.total_visits >= 3 THEN 'Regular'
        ELSE 'New'
      END,
      customer_rec.total_revenue,
      FLOOR(customer_rec.total_visits / 4),
      (customer_rec.total_visits % 4 = 0 AND customer_rec.total_visits > 0),
      NOW()
    )
    ON CONFLICT (customer_phone) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_area = EXCLUDED.customer_area,
      total_visits = EXCLUDED.total_visits,
      total_revenue = EXCLUDED.total_revenue,
      average_atv = EXCLUDED.average_atv,
      last_visit_date = EXCLUDED.last_visit_date,
      customer_segment = EXCLUDED.customer_segment,
      lifetime_value = EXCLUDED.lifetime_value,
      coupon_count = EXCLUDED.coupon_count,
      coupon_eligible = EXCLUDED.coupon_eligible,
      updated_at = NOW();
  END LOOP;
END $$;

-- Verify customers inserted
SELECT COUNT(*) as total_customers FROM barbershop_customers;

-- Step 3: Generate Actionable Leads
-- ========================================
-- This generates sample leads for testing

-- High-value churn risk leads
INSERT INTO barbershop_actionable_leads (
  customer_phone,
  customer_name,
  lead_segment,
  priority,
  recommended_action,
  whatsapp_message_template,
  days_since_last_visit,
  average_atv,
  total_visits,
  lifetime_value,
  is_contacted,
  expires_at
)
SELECT 
  customer_phone,
  customer_name,
  'high_value_churn',
  'HIGH',
  'Kirim WA: Promo eksklusif comeback untuk pelanggan VIP',
  'Halo ' || customer_name || '! 👋 Kami kangen sama ' || customer_name || '! Sudah lama ga ketemu nih. Khusus untuk ' || customer_name || ', ada PROMO COMEBACK SPESIAL! 🎉',
  EXTRACT(DAY FROM (NOW() - last_visit_date))::INTEGER,
  average_atv,
  total_visits,
  lifetime_value,
  FALSE,
  NOW() + INTERVAL '7 days'
FROM barbershop_customers
WHERE EXTRACT(DAY FROM (NOW() - last_visit_date)) > 45 
  AND average_atv > 45000
LIMIT 5;

-- Coupon eligible leads
INSERT INTO barbershop_actionable_leads (
  customer_phone,
  customer_name,
  lead_segment,
  priority,
  recommended_action,
  whatsapp_message_template,
  days_since_last_visit,
  average_atv,
  total_visits,
  lifetime_value,
  is_contacted,
  expires_at
)
SELECT 
  customer_phone,
  customer_name,
  'coupon_eligible',
  'MEDIUM',
  'Kirim WA: Notifikasi kupon 4+1 gratis siap digunakan',
  'Selamat ' || customer_name || '! 🎉 Kupon 4+1 kamu AKTIF! Sudah ' || total_visits || 'x kunjungan = 1x GRATIS HAIRCUT!',
  EXTRACT(DAY FROM (NOW() - last_visit_date))::INTEGER,
  average_atv,
  total_visits,
  lifetime_value,
  FALSE,
  NOW() + INTERVAL '14 days'
FROM barbershop_customers
WHERE coupon_eligible = TRUE
LIMIT 5;

-- Review target leads
INSERT INTO barbershop_actionable_leads (
  customer_phone,
  customer_name,
  lead_segment,
  priority,
  recommended_action,
  whatsapp_message_template,
  days_since_last_visit,
  average_atv,
  total_visits,
  lifetime_value,
  is_contacted,
  expires_at
)
SELECT 
  customer_phone,
  customer_name,
  'review_target',
  'LOW',
  'Kirim WA: Request Google review',
  'Halo ' || customer_name || '! 🙏 Terima kasih sudah ' || total_visits || 'x percaya sama kami! Boleh minta bantuan review di Google Maps?',
  EXTRACT(DAY FROM (NOW() - last_visit_date))::INTEGER,
  average_atv,
  total_visits,
  lifetime_value,
  FALSE,
  NOW() + INTERVAL '30 days'
FROM barbershop_customers
WHERE total_visits >= 2 
  AND google_review_given = FALSE
LIMIT 5;

-- Verify leads inserted
SELECT COUNT(*) as total_leads FROM barbershop_actionable_leads;

-- Step 4: Summary Report
-- ========================================
SELECT 
  '✅ SEED COMPLETE!' as status,
  (SELECT COUNT(*) FROM barbershop_transactions) as total_transactions,
  (SELECT COUNT(*) FROM barbershop_customers) as total_customers,
  (SELECT COUNT(*) FROM barbershop_actionable_leads) as total_leads,
  (SELECT SUM(net_revenue) FROM barbershop_transactions) as total_revenue;

-- Show sample data
SELECT 
  'Sample Transactions' as data_type,
  transaction_date,
  customer_name,
  service_tier,
  net_revenue
FROM barbershop_transactions
ORDER BY transaction_date DESC
LIMIT 5;

SELECT 
  'Sample Customers' as data_type,
  customer_name,
  total_visits,
  customer_segment,
  coupon_eligible
FROM barbershop_customers
ORDER BY total_visits DESC
LIMIT 5;

SELECT 
  'Sample Leads' as data_type,
  customer_name,
  lead_segment,
  priority,
  days_since_last_visit
FROM barbershop_actionable_leads
ORDER BY priority, generated_at DESC
LIMIT 5;

-- ========================================
-- END OF SEED SCRIPT
-- ========================================
-- Next steps:
-- 1. Verify data in Supabase dashboard
-- 2. Test dashboard: http://localhost:3000/dashboard/barbershop
-- 3. Test refresh mechanism by adding new transaction
-- ========================================
