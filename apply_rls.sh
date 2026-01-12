#!/bin/bash

# Supabase Configuration
PROJECT_REF="qwqmhvwqeynnyxaecqzw"
ACCESS_TOKEN="sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4"

echo "🔧 Applying RLS Policies to Supabase..."
echo ""

# Apply the SQL file
curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "query": "-- Drop existing policies on user_profiles\nDROP POLICY IF EXISTS \"service_role_full_access\" ON user_profiles;\nDROP POLICY IF EXISTS \"authenticated_insert_own\" ON user_profiles;\nDROP POLICY IF EXISTS \"authenticated_select_own\" ON user_profiles;\nDROP POLICY IF EXISTS \"authenticated_update_own\" ON user_profiles;\nDROP POLICY IF EXISTS \"Users can view their own profile\" ON user_profiles;\nDROP POLICY IF EXISTS \"Users can update their own profile\" ON user_profiles;\nDROP POLICY IF EXISTS \"Enable insert for authentication users only\" ON user_profiles;\nDROP POLICY IF EXISTS \"users_insert_own_profile\" ON user_profiles;\nDROP POLICY IF EXISTS \"users_select_own_profile\" ON user_profiles;\nDROP POLICY IF EXISTS \"users_update_own_profile\" ON user_profiles;\nDROP POLICY IF EXISTS \"admin_select_all_profiles\" ON user_profiles;\n\n-- Disable RLS on user_profiles\nALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;\n\n-- Re-enable RLS on user_profiles\nALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;\n\n-- Create NEW policies for user_profiles\nCREATE POLICY \"service_role_full_access\" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);\nCREATE POLICY \"users_insert_own_profile\" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);\nCREATE POLICY \"users_select_own_profile\" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);\nCREATE POLICY \"users_update_own_profile\" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);\nCREATE POLICY \"admin_select_all_profiles\" ON user_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));\n\n-- Drop existing policies on barbershop_customers\nDROP POLICY IF EXISTS \"service_role_full_access_customers\" ON barbershop_customers;\nDROP POLICY IF EXISTS \"Enable read access for authenticated users\" ON barbershop_customers;\nDROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON barbershop_customers;\nDROP POLICY IF EXISTS \"customers_view_own_data\" ON barbershop_customers;\nDROP POLICY IF EXISTS \"customers_insert_during_signup\" ON barbershop_customers;\nDROP POLICY IF EXISTS \"admin_view_all_customers\" ON barbershop_customers;\n\n-- Disable RLS on barbershop_customers\nALTER TABLE barbershop_customers DISABLE ROW LEVEL SECURITY;\n\n-- Re-enable RLS on barbershop_customers\nALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;\n\n-- Create NEW policies for barbershop_customers\nCREATE POLICY \"service_role_full_access_customers\" ON barbershop_customers FOR ALL TO service_role USING (true) WITH CHECK (true);\nCREATE POLICY \"customers_view_own_data\" ON barbershop_customers FOR SELECT TO authenticated USING (customer_phone IN (SELECT customer_phone FROM user_profiles WHERE id = auth.uid()));\nCREATE POLICY \"customers_insert_during_signup\" ON barbershop_customers FOR INSERT TO authenticated WITH CHECK (true);\nCREATE POLICY \"admin_view_all_customers\" ON barbershop_customers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));"
}
EOF

echo ""
echo "✅ RLS Policies applied!"
echo ""
echo "Please verify in Supabase Dashboard:"
echo "  1. Go to https://supabase.com/dashboard/project/${PROJECT_REF}/database/tables"
echo "  2. Check RLS policies on user_profiles (5 policies)"
echo "  3. Check RLS policies on barbershop_customers (4 policies)"
