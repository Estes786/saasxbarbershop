# 📦 REQUIRED EDGE FUNCTIONS

**Project**: BALIK.LAGI x Barbershop  
**Purpose**: Auto-populate aggregated tables for optimal performance

---

## 🎯 OVERVIEW

Edge Functions ini OPTIONAL. Dashboard sudah berfungsi dengan baik menggunakan client-side calculation. Edge Functions hanya diperlukan jika:

1. Data transaksi >1000 records (untuk performa)
2. Ingin scheduled aggregation (daily cron job)
3. Ingin pre-calculated analytics untuk instant load

---

## 🔧 EDGE FUNCTION #1: update-analytics-daily

### Purpose
Auto-populate tabel `barbershop_analytics_daily` setiap hari

### Trigger
- **Schedule**: Daily at 00:00 (midnight)
- **OR Manual**: After bulk transaction import

### SQL Logic
```sql
INSERT INTO barbershop_analytics_daily (
  date,
  total_revenue,
  total_transactions,
  average_atv,
  new_customers,
  returning_customers,
  total_unique_customers,
  basic_tier_count,
  premium_tier_count,
  mastery_tier_count,
  upsell_rate,
  coupons_redeemed,
  reviews_requested,
  day_of_week,
  is_weekend
)
SELECT 
  DATE(transaction_date) as date,
  COALESCE(SUM(net_revenue), 0) as total_revenue,
  COUNT(*) as total_transactions,
  COALESCE(AVG(net_revenue), 0) as average_atv,
  
  -- New vs Returning customers
  COUNT(DISTINCT CASE 
    WHEN (SELECT COUNT(*) FROM barbershop_transactions t2 
          WHERE t2.customer_phone = t.customer_phone 
          AND t2.transaction_date < t.transaction_date) = 0 
    THEN t.customer_phone END) as new_customers,
  COUNT(DISTINCT CASE 
    WHEN (SELECT COUNT(*) FROM barbershop_transactions t2 
          WHERE t2.customer_phone = t.customer_phone 
          AND t2.transaction_date < t.transaction_date) > 0 
    THEN t.customer_phone END) as returning_customers,
  COUNT(DISTINCT customer_phone) as total_unique_customers,
  
  -- Service tier breakdown
  COUNT(*) FILTER (WHERE service_tier = 'Basic') as basic_tier_count,
  COUNT(*) FILTER (WHERE service_tier = 'Premium') as premium_tier_count,
  COUNT(*) FILTER (WHERE service_tier = 'Mastery') as mastery_tier_count,
  
  -- Upsell rate
  ROUND((COUNT(*) FILTER (WHERE upsell_items IS NOT NULL AND upsell_items != '')::NUMERIC / COUNT(*) * 100), 2) as upsell_rate,
  
  -- Loyalty metrics
  COUNT(*) FILTER (WHERE is_coupon_redeemed = TRUE) as coupons_redeemed,
  COUNT(*) FILTER (WHERE is_google_review_asked = TRUE) as reviews_requested,
  
  -- Day of week
  TO_CHAR(transaction_date, 'Day') as day_of_week,
  EXTRACT(DOW FROM transaction_date) IN (0, 6) as is_weekend

FROM barbershop_transactions t
WHERE DATE(transaction_date) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(transaction_date)
ON CONFLICT (date) 
DO UPDATE SET
  total_revenue = EXCLUDED.total_revenue,
  total_transactions = EXCLUDED.total_transactions,
  average_atv = EXCLUDED.average_atv,
  new_customers = EXCLUDED.new_customers,
  returning_customers = EXCLUDED.returning_customers,
  total_unique_customers = EXCLUDED.total_unique_customers,
  basic_tier_count = EXCLUDED.basic_tier_count,
  premium_tier_count = EXCLUDED.premium_tier_count,
  mastery_tier_count = EXCLUDED.mastery_tier_count,
  upsell_rate = EXCLUDED.upsell_rate,
  coupons_redeemed = EXCLUDED.coupons_redeemed,
  reviews_requested = EXCLUDED.reviews_requested,
  day_of_week = EXCLUDED.day_of_week,
  is_weekend = EXCLUDED.is_weekend,
  updated_at = NOW();
```

