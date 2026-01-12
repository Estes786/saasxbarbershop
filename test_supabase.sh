#!/bin/bash

SUPABASE_URL="https://qwqmhvwqeynnyxaecqzw.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk"

echo "🔍 ANALYZING SUPABASE DATABASE SCHEMA..."
echo ""

# Function to check table
check_table() {
  TABLE=$1
  echo "Checking table: $TABLE..."
  
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${SUPABASE_URL}/rest/v1/${TABLE}?limit=1" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Table '$TABLE' EXISTS"
    echo "   Sample: $BODY"
  else
    echo "❌ Table '$TABLE' NOT FOUND or ERROR"
    echo "   Response: $BODY"
  fi
  echo ""
}

# Check all tables
check_table "barbershop_profiles"
check_table "capsters"
check_table "service_catalog"
check_table "bookings"
check_table "customers"
check_table "access_keys"
check_table "loyalty_points"
check_table "branches"

echo "✅ Schema analysis complete!"
