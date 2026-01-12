#!/bin/bash

# Supabase connection details
DB_HOST="aws-0-ap-southeast-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.qwqmhvwqeynnyxaecqzw"
DB_PASSWORD="Bayhaqi@123"  # Get from Supabase project settings

SQL_FILE="migrations/PHASE_1_MULTI_LOCATION_SAFE.sql"

echo "🚀 Executing Phase 1 Multi-Location Migration..."
echo "📁 SQL File: $SQL_FILE"
echo ""

# Check if PostgreSQL client is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found!"
    echo "Installing postgresql-client..."
    apt-get update -qq && apt-get install -y -qq postgresql-client > /dev/null 2>&1
fi

# Execute SQL file
echo "⚙️ Executing SQL migration..."
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$SQL_FILE" \
    2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Migration executed successfully!"
    echo ""
    echo "🔍 Verifying migration..."
    
    # Verify branches table exists
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "SELECT COUNT(*) as branch_count FROM public.branches;" \
        2>&1
        
    echo ""
    echo "✅ Phase 1 Migration Complete!"
else
    echo ""
    echo "❌ Migration failed with exit code: $EXIT_CODE"
    exit $EXIT_CODE
fi