### TypeScript Implementation (Edge Function)
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Execute aggregation SQL
    const { data, error } = await supabaseClient.rpc('aggregate_daily_analytics', {
      target_date: new Date().toISOString().split('T')[0]
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Analytics aggregated successfully' }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

---

## 🔧 EDGE FUNCTION #2: generate-actionable-leads

### Purpose
Auto-populate tabel `barbershop_actionable_leads` dengan segmented leads

### Trigger
- **Schedule**: Daily at 08:00 (morning)
- **OR**: After customer profile update

### Logic

#### High-Value Churn Risk
```sql
INSERT INTO barbershop_actionable_leads (
  customer_phone,
  customer_name,
  lead_segment,
  priority,
  recommended_action,
  whatsapp_message_template,
  days_since_last_visit,
  average_atv,
  total_visits
)
SELECT 
  customer_phone,
  customer_name,
  'high_value_churn' as lead_segment,
  'HIGH' as priority,
  'Segera hubungi untuk re-engagement' as recommended_action,
  'Halo ' || customer_name || '! 👋 Sudah lama tidak berkunjung ke barbershop kami. Kami punya promo spesial untuk Anda! Kapan bisa mampir lagi?' as whatsapp_message_template,
  EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400 as days_since_last_visit,
  average_atv,
  total_visits
FROM barbershop_customers
WHERE 
  EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400 > 45
  AND average_atv > 45000
  AND NOT EXISTS (
    SELECT 1 FROM barbershop_actionable_leads l
    WHERE l.customer_phone = barbershop_customers.customer_phone
    AND l.lead_segment = 'high_value_churn'
    AND l.is_contacted = FALSE
  );
```

#### Coupon Eligible
```sql
INSERT INTO barbershop_actionable_leads (
  customer_phone,
  customer_name,
  lead_segment,
  priority,
  recommended_action,
  whatsapp_message_template,
  days_since_last_visit,
  average_atv,
  total_visits
)
SELECT 
  customer_phone,
  customer_name,
  'coupon_eligible' as lead_segment,
  'MEDIUM' as priority,
  'Ingatkan tentang kupon gratis 4+1' as recommended_action,
  'Selamat ' || customer_name || '! 🎉 Anda sudah mencapai ' || total_visits || ' kunjungan. Kunjungan berikutnya GRATIS dengan kupon 4+1! Yuk booking sekarang!' as whatsapp_message_template,
  EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400 as days_since_last_visit,
  average_atv,
  total_visits
FROM barbershop_customers
WHERE 
  coupon_eligible = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM barbershop_actionable_leads l
    WHERE l.customer_phone = barbershop_customers.customer_phone
    AND l.lead_segment = 'coupon_eligible'
    AND l.is_contacted = FALSE
  );
```

#### Review Target
```sql
INSERT INTO barbershop_actionable_leads (
  customer_phone,
  customer_name,
  lead_segment,
  priority,
  recommended_action,
  whatsapp_message_template,
  days_since_last_visit,
  average_atv,
  total_visits
)
SELECT 
  customer_phone,
  customer_name,
  'review_target' as lead_segment,
  'LOW' as priority,
  'Request Google Review' as recommended_action,
  'Halo ' || customer_name || '! Terima kasih sudah setia dengan kami 🙏 Boleh minta tolong review di Google? Sangat membantu bisnis kami!' as whatsapp_message_template,
  EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400 as days_since_last_visit,
  average_atv,
  total_visits
FROM barbershop_customers
WHERE 
  total_visits >= 2
  AND google_review_given = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM barbershop_actionable_leads l
    WHERE l.customer_phone = barbershop_customers.customer_phone
    AND l.lead_segment = 'review_target'
    AND l.is_contacted = FALSE
  );
```

---

## 📅 CRON SCHEDULE (Optional)

If you want to set up Supabase Cron Jobs:

```sql
-- Daily analytics aggregation at midnight
SELECT cron.schedule(
  'daily-analytics-aggregation',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/update-analytics-daily',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Daily leads generation at 8 AM
SELECT cron.schedule(
  'daily-leads-generation',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-actionable-leads',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## ⚠️ IMPORTANT NOTES

### DO NOT Deploy Edge Functions If:
- You have < 100 transactions total
- Dashboard loads fast enough with manual calculation
- You don't need scheduled aggregation

### DO Deploy Edge Functions If:
- You have 1000+ transactions
- Dashboard becomes slow
- You want daily scheduled reports
- You want to reduce client-side computation

### Current Status
**✅ Dashboard works perfectly WITHOUT Edge Functions** using fallback manual calculation. Edge Functions are a **performance optimization**, not a requirement.

---

## 🔗 RESOURCES

- Supabase Edge Functions Docs: https://supabase.com/docs/guides/functions
- Supabase pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- Current working files: `/supabase/functions/*/index.ts`

---

**Recommendation**: Keep using manual calculation for now. Only deploy Edge Functions when you actually need them (performance issues or scheduled automation).
