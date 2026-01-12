#!/bin/bash

# Supabase credentials
ACCESS_TOKEN="sbp_9c6004e480e4573b8ad35f7100259cd94ef526b4"
PROJECT_REF="qwqmhvwqeynnyxaecqzw"
SQL_FILE="COMPREHENSIVE_FIX_WITH_SECRET_KEY_SYSTEM.sql"

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 EXECUTING SQL SCRIPT TO SUPABASE VIA CLI"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📄 SQL File: $SQL_FILE"
echo "🔗 Project: $PROJECT_REF"
echo ""

# Execute SQL using supabase CLI
supabase db execute --project-ref "$PROJECT_REF" \
  --access-token "$ACCESS_TOKEN" \
  --file "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SQL script executed successfully!"
else
    echo ""
    echo "❌ Execution failed! Please execute manually in SQL Editor:"
    echo "   https://$PROJECT_REF.supabase.co/project/_/sql"
fi
