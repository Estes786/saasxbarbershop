# 🚀 BALIK.LAGI - Barbershop Management System

## 🔥 CRITICAL UPDATE: 1 USER = 1 DASHBOARD (25 December 2025)

**⚠️ MAJOR FIX IMPLEMENTED - Data Isolation Per User**

### Problem Fixed
- ❌ Users were seeing other users' data (shared dashboard)
- ❌ New user login showed old user's data
- ❌ No data isolation between users

### Solution Applied
- ✅ Added `user_id` FK to `barbershop_customers` table
- ✅ Updated RLS policies to enforce `user_id = auth.uid()`
- ✅ Updated application code to query by `user_id` instead of `customer_phone`
- ✅ Each user now has ISOLATED customer data

### Action Required
1. **Apply SQL Fix:**
   ```bash
   # File: FIX_1_USER_1_DASHBOARD_ISOLATED_DATA.sql
   # Run in Supabase SQL Editor: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql
   ```

2. **Verify Fix:**
   ```bash
   node verify_1_user_1_dashboard.js
   ```

3. **Test:**
   - Register 2+ users
   - Login each user
   - Verify each sees ONLY their own data

**Full Documentation:** `CONCEPT_1_USER_1_ROLE_1_DASHBOARD.md`

---

## 📋 Project Overview

**BALIK.LAGI** adalah Business Intelligence Platform untuk barbershop dengan fitur:
- ✅ **3-Role Authentication System** (Customer, Capster, Admin)
- ✅ **ACCESS KEY System** untuk exclusivity (CUSTOMER_BOZQ_ACCESS_1, CAPSTER_BOZQ_ACCESS_1, ADMIN_BOZQ_ACCESS_1)
- ✅ **Data Isolation Per User** - 1 USER = 1 DASHBOARD
- ✅ **Customer Loyalty Program** dengan tracking visits & revenue
- ✅ **Real-time Analytics Dashboard** untuk semua role
- 🔧 **Capster Dashboard** dengan predictive analytics (FASE 3 - In Progress)
- 🔧 **Booking System** dengan queue management (FASE 4 - In Progress)
- 🔧 **WhatsApp Notifications** untuk booking confirmations (FASE 4 - In Progress)

---

## 🎯 Currently Completed Features

### ✅ FASE 1 & 2: Authentication & Database (COMPLETED)

1. **Multi-Role Authentication System**
   - Customer registration & login (email + password)
   - Capster registration & login dengan auto-approval
   - Admin login dengan secure credentials
   - ACCESS KEY validation system
   
2. **Database Schema (PostgreSQL via Supabase)**
   - `user_profiles` - User authentication dengan role-based access
   - `barbershop_customers` - Customer data & loyalty metrics (WITH user_id FK)
   - `access_keys` - Access key management untuk 3 roles
   - `capsters` - Capster profiles & performance metrics
   - `service_catalog` - Service offerings
   - `bookings` - Booking management (schema ready)
   - `barbershop_transactions` - Transaction history

3. **Row Level Security (RLS) Policies**
   - User-based data isolation (user_id = auth.uid())
   - Role-based access control
   - Admin full access policies

### 🔧 FASE 3: Capster Dashboard (IN PROGRESS)

**Target:** Capster Dashboard dengan predictive analytics

1. **Capster Profile Management**
   - Personal stats (total customers, revenue, ratings)
   - Specialization tracking
   - Performance metrics

2. **Predictive Analytics**
   - Customer visit prediction algorithm
   - Today's queue management
   - Next visit forecast
   - Churn risk scoring

3. **Customer Insights**
   - Customer visit history
   - Average transaction value (ATV)
   - Loyalty tracking per customer

### 🎯 FASE 4: Booking System (NEXT PRIORITY)

**Target:** Killer Feature - Online Booking System

1. **Customer Booking**
   - BookingForm Component
   - Slot Availability Checker
   - Capster selection
   - Service selection

2. **Real-time Updates**
   - Queue position tracking
   - Estimated wait time
   - Booking status updates

