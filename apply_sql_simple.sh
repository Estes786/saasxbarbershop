#!/bin/bash

echo "🚀 Applying Safe 3-Role Schema to Supabase"
echo "=========================================="
echo ""

# Buat file sementara dengan semua DROP POLICY statements
cat > /tmp/01_drop_policies.sql << 'EOF'
-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog;
DROP POLICY IF EXISTS "service_catalog_write_admin" ON service_catalog;
DROP POLICY IF EXISTS "capsters_read_all" ON capsters;
DROP POLICY IF EXISTS "capsters_update_own" ON capsters;
DROP POLICY IF EXISTS "capsters_admin_all" ON capsters;
DROP POLICY IF EXISTS "booking_slots_read_all" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_manage_own" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_admin_all" ON booking_slots;
DROP POLICY IF EXISTS "customer_loyalty_read_own" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_read_capster_admin" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_loyalty_update_admin" ON customer_loyalty;
DROP POLICY IF EXISTS "customer_reviews_read_approved" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_create_own" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_read_all_staff" ON customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_manage_admin" ON customer_reviews;
DROP POLICY IF EXISTS "user_profiles_read_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_read_all_admin" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON user_profiles;
EOF

echo "✅ Created policy drop script"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new"
echo ""
echo "2. Copy and run this DROP POLICY script first:"
echo "   cat /tmp/01_drop_policies.sql"
echo ""
echo "3. Then copy and run the full schema:"
echo "   cat /home/user/webapp/SAFE_3_ROLE_SCHEMA.sql"
echo ""
echo "💡 Or, you can run this command to view both scripts:"
echo "   cat /tmp/01_drop_policies.sql && echo '' && echo '-- Now run SAFE_3_ROLE_SCHEMA.sql' && cat /home/user/webapp/SAFE_3_ROLE_SCHEMA.sql"
echo ""
