#!/bin/bash

# ========================================
# SUPABASE CONFIGURATION VERIFICATION SCRIPT
# ========================================
# Purpose: Verify database state and identify issues
# Usage: bash scripts/verify-supabase-config.sh
# ========================================

set -e

echo "🔍 OASIS BI PRO x Barbershop - Supabase Configuration Verification"
echo "=================================================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ ERROR: Environment variables not found"
  echo "   Please ensure .env.local exists with:"
  echo "   - NEXT_PUBLIC_SUPABASE_URL"
  echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "✅ Environment variables loaded"
echo "   Supabase URL: ${SUPABASE_URL}"
echo ""

# ========================================
# TEST 1: Check Tables Exist
# ========================================

echo "📋 TEST 1: Checking database tables..."

check_table() {
  local table_name=$1
  local response=$(curl -s "${SUPABASE_URL}/rest/v1/${table_name}?limit=1" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}")
  
  if echo "$response" | grep -q '"code"'; then
    echo "   ❌ ${table_name}: NOT ACCESSIBLE"
    echo "      Error: $(echo $response | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
    return 1
  else
    echo "   ✅ ${table_name}: OK"
    return 0
  fi
}

tables_ok=true
check_table "barbershop_transactions" || tables_ok=false
check_table "barbershop_customers" || tables_ok=false
check_table "barbershop_analytics_daily" || tables_ok=false
check_table "barbershop_actionable_leads" || tables_ok=false

echo ""

# ========================================
# TEST 2: Check Data Counts
# ========================================

echo "📊 TEST 2: Checking data counts..."

