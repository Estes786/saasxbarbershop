# 🚀 OASIS BI PRO - Barbershop Management System

## 📋 Project Overview

**OASIS BI PRO** adalah Business Intelligence Platform untuk barbershop dengan fitur:
- ✅ **3-Role Authentication System** (Customer, Capster, Admin)
- ✅ **Google OAuth Integration** untuk registrasi & login cepat
- ✅ **Customer Loyalty Program** dengan tracking visits & revenue
- ✅ **Real-time Analytics Dashboard** untuk semua role
- 🔧 **Booking System** dengan queue management (FASE 3 - In Progress)
- 🔧 **WhatsApp Notifications** untuk booking confirmations (FASE 3 - In Progress)
- 🔧 **Predictive Analytics** untuk churn risk & visit prediction (FASE 3 - In Progress)

---

## 🎯 Currently Completed Features

### ✅ FASE 1 & 2: Authentication & Database

1. **Multi-Role Authentication System**
   - Customer registration & login (email + Google OAuth)
   - Admin login dengan secure credentials
   - Capster authentication (in progress - FASE 3)
   
2. **Database Schema (PostgreSQL via Supabase)**
   - `user_profiles` - User authentication dengan role-based access
   - `barbershop_customers` - Customer data & loyalty metrics
   - `capsters` - Capster profiles & performance metrics
   - `service_catalog` - Service offerings
   - `bookings` - Booking management (schema ready)
   - `barbershop_transactions` - Transaction history

3. **Row Level Security (RLS)**
   - Policy-based access control untuk semua role
   - Service role bypass untuk backend operations
   - Trigger auto-create `barbershop_customers` saat registrasi

4. **Google OAuth Integration**
   - Sign in/up dengan Google account
   - Auto-create profile dengan role detection
   - Redirect handling berdasarkan user role

---

## 🌐 URLs & Access

### Development
- **Local**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*

### Production (After Deployment)
- **Live URL**: https://saasxbarbershop.vercel.app (example)

### Supabase Dashboard
- **Project**: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
- **SQL Editor**: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new

---

## 📊 Functional Entry URIs (Paths & Parameters)

### Authentication Routes

#### **Customer Registration**
```
GET /register
GET /register/customer

Form Fields:
- email: string (required)
- password: string (min 6 chars, required)
- customerName: string (optional)
- customerPhone: string (required for customer)
- confirmPassword: string (required)

Or:
POST /api/auth/google-signup?role=customer
```

#### **Customer Login**
```
GET /login
GET /login/customer

Form Fields:
- email: string (required)
- password: string (required)

Or:
POST /api/auth/google-signin?role=customer
```

#### **Admin Login**
```
GET /login/admin

Form Fields:
- email: string (required)
- password: string (required)
- adminKey: string (optional, for extra security)
```

#### **OAuth Callback**
```
GET /auth/callback?code=<auth_code>&role=<customer|admin>

Query Parameters:
- code: OAuth authorization code
- role: Expected user role (customer/admin)
```

### Dashboard Routes

#### **Customer Dashboard**
```
GET /dashboard/customer

Features:
- View personal profile
- Loyalty points & visit history
- Upcoming bookings (FASE 3)
- Transaction history
```

#### **Admin Dashboard**
```
GET /dashboard/admin

Features:
- View all customers & metrics
- Capster management
- Service catalog management
- Analytics & reports
- System configuration
```

#### **Capster Dashboard** (FASE 3 - In Progress)
```
GET /dashboard/capster

Features:
- View today's queue
- Performance metrics
- Customer visit predictions
- Earnings tracker
```

---

## 🗄️ Data Architecture

### Data Models

#### **user_profiles**
```typescript
{
  id: UUID (FK to auth.users)
  email: string (unique)
  role: 'customer' | 'capster' | 'admin' | 'barbershop'
  customer_phone: string (nullable)
  customer_name: string
  capster_id: UUID (nullable, FK to capsters)
  created_at: timestamp
  updated_at: timestamp
}
```

#### **barbershop_customers**
```typescript
{
  customer_phone: string (PK)
  customer_name: string
  total_visits: integer
  total_revenue: numeric
  average_atv: numeric
  lifetime_value: numeric
  coupon_count: integer
  coupon_eligible: boolean
  google_review_given: boolean
  churn_risk_score: numeric (0-1)
  first_visit_date: date
  last_visit_date: date
  days_since_last_visit: integer
  visit_frequency: string
  preferred_services: string[]
}
```

#### **capsters**
```typescript
{
  id: UUID (PK)
  user_id: UUID (FK to user_profiles)
  capster_name: string
  phone: string
  specialization: 'haircut' | 'grooming' | 'coloring' | 'all'
  rating: numeric (0-5)
  total_customers_served: integer
  total_revenue_generated: numeric
  is_available: boolean
  working_hours: jsonb
  profile_image_url: string
  bio: string
  years_of_experience: integer
}
```

