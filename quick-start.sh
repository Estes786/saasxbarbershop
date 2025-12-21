#!/bin/bash

# =====================================================
# OASIS BI PRO - QUICK START SCRIPT
# =====================================================

echo "🚀 OASIS BI PRO - Quick Start"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo "Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials!"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    read -p "Press Enter after editing .env.local..."
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Apply SQL fix to Supabase:"
echo "   - Open: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new"
echo "   - Copy content from: FINAL_DATABASE_FIX.sql"
echo "   - Paste and click RUN"
echo ""
echo "2. Configure Google OAuth (see PANDUAN_FIX_LENGKAP.md)"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Visit: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete project docs"
echo "   - PANDUAN_FIX_LENGKAP.md - Step-by-step guide"
echo "   - EXECUTION_SUMMARY.md - Current status & next steps"
echo ""
