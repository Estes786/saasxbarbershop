#!/bin/bash

# Script to apply SQL fix to Supabase using psql
# This uses the connection details from Supabase

echo "🚀 APPLYING SQL FIX TO SUPABASE..."
echo "========================================"

# Supabase connection details
export PGHOST="aws-0-ap-southeast-1.pooler.supabase.com"
export PGPORT="6543"
export PGDATABASE="postgres"
export PGUSER="postgres.qwqmhvwqeynnyxaecqzw"
export PGPASSWORD="Syawal199898@supabase"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed"
    echo "   Installing postgresql-client..."
    sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-client
fi

# Apply SQL script
echo ""
echo "📝 Applying FINAL_COMPREHENSIVE_IDEMPOTENT_FIX.sql..."
echo ""

psql -f FINAL_COMPREHENSIVE_IDEMPOTENT_FIX.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ SQL FIX APPLIED SUCCESSFULLY!"
    echo "========================================="
else
    echo ""
    echo "========================================="
    echo "❌ ERROR APPLYING SQL FIX"
    echo "========================================="
    exit 1
fi