get_count() {
  local table_name=$1
  local response=$(curl -s "${SUPABASE_URL}/rest/v1/${table_name}?select=count" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Prefer: count=exact")
  
  local count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
  
  if [ -z "$count" ]; then
    count="ERROR"
  fi
  
  echo "$count"
}

trans_count=$(get_count "barbershop_transactions")
cust_count=$(get_count "barbershop_customers")
analytics_count=$(get_count "barbershop_analytics_daily")
leads_count=$(get_count "barbershop_actionable_leads")

echo "   barbershop_transactions: ${trans_count} rows"
echo "   barbershop_customers: ${cust_count} rows"
echo "   barbershop_analytics_daily: ${analytics_count} rows"
echo "   barbershop_actionable_leads: ${leads_count} rows"
echo ""

# ========================================
# TEST 3: Check RLS Policies
# ========================================

echo "🔒 TEST 3: Testing RLS permissions with anon key..."

# Try to read transactions with anon key
trans_test=$(curl -s "${SUPABASE_URL}/rest/v1/barbershop_transactions?limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if echo "$trans_test" | grep -q '"code":"42501"'; then
  echo "   ❌ RLS Policy: BLOCKING anon access"
  echo "      Error: Permission denied for table barbershop_transactions"
  echo ""
  echo "   🔧 FIX REQUIRED: Run fix_rls_policies.sql in Supabase SQL Editor"
  rls_ok=false
elif echo "$trans_test" | grep -q '\[.*\]'; then
  echo "   ✅ RLS Policy: anon access ALLOWED"
  rls_ok=true
else
  echo "   ⚠️ RLS Policy: UNKNOWN status"
  echo "   Response: ${trans_test}"
  rls_ok=false
fi

echo ""

# ========================================
# TEST 4: Check Edge Functions
# ========================================

echo "⚡ TEST 4: Checking Edge Functions status..."

check_edge_function() {
  local func_name=$1
  local response=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/functions/v1/${func_name}" \
    -H "Authorization: Bearer ${ANON_KEY}")
  
  if [ "$response" == "404" ]; then
    echo "   ❌ ${func_name}: NOT DEPLOYED"
    return 1
  elif [ "$response" == "400" ] || [ "$response" == "200" ]; then
    echo "   ✅ ${func_name}: DEPLOYED"
    return 0
  else
    echo "   ⚠️ ${func_name}: Status ${response}"
    return 1
  fi
}

functions_ok=true
check_edge_function "update-customer-profiles" || functions_ok=false
check_edge_function "generate-actionable-leads" || functions_ok=false
check_edge_function "get-dashboard-data" || functions_ok=false

echo ""

# ========================================
# TEST 5: Sample Data Check
# ========================================

echo "🔍 TEST 5: Analyzing sample transaction data..."

sample_data=$(curl -s "${SUPABASE_URL}/rest/v1/barbershop_transactions?select=transaction_date,customer_name,service_tier,net_revenue&order=transaction_date.desc&limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if echo "$sample_data" | grep -q '"transaction_date"'; then
  echo "   ✅ Sample transactions retrieved successfully"
  echo ""
  echo "   Latest 3 transactions:"
  echo "$sample_data" | jq -r '.[] | "      - \(.transaction_date | split("T")[0]): \(.customer_name) - \(.service_tier) - Rp \(.net_revenue)"' 2>/dev/null || echo "      (jq not installed - raw data available)"
else
  echo "   ❌ Could not retrieve sample data"
  echo "      This indicates RLS policy issues"
fi

echo ""

# ========================================
# SUMMARY & RECOMMENDATIONS
# ========================================

echo "=========================================="
echo "📋 VERIFICATION SUMMARY"
echo "=========================================="
echo ""

all_ok=true

if [ "$tables_ok" == "true" ]; then
  echo "✅ Database Tables: ALL OK"
else
  echo "❌ Database Tables: ISSUES DETECTED"
  all_ok=false
fi

if [ "$trans_count" != "ERROR" ] && [ "$trans_count" -gt 0 ]; then
  echo "✅ Transaction Data: ${trans_count} records found"
else
  echo "⚠️ Transaction Data: No data or inaccessible"
  all_ok=false
fi

if [ "$cust_count" != "ERROR" ] && [ "$cust_count" -gt 0 ]; then
  echo "✅ Customer Profiles: ${cust_count} profiles found"
else
  echo "⚠️ Customer Profiles: Empty or inaccessible"
  echo "   🔧 ACTION: Run 'update-customer-profiles' Edge Function"
fi

if [ "$leads_count" != "ERROR" ] && [ "$leads_count" -gt 0 ]; then
  echo "✅ Actionable Leads: ${leads_count} leads found"
else
  echo "⚠️ Actionable Leads: Empty or inaccessible"
  echo "   🔧 ACTION: Run 'generate-actionable-leads' Edge Function"
fi

if [ "$rls_ok" == "true" ]; then
  echo "✅ RLS Policies: Correctly configured for anon access"
else
  echo "❌ RLS Policies: BLOCKING anon access (CRITICAL)"
  echo "   🔧 ACTION: Run supabase/fix_rls_policies.sql"
  all_ok=false
fi

if [ "$functions_ok" == "true" ]; then
  echo "✅ Edge Functions: All deployed"
else
  echo "⚠️ Edge Functions: Some not deployed"
  echo "   🔧 ACTION: Deploy missing functions with 'supabase functions deploy'"
fi

echo ""

if [ "$all_ok" == "true" ]; then
  echo "🎉 ALL CRITICAL CHECKS PASSED!"
  echo "   Dashboard should be fully functional."
  echo ""
  echo "📊 Next Steps:"
  echo "   1. Open dashboard: https://saasxbarbershop.vercel.app/dashboard/barbershop"
  echo "   2. Verify Revenue Analytics displays data"
  echo "   3. Verify Actionable Leads displays leads"
  exit 0
else
  echo "🚨 CRITICAL ISSUES DETECTED"
  echo ""
  echo "📋 REQUIRED FIXES:"
  echo ""
  if [ "$rls_ok" != "true" ]; then
    echo "   PRIORITY 1 (CRITICAL):"
    echo "   - Run: supabase/fix_rls_policies.sql in Supabase SQL Editor"
    echo "   - This will fix dashboard showing 'Rp 0'"
    echo ""
  fi
  
  if [ "$cust_count" == "ERROR" ] || [ "$cust_count" == "0" ]; then
    echo "   PRIORITY 2 (HIGH):"
    echo "   - Execute: curl -X POST https://qwqmhvwqeynnyxaecqzw.supabase.co/functions/v1/update-customer-profiles \\"
    echo "              -H 'Authorization: Bearer [SERVICE_ROLE_KEY]'"
    echo ""
  fi
  
  if [ "$leads_count" == "ERROR" ] || [ "$leads_count" == "0" ]; then
    echo "   PRIORITY 3 (HIGH):"
    echo "   - Execute: curl -X POST https://qwqmhvwqeynnyxaecqzw.supabase.co/functions/v1/generate-actionable-leads \\"
    echo "              -H 'Authorization: Bearer [SERVICE_ROLE_KEY]'"
    echo ""
  fi
  
  echo "📖 Full Instructions: See IMPLEMENTATION_FIX_GUIDE.md"
  exit 1
fi
