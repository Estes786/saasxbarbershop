# 🚀 OASIS BI PRO x Barbershop Data Monetization

**Version**: 1.0  
**Status**: ✅ **PRODUCTION READY**  
**Date**: December 17, 2025

---

## 📊 Project Overview

Sistem terintegrasi untuk mengubah data transaksi barbershop fisik menjadi **Aset Digital Prediktif Abadi** yang menghasilkan insights actionable dan terintegrasi dengan platform OASIS BI PRO SaaS.

### Vision

> **"Data Mentah Barbershop → Supabase Processing → OASIS BI PRO Insights → Predictive Actions → Revenue Growth"**

---

## 🎯 Key Features

### ✅ Real-time Dashboard
- KHL Progress Tracker (Target Rp 2.5M/bulan)
- Actionable Leads (Churn risk, Coupon eligible, Review targets)
- Revenue Analytics (Charts & trends)

### ✅ Google Sheets Integration
- Real-time data collection
- Auto-sync to Supabase (via Apps Script)
- KHL monitoring dashboard

### ✅ Supabase Backend
- 5 optimized tables with RLS security
- PostgreSQL functions for analytics
- RESTful API for dashboard

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 + TypeScript + Tailwind CSS |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Charts** | Recharts |
| **Data Collection** | Google Sheets + Apps Script |
| **Deployment** | Vercel (Frontend) + Supabase (Backend) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account (https://supabase.com)
- Google Sheets account
- Vercel account (for deployment)

### 1. Install Dependencies

\`\`\`bash
cd /home/user/webapp
npm install
\`\`\`

### 2. Setup Environment Variables

Create \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` and add your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://qwqmhvwqeynnyxaecqzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
\`\`\`

### 3. Setup Supabase Database

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy-paste the full schema from uploaded documentation:
   - See: \`/uploaded_files/supabase-schema.sql\`
4. Click **RUN** to execute

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open browser: **http://localhost:3000**

### 5. Setup Google Sheets

1. Create new spreadsheet: "Barbershop Data - OASIS BI PRO"
2. Go to Extensions > Apps Script
3. Copy-paste script from uploaded documentation:
   - See: \`/uploaded_files/GoogleAppsScript.gs\`
4. Run \`setupComplete()\` function
5. Authorize permissions

---

## 📁 Project Structure

\`\`\`
webapp/
├── app/
│   ├── dashboard/
│   │   └── barbershop/
│   │       └── page.tsx          # Main dashboard page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   └── barbershop/
│       ├── KHLTracker.tsx        # KHL Progress component
│       ├── ActionableLeads.tsx   # Leads dashboard component
│       └── RevenueAnalytics.tsx  # Charts component
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   └── types.ts              # TypeScript types
│   └── utils.ts                  # Helper functions
├── supabase/
│   └── schema.sql                # Database schema
├── public/                       # Static files
├── .env.example                  # Environment template
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
\`\`\`

---

## 🔧 Development

### Build Project

\`\`\`bash
npm run build
\`\`\`

### Type Check

\`\`\`bash
npm run type-check
\`\`\`

### Lint

\`\`\`bash
npm run lint
\`\`\`

---

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:

\`\`\`bash
npm install -g vercel
\`\`\`

2. Login to Vercel:

\`\`\`bash
vercel login
\`\`\`

3. Deploy:

\`\`\`bash
cd /home/user/webapp
vercel --prod
\`\`\`

4. Add Environment Variables in Vercel Dashboard:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`SUPABASE_SERVICE_ROLE_KEY\`

### Deploy to GitHub

\`\`\`bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit - OASIS BI PRO x Barbershop"

# Push to GitHub
git remote add origin https://github.com/Estes786/saasxbarbershop.git
git push -u origin main
\`\`\`

---

## 📊 Dashboard Features

### 1. KHL Progress Tracker
- Real-time revenue tracking vs Rp 2.5M target
- Days remaining in month
- Daily target calculation
- Progress percentage with color coding

### 2. Actionable Leads Dashboard
- **High-Value Churn Risk**: Customers >45 days inactive with high ATV
- **Coupon Eligible**: Customers ready for 4+1 free coupon
- **Review Targets**: Customers who should be asked for Google reviews
- WhatsApp message templates for each segment
- One-click WhatsApp integration

### 3. Revenue Analytics
- Daily revenue trends (line chart)
- Daily transactions (bar chart)
- Service tier distribution (pie chart)
- 30-day rolling metrics

---

## 📱 Google Sheets Integration

### Setup Auto-Sync

1. Open spreadsheet
2. Menu: **Barbershop > Setup Auto-Sync**
3. Sync runs hourly automatically

### Manual Sync

1. Menu: **Barbershop > Sync to Supabase**
2. Wait for completion message

### Test Connection

1. Menu: **Barbershop > Test Connection**
2. Verify Supabase connection works

---

## 🔐 Security

### Row Level Security (RLS)

- All tables have RLS enabled
- Service role can perform all operations
- Authenticated users can read data
- No public access without authentication

### API Keys

- **Anon Key**: Safe for client-side (limited access)
- **Service Role Key**: Server-side only (full access)
- Never commit \`.env.local\` to git

---

## 📈 Metrics & KPIs

### Daily Tracking
- Total revenue
- Number of transactions
- Average ATV
- KHL progress percentage

### Weekly Tracking
- New vs returning customers
- Churn rate
- Upsell rate
- Leads contacted

### Monthly Tracking
- KHL achievement (Rp 2.5M+)
- Customer lifetime value
- Google reviews collected
- OASIS BI PRO signups

---

## 🐛 Troubleshooting

### Dashboard Shows "Error connecting to database"

**Solution**: 
1. Check environment variables in \`.env.local\`
2. Verify Supabase URL and Anon Key are correct
3. Check Supabase project is not paused
4. Test connection in Supabase Dashboard

### Google Sheets Sync Fails

**Solution**:
1. Check Service Role Key in SUPABASE SYNC CONFIG tab
2. Verify table \`barbershop_transactions\` exists in Supabase
3. Check Apps Script logs for detailed errors
4. Re-authorize Apps Script permissions

### Charts Not Showing

**Solution**:
1. Ensure data exists in database
2. Check browser console for errors
3. Verify Recharts library is installed: \`npm install recharts\`

---

## 📞 Support

### Technical Issues
- GitHub Issues: https://github.com/Estes786/saasxbarbershop/issues

### Documentation
- Full Blueprint: See uploaded documentation files
- Google Sheets Template: See \`GOOGLE_SHEETS_TEMPLATE.md\`
- Database Schema: See \`supabase-schema.sql\`

---

## 📝 Changelog

### Version 1.0 (December 17, 2025)

- ✅ Initial release
- ✅ Next.js 15 dashboard with TypeScript
- ✅ Supabase integration (5 tables + RLS)
- ✅ KHL Tracker component
- ✅ Actionable Leads component
- ✅ Revenue Analytics with Recharts
- ✅ Google Sheets sync via Apps Script
- ✅ WhatsApp integration
- ✅ Responsive design (mobile-ready)

---

## 🎓 Training Resources

### For Barbershop Staff
1. **Data Entry Tutorial** (see uploaded documentation)
2. **Dashboard Overview** (see uploaded documentation)
3. **WhatsApp Best Practices** (see uploaded documentation)

### For Developers
1. **API Reference** (see uploaded documentation)
2. **Component Architecture** (see project structure above)
3. **Deployment Guide** (see Deployment section)

---

## 🏆 Success Metrics

### Barbershop Goals (Month 1-3)
- ✅ Achieve Rp 2.5M+ monthly revenue consistently
- ✅ Reduce churn rate to <15%
- ✅ Increase upsell rate to 30%+
- ✅ Collect 50+ Google reviews

### OASIS BI PRO Goals (Month 1-3)
- ✅ Live proof of concept with real data
- ✅ 10+ beta users from barbershop network
- ✅ Comprehensive case study published
- ✅ Rp 10M+ MRR from public launch

---

## 📄 License

**Proprietary - Internal Use Only**

This project is proprietary to OASIS BI PRO and Barbershop Kedungrandu. All rights reserved.

---

**🚀 Built with ❤️ by OASIS BI PRO Team**

**Location**: Jl. Raya Kedungrandu, Patikraja, Banyumas  
**Contact**: [Owner Contact Info]  
**Website**: [OASIS BI PRO Website]

---

**Ready to monetize your barbershop data! Let's GO! 🚀**
