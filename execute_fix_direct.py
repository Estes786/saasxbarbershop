#!/usr/bin/env python3
"""
EXECUTE ULTIMATE ONBOARDING FIX - DIRECT DATABASE CONNECTION
This script connects directly to Supabase PostgreSQL and executes the fix
"""

import os
import sys

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ psycopg2 not installed. Installing...")
    os.system("pip3 install psycopg2-binary -q")
    import psycopg2
    from psycopg2 import sql

# Database connection details from Supabase
DB_HOST = "aws-0-ap-southeast-1.pooler.supabase.com"
DB_NAME = "postgres"
DB_USER = "postgres.qwqmhvwqeynnyxaecqzw"
DB_PASSWORD = "baliklagi.1.q.q"  # You need to provide this
DB_PORT = "6543"

def execute_fix():
    print("🚀 EXECUTING ULTIMATE ONBOARDING FIX - DIRECT CONNECTION\n")
    print("=" * 80)
    
    # Read SQL file
    try:
        with open("./ULTIMATE_ONBOARDING_FIX_30DEC2025.sql", "r") as f:
            sql_content = f.read()
        print(f"✅ SQL file loaded successfully\n")
    except FileNotFoundError:
        print("❌ SQL file not found: ULTIMATE_ONBOARDING_FIX_30DEC2025.sql")
        return

    # Connect to database
    print("🔌 Connecting to Supabase PostgreSQL...")
    try:
        conn_string = f"host={DB_HOST} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} port={DB_PORT}"
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cursor = conn.cursor()
        print("✅ Connected successfully!\n")
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}\n")
        print("⚠️  Using Supabase REST API instead...\n")
        execute_via_api()
        return

    # Execute SQL
    print("⚡ Executing SQL fix...\n")
    try:
        cursor.execute(sql_content)
        print("✅ SQL executed successfully!\n")
        
        # Fetch any results/notices
        try:
            notices = conn.notices
            for notice in notices:
                print(notice.strip())
        except:
            pass

    except Exception as e:
        print(f"❌ Execution error: {str(e)}\n")
        conn.rollback()
        return

    # Verify fix
    print("\n" + "=" * 80)
    print("🔍 VERIFYING FIX...\n")

    try:
        # Check barbershops
        cursor.execute("SELECT COUNT(*) FROM barbershops")
        bb_count = cursor.fetchone()[0]
        print(f"✅ Total barbershops: {bb_count}")

        # Check orphaned capsters
        cursor.execute("SELECT COUNT(*) FROM capsters WHERE barbershop_id IS NULL")
        orphan_count = cursor.fetchone()[0]
        print(f"✅ Orphaned capsters (should be 0): {orphan_count}")

        # Check total capsters
        cursor.execute("SELECT COUNT(*) FROM capsters")
        capster_count = cursor.fetchone()[0]
        print(f"✅ Total capsters: {capster_count}")

        print("\n" + "=" * 80)
        print("✅ VERIFICATION COMPLETE!\n")

        if orphan_count == 0:
            print("🎉 SUCCESS! All capsters now have valid barbershop_id")
        else:
            print("⚠️  Warning: Still have orphaned capsters")

    except Exception as e:
        print(f"❌ Verification error: {str(e)}")

    # Close connection
    cursor.close()
    conn.close()

def execute_via_api():
    """Alternative method using Supabase REST API"""
    print("📋 INSTRUCTIONS FOR MANUAL EXECUTION:\n")
    print("1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw")
    print("2. Go to SQL Editor")
    print("3. Click 'New Query'")
    print("4. Copy the entire contents of: ULTIMATE_ONBOARDING_FIX_30DEC2025.sql")
    print("5. Paste into SQL Editor")
    print("6. Click 'RUN' or press Ctrl+Enter")
    print("7. Check the Results panel for success messages\n")
    
    print("=" * 80)
    print("📄 SQL FILE PATH:")
    print(os.path.abspath("./ULTIMATE_ONBOARDING_FIX_30DEC2025.sql"))
    print("\n")

if __name__ == "__main__":
    # Check if database password provided
    if DB_PASSWORD == "baliklagi.1.q.q" or not DB_PASSWORD:
        print("⚠️  Database password not configured")
        print("Using manual execution method...\n")
        execute_via_api()
    else:
        execute_fix()
