#!/bin/bash
# Execute SQL script directly to Supabase using PostgreSQL connection

SUPABASE_URL="https://qwqmhvwqeynnyxaecqzw.supabase.co"
DB_PASSWORD="HyydarMursyadHilmy123"  # This would be your database password
PROJECT_REF="qwqmhvwqeynnyxaecqzw"

# Alternative: Use Supabase CLI
echo "🚀 Executing ACCESS KEY System via Supabase..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Execute SQL file
echo "📝 Reading SQL file..."
SQL_CONTENT=$(cat IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql)

# Use psql if available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found, executing..."
    PGPASSWORD="${DB_PASSWORD}" psql \
      -h "aws-0-ap-southeast-1.pooler.supabase.com" \
      -p 6543 \
      -U "postgres.${PROJECT_REF}" \
      -d "postgres" \
      -f "IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql"
else
    echo "❌ psql not available"
    echo ""
    echo "📋 MANUAL EXECUTION REQUIRED:"
    echo "1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
    echo "2. Copy file: IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql"
    echo "3. Paste and click RUN"
    echo ""
fi