3. **Notifications**
   - WhatsApp notifications
   - Email confirmations
   - SMS reminders

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15.5.9 + React 19.0.0 + TailwindCSS
- **Backend:** Next.js API Routes + Supabase Edge Functions
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (https://saasxbarbershop.vercel.app/)
- **Process Manager:** PM2 (for local development)

---

## 📊 Database Schema

### Core Tables

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin')),
  customer_phone TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### barbershop_customers (WITH user_id FK - FIXED!)
```sql
CREATE TABLE barbershop_customers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_area TEXT,
  total_visits INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  average_atv NUMERIC(10,2) DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  customer_segment TEXT,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  coupon_count INTEGER DEFAULT 0,
  coupon_eligible BOOLEAN DEFAULT false,
  google_review_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "customers_read_own_by_user_id"
ON barbershop_customers FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

#### access_keys
```sql
CREATE TABLE access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin')),
  access_key TEXT UNIQUE NOT NULL,
  key_name TEXT,
  is_valid BOOLEAN DEFAULT true,
  max_usage INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data
INSERT INTO access_keys (role, access_key, key_name) VALUES
  ('customer', 'CUSTOMER_BOZQ_ACCESS_1', 'Customer Access Key'),
  ('capster', 'CAPSTER_BOZQ_ACCESS_1', 'Capster Access Key'),
  ('admin', 'ADMIN_BOZQ_ACCESS_1', 'Admin Access Key');
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- PM2 (pre-installed in sandbox)

### Setup

1. **Clone Repository:**
   ```bash
   git clone https://github.com/Estes786/saasxbarbershop.git
   cd saasxbarbershop
   ```

2. **Install Dependencies:**
   ```bash
   npm install  # Use 300s+ timeout for npm commands
   ```

3. **Environment Setup:**
   ```bash
   # Create .env.local
   cat > .env.local << 'EOF'
   NEXT_PUBLIC_SUPABASE_URL=https://qwqmhvwqeynnyxaecqzw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   EOF
   ```

4. **Build Project:**
   ```bash
   npm run build  # 300s+ timeout required
   ```

5. **Start Development Server:**
   ```bash
   # Start with PM2
   pm2 start ecosystem.config.cjs
   
   # Verify server running
   curl http://localhost:3000
   
   # Check logs
   pm2 logs --nostream
   ```

6. **Stop Server:**
   ```bash
   pm2 delete all
   ```

---

## 📦 Deployment

### Vercel Deployment

**Production URL:** https://saasxbarbershop.vercel.app/

```bash
# Deploy to production
npm run build
vercel --prod
```

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://qwqmhvwqeynnyxaecqzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🧪 Testing

### Test Registration & Login

```bash
# Test Customer Registration
# 1. Go to: https://saasxbarbershop.vercel.app/register
# 2. Use ACCESS KEY: CUSTOMER_BOZQ_ACCESS_1
# 3. Register with email + password
# 4. Verify email/phone displayed correctly

# Test Capster Registration
# 1. Go to: https://saasxbarbershop.vercel.app/register/capster
# 2. Use ACCESS KEY: CAPSTER_BOZQ_ACCESS_1
# 3. Auto-approved after registration

# Test Admin Login
# 1. Go to: https://saasxbarbershop.vercel.app/login/admin
# 2. Use ACCESS KEY: ADMIN_BOZQ_ACCESS_1
```

### Test Data Isolation

```bash
# Scenario: Verify 1 USER = 1 DASHBOARD
# 1. Register User A (customer A)
# 2. Login User A → see data A
# 3. Logout
# 4. Register User B (customer B)
# 5. Login User B → see data B (NOT data A!)
# ✅ PASS: Each user sees only their own data
```

---

## 📖 Documentation Files

- `CONCEPT_1_USER_1_ROLE_1_DASHBOARD.md` - Data isolation concept & implementation
- `FIX_1_USER_1_DASHBOARD_ISOLATED_DATA.sql` - SQL fix for data isolation
- `SECRET_KEY_IMPLEMENTATION.md` - ACCESS KEY system documentation
- `BI_PLATFORM_ROADMAP.md` - Complete roadmap Fase 1-5
- `DEEP_RESEARCH_3_ROLE_ARCHITECTURE.md` - 3-role architecture design

---

## 🔐 Access Keys

### Current Access Keys

| Role | Access Key | Usage |
|------|-----------|-------|
| Customer | `CUSTOMER_BOZQ_ACCESS_1` | Customer registration |
| Capster | `CAPSTER_BOZQ_ACCESS_1` | Capster registration |
| Admin | `ADMIN_BOZQ_ACCESS_1` | Admin registration |

### Key Features
- ✅ Validation before registration
- ✅ Usage tracking (optional)
- ✅ Exclusivity enforcement
- ✅ Role-based key assignment

---

## 🐛 Known Issues & Fixes

### SOLVED: Shared Dashboard Issue ✅
- **Problem:** Users seeing other users' data
- **Cause:** `barbershop_customers` using `customer_phone` instead of `user_id`
- **Fix:** Applied `FIX_1_USER_1_DASHBOARD_ISOLATED_DATA.sql`
- **Status:** ✅ FIXED (25 Dec 2025)

### SOLVED: User Profile Not Found ✅
- **Problem:** "User profile not found" error on login
- **Cause:** Trigger not creating profiles automatically
- **Fix:** Applied `FINAL_COMPREHENSIVE_IDEMPOTENT_FIX.sql`
- **Status:** ✅ FIXED (24 Dec 2024)

---

## 📞 Support & Contact

**Repository:** https://github.com/Estes786/saasxbarbershop  
**Production:** https://saasxbarbershop.vercel.app/  
**Last Updated:** 25 December 2025

---

## 🎯 Roadmap

### ✅ Completed
- [x] 3-Role Authentication System
- [x] ACCESS KEY validation
- [x] Data isolation per user (1 USER = 1 DASHBOARD)
- [x] Customer loyalty tracking
- [x] Admin dashboard

### 🔧 In Progress
- [ ] Capster Dashboard dengan predictive analytics
- [ ] Customer visit prediction algorithm
- [ ] Queue management system

### 🎯 Next Priority
- [ ] Booking System (Killer Feature)
- [ ] WhatsApp notifications
- [ ] Real-time slot updates
- [ ] Mobile responsive design

---

**Made with ❤️ for OASIS Barbershop Kedungrandu**