### Storage Services Used

1. **Supabase PostgreSQL Database**
   - Primary data storage
   - RLS policies untuk data security
   - Real-time subscriptions (for FASE 3)

2. **Supabase Authentication**
   - Email/password authentication
   - Google OAuth provider
   - Session management

3. **Supabase Storage** (For FASE 3)
   - Profile images
   - Service catalog images
   - Upload bukti transaksi

### Data Flow

```
User Registration (Customer via Google OAuth)
    ↓
1. Google OAuth consent → auth.users created
    ↓
2. OAuth callback handler → Create user_profiles record (role='customer', no phone initially)
    ↓
3. Trigger fires → Auto-create barbershop_customers record (if phone provided)
    ↓
4. Redirect to /dashboard/customer
```

```
User Login (Email)
    ↓
1. Supabase Auth check credentials
    ↓
2. Load user_profiles by user.id
    ↓
3. Check role → Redirect to appropriate dashboard
```

---

## 🚀 User Guide

### For Customers

#### Registrasi
1. **Via Email**:
   - Kunjungi http://localhost:3000/register
   - Isi email, password, nama, dan nomor HP
   - Klik "Daftar"
   - Check email untuk konfirmasi
   - Login setelah konfirmasi

2. **Via Google**:
   - Kunjungi http://localhost:3000/register
   - Klik "Continue with Google"
   - Pilih Google account
   - Otomatis redirect ke dashboard customer

#### Login
1. Kunjungi http://localhost:3000/login
2. Masukkan email & password (atau klik Google)
3. Auto-redirect ke customer dashboard

#### Dashboard Features
- View loyalty points & total visits
- See transaction history
- Book appointments (FASE 3)
- Update profile information

### For Admin

#### Login
1. Kunjungi http://localhost:3000/login/admin
2. Masukkan admin email & password
3. Auto-redirect ke admin dashboard

#### Default Admin Credentials
```sql
-- Create via Supabase SQL Editor:
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@oasis.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), NOW()
)
RETURNING id;

-- Then create profile with returned UUID:
INSERT INTO user_profiles (id, email, role, full_name)
VALUES ('<UUID>', 'admin@oasis.com', 'admin', 'System Admin');
```

#### Dashboard Features
- View all customers & analytics
- Manage capsters
- Configure services
- Generate reports
- System settings

### For Capsters (FASE 3 - In Progress)

#### Registration Flow
- Admin creates capster account
- Capster receives invitation email
- Sets up profile & availability
- Access capster dashboard

#### Dashboard Features (Coming Soon)
- Today's queue & appointments
- Performance metrics
- Customer visit predictions
- Earnings tracker

---

## 🛠️ Deployment Status

### Current Status: ✅ **Development Ready**

**What's Done:**
- ✅ Database schema deployed to Supabase
- ✅ RLS policies configured
- ✅ Authentication system (email + Google OAuth)
- ✅ Customer & Admin dashboards
- ✅ OAuth callback handling
- ✅ Foreign key constraint fix applied

**What's Next (FASE 3):**
- 🔧 Capster registration & dashboard
- 🔧 Booking system implementation
- 🔧 Real-time queue management
- 🔧 WhatsApp notification integration
- 🔧 Predictive analytics features

### Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel (recommended for Next.js)
- **Analytics**: Recharts, date-fns
- **UI Icons**: Lucide React

---

## 🐛 Known Issues & Fixes

### ✅ FIXED (23 Dec 2024): User Profile Not Found Error
**Issue**: `User profile not found. Please contact admin. This could be an RLS policy issue`

**Root Cause**: RLS policies dengan subquery yang membaca `user_profiles` lagi menyebabkan infinite recursion

**Solution**: 
1. Simplify ALL RLS policies - gunakan HANYA `auth.uid() = id` TANPA subquery
2. Remove ALL subqueries dari policy USING/WITH CHECK clauses
3. Service role bypass policy untuk backend operations

**SQL Fix**: See `FIX_RLS_USER_PROFILE_NOT_FOUND.sql`
**Instructions**: See `APPLY_FIX_INSTRUCTIONS.md`
**Analysis**: See `FIX_SUMMARY_23DEC2024.md`

**Status**: ⏳ **Fix created, needs to be applied to Supabase**

### ✅ FIXED: Foreign Key Constraint Error
**Issue**: `user_profiles_customer_phone_fkey` violation during registration

**Root Cause**: Foreign key constraint referenced `barbershop_customers(customer_phone)` before it existed

**Solution**: 
1. Removed foreign key constraint
2. Added trigger `auto_create_barbershop_customer()` 
3. Trigger fires AFTER `user_profiles` insert to create matching customer record

**SQL Fix Applied**: See `FINAL_DATABASE_FIX.sql`

### ✅ FIXED: Infinite Recursion in RLS Policies
**Issue**: `infinite recursion detected in policy` error

