-- 🔍 COMPREHENSIVE DATABASE ANALYSIS
-- Date: 07 January 2026
-- Purpose: Analyze actual database schema di Supabase

-- ============================================
-- 1. ANALYZE ALL TABLES
-- ============================================
SELECT 
    'TABLES' as analysis_type,
    table_schema,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. ANALYZE barbershop_customers TABLE
-- ============================================
SELECT 
    'barbershop_customers COLUMNS' as analysis_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'barbershop_customers'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK IF customer3test@gmail.com EXISTS
-- ============================================
SELECT 
    'customer3test@gmail.com STATUS' as analysis_type,
    user_id,
    customer_name,
    customer_phone,
    total_visits,
    loyalty_points,
    created_at
FROM barbershop_customers
WHERE customer_phone = '+628123456789'
LIMIT 5;

-- ============================================
-- 4. ANALYZE access_keys TABLE
-- ============================================
SELECT 
    'access_keys COLUMNS' as analysis_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'access_keys'
ORDER BY ordinal_position;

-- ============================================
-- 5. CHECK EXISTING ACCESS KEYS
-- ============================================
SELECT 
    'EXISTING ACCESS KEYS' as analysis_type,
    access_key,
    role,
    is_active,
    expires_at,
    created_at
FROM access_keys
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. ANALYZE bookings TABLE
-- ============================================
SELECT 
    'bookings COLUMNS' as analysis_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ============================================
-- 7. CHECK RECENT BOOKINGS
-- ============================================
SELECT 
    'RECENT BOOKINGS' as analysis_type,
    id,
    customer_phone,
    booking_date,
    booking_time,
    status,
    created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 8. ANALYZE capsters TABLE
-- ============================================
SELECT 
    'capsters TABLE ANALYSIS' as analysis_type,
    COUNT(*) as total_capsters,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_capsters,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_capsters
FROM capsters;

-- ============================================
-- 9. CHECK INDEXES
-- ============================================
SELECT 
    'DATABASE INDEXES' as analysis_type,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'barbershop_customers', 'capsters', 'service_catalog')
ORDER BY tablename, indexname;
