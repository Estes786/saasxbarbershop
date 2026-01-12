#!/bin/bash

echo "🚀 Applying Comprehensive Booking Fix to Supabase..."
echo ""

SUPABASE_URL="https://qwqmhvwqeynnyxaecqzw.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk"

# Read SQL file
SQL_CONTENT=$(cat FIX_BOOKING_COMPREHENSIVE_ULTIMATE_06JAN2026.sql)

# Apply to Supabase via REST API
response=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}" 2>&1)

echo "Response: $response"
echo ""
echo "✅ SQL script executed!"
echo "Check Supabase SQL Editor for detailed output"