**Root Cause**: Function volatility was `IMMUTABLE`, causing recursive policy checks

**Solution**: Changed function to `STABLE` volatility

### ⚠️ TO FIX: Google OAuth Phone Number Collection
**Issue**: OAuth users don't have `customer_phone` initially

**Workaround**: Profile created without phone, can be updated later

**Proper Fix (FASE 3)**: 
- Show "Complete Profile" modal after OAuth login
- Request phone number before full dashboard access

---

## 📖 Development Guide

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Setup

1. **Clone Repository**
```bash
git clone https://github.com/Estes786/saasxbarbershop.git
cd saasxbarbershop
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qwqmhvwqeynnyxaecqzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

4. **Apply Database Schema**
- Open Supabase SQL Editor
- Copy content from `FINAL_DATABASE_FIX.sql`
- Execute

5. **Configure Google OAuth** (See `PANDUAN_FIX_LENGKAP.md`)

6. **Run Development Server**
```bash
npm run dev
```

Visit: http://localhost:3000

### Testing

1. **Test Customer Registration (Email)**
   - Go to /register
   - Fill form with test data
   - Should redirect to /dashboard/customer after email confirmation

2. **Test Customer Registration (Google)**
   - Go to /register
   - Click "Continue with Google"
   - Should redirect to /dashboard/customer immediately

3. **Test Admin Login**
   - Go to /login/admin
   - Use admin credentials
   - Should redirect to /dashboard/admin

### Troubleshooting

**Error: "Could not fetch user"**
- Clear browser cache & cookies
- Sign out and sign in again
- Check Supabase logs

**Error: "User already registered"**
- Delete user from `auth.users` table
- Try registration again

**Google OAuth not working**
- Verify Client ID & Secret in Supabase
- Check redirect URI matches exactly
- Ensure Google OAuth is enabled in Supabase dashboard

---

## 📚 Documentation Files

- **PANDUAN_FIX_LENGKAP.md** - Comprehensive fix guide untuk database & OAuth
- **FINAL_DATABASE_FIX.sql** - Complete idempotent SQL schema
- **IDEMPOTENT_SCHEMA_FIX.sql** - Original schema fix (deprecated, use FINAL version)
- **apply_sql_fix.js** - Script untuk apply SQL via Supabase CLI

---

## 🎯 Recommended Next Steps

### FASE 3: Capster Dashboard & Booking System

#### Priority 1: Capster Registration Flow (2-3 hours)
- [ ] Create `/register/capster` page
- [ ] Admin invitation system
- [ ] Auto-create `capsters` record on registration
- [ ] Link to `user_profiles.capster_id`

#### Priority 2: Booking System (6-8 hours) 🔥 KILLER FEATURE!
- [ ] Customer booking form with date/time picker
- [ ] Real-time slot availability checker
- [ ] Capster assignment logic
- [ ] Queue management dashboard
- [ ] Status tracking (pending, confirmed, completed, cancelled, no_show)

#### Priority 3: WhatsApp Notifications (3-4 hours)
- [ ] Integrate WhatsApp Business API
- [ ] Send booking confirmation
- [ ] Send reminder 1 hour before appointment
- [ ] Send post-visit feedback request

#### Priority 4: Predictive Analytics (4-5 hours)
- [ ] Customer visit prediction algorithm
- [ ] Churn risk calculation
- [ ] Service recommendation engine
- [ ] Revenue forecasting

### Total Estimated Time for FASE 3: 15-20 hours

---

## 🤝 Contributing

This is a private project for OASIS Barbershop. For any issues or feature requests, contact the development team.

---

## 📞 Support

- **Developer**: AI Assistant
- **Project Owner**: Estes786
- **GitHub**: https://github.com/Estes786/saasxbarbershop

---

## 📅 Version History

- **v1.0.0** (Dec 20, 2024) - Initial release dengan auth system
- **v1.1.0** (Dec 21, 2024) - Fixed foreign key constraint & added Google OAuth
- **v1.2.0** (Coming) - FASE 3: Booking system & analytics

---

## 📄 License

Proprietary - All rights reserved by OASIS Barbershop

---

**Last Updated**: December 23, 2024
**Status**: 🔧 Fix Pending | ⏳ FASE 3 In Progress

---

## 🚨 CRITICAL: Fix Required Before Testing

**Priority**: 🔴 **URGENT**

Before testing login/registration, you MUST apply the RLS policy fix:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
2. Copy content from `FIX_RLS_USER_PROFILE_NOT_FOUND.sql`
3. Paste and click "RUN"
4. Verify success messages

**Without this fix**: All login attempts will fail with "User profile not found" error.

**Documentation**: 
- `APPLY_FIX_INSTRUCTIONS.md` - Step-by-step guide
- `FIX_SUMMARY_23DEC2024.md` - Detailed analysis
- `FIX_RLS_USER_PROFILE_NOT_FOUND.sql` - SQL script
