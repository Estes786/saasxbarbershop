# 🚀 SETUP & TESTING GUIDE - BALIK.LAGI BARBERSHOP

**Tanggal**: 19 Desember 2025  
**Sandbox URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai  
**Status**: ✅ Application Running - Needs Supabase Configuration

---

## 📊 CURRENT STATUS

### ✅ Yang Sudah Beres:
- ✅ Repository cloned dan dependencies installed
- ✅ Environment variables configured (.env.local)
- ✅ Build successful (0 errors)
- ✅ Development server running on port 3000
- ✅ Public URL accessible
- ✅ Database tables exist (user_profiles, barbershop_customers, etc.)

### ⚠️ Yang Perlu Dikonfigurasi:
1. 🔴 **CRITICAL**: Fix RLS Infinite Recursion
2. 🔴 **CRITICAL**: Update Site URL di Supabase
3. 🟡 **IMPORTANT**: Configure Google OAuth
4. 🟢 **OPTIONAL**: Setup SMTP for email confirmation

---

## 🔥 CRITICAL FIX #1: RLS Infinite Recursion (WAJIB!)

### Problem:
Error "infinite recursion detected in policy for relation 'user_profiles'" muncul saat registrasi/login.

### Solution:
Execute SQL script di Supabase SQL Editor:

**Step 1**: Buka Supabase SQL Editor
```
https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
```

**Step 2**: Copy & Paste SQL berikut:

```sql
-- Fix Infinite Recursion in RLS Policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies without recursion
CREATE POLICY "user_profiles_select_own"
ON user_profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
ON user_profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_service_role_all"
ON user_profiles FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

**Step 3**: Click "Run" button

**Step 4**: Verify - Should see "Success" message

---

## 🔥 CRITICAL FIX #2: Update Site URL (WAJIB!)

### Problem:
Site URL masih "http://localhost:3000" di Supabase, menyebabkan OAuth redirect error.

### Solution:

**Step 1**: Buka Authentication Settings
```
https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/url-configuration
```

**Step 2**: Update Site URL menjadi:
```
https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai
```

**Step 3**: Add Redirect URLs (satu per baris):
```
http://localhost:3000/auth/callback
https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/auth/callback
https://saasxbarbershop.vercel.app/auth/callback
```

**Step 4**: Click "Save"

---

## 🟡 IMPORTANT FIX #3: Configure Google OAuth (Untuk "Continue with Google")

### Problem:
Google OAuth belum dikonfigurasi, tombol "Continue with Google" tidak berfungsi.

### Solution:

#### Part A: Google Cloud Console

**Step 1**: Buka Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

**Step 2**: Create OAuth 2.0 Client ID
- Application type: **Web application**
- Name: `BALIK.LAGI Barbershop`

**Step 3**: Add Authorized JavaScript origins:
```
https://qwqmhvwqeynnyxaecqzw.supabase.co
https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai
http://localhost:3000
```

**Step 4**: Add Authorized redirect URIs:
```
https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback
https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/auth/callback
http://localhost:3000/auth/callback
```

**Step 5**: Copy Client ID and Client Secret

#### Part B: Supabase Dashboard

**Step 1**: Buka Auth Providers
```
https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers
```

**Step 2**: Enable Google Provider
- Toggle ON: Google
- Paste Client ID dari Google Console
- Paste Client Secret dari Google Console
- Click "Save"

---

## 🟢 OPTIONAL FIX #4: SMTP Configuration (Untuk Email Verification)

Ini optional karena:
- Supabase punya email service bawaan
- Hanya perlu jika ingin custom email domain

Skip this jika tidak perlu custom email.

---

## 🧪 TESTING PROCEDURES

### Test 1: Email Registration (Customer)

**URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register

**Steps**:
1. Fill form:
   - Email: `test-customer-1@example.com`
   - Nama Lengkap: `Test Customer 1`
   - Nomor HP: `081234567890`
   - Password: `test123456`
   - Konfirmasi Password: `test123456`

2. Click "Daftar"

**Expected Result**:
- ✅ Show success message "Registrasi Berhasil! 🎉"
- ✅ Email sent for confirmation (check inbox)
- ✅ User added to `auth.users` table
- ✅ Profile created in `user_profiles` table with role='customer'
- ✅ Customer record created in `barbershop_customers` table

**If Error**:
- "infinite recursion" → Run Fix #1 SQL script
- "foreign key constraint" → Customer record creation issue
- "profile creation failed" → Check RLS policies

---

### Test 2: Customer Login & Dashboard Redirect

**URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/login

**Steps**:
1. Login with registered customer:
   - Email: `test-customer-1@example.com`
   - Password: `test123456`

2. Click "Masuk"

**Expected Result**:
- ✅ Login successful
- ✅ Redirect to `/dashboard/customer`
- ✅ Customer dashboard loads with:
  - Welcome message with customer name
  - Booking section
  - Transaction history
  - Profile section

**If Error**:
- "Loading profile..." stuck → Check AuthContext.tsx
- Redirect to wrong dashboard → Check role in user_profiles
- 401/403 error → Check RLS policies

---

### Test 3: Google OAuth Registration

**URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register

**Steps**:
1. Click "Continue with Google" button
2. Select Google account
3. Authorize app

**Expected Result**:
- ✅ OAuth flow completes
- ✅ Redirect to `/auth/callback`
- ✅ Profile created automatically with role='customer'
- ✅ Redirect to `/dashboard/customer`
- ✅ Customer dashboard loads

**If Error**:
- Redirect to localhost:3000 → Run Fix #2 (Update Site URL)
- "oauth_exchange_failed" → Check Google OAuth config
- "profile_creation_failed" → Check RLS policies
- "Failed to retrieve OAuth Server apps" → Google OAuth not configured

---

### Test 4: Admin Registration with Secret Key

**URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/register/admin

**Steps**:
1. Fill form:
   - Kode Admin: `BOZQ_BARBERSHOP_ADMIN_2025_SECRET`
   - Email Admin: `admin@oasisbipro.com`
   - Password: `admin123456`
   - Konfirmasi Password: `admin123456`

2. Click "Mendaftar"

**Expected Result**:
- ✅ Verify secret key via API `/api/auth/verify-admin-key`
- ✅ Registration successful
- ✅ Profile created with role='admin'
- ✅ No customer record created (admin doesn't need customer_phone)

**If Error**:
- "Kode admin tidak valid" → Check ADMIN_SECRET_KEY in .env.local
- "Kode admin telah diverifikasi" → Secret key already used
- "profile creation failed" → Check RLS policies

---

### Test 5: Admin Login & Dashboard Redirect

**URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/login

**Steps**:
1. Login dengan admin account:
   - Email: `admin@oasisbipro.com`
   - Password: `admin123456`

2. Click "Masuk"

**Expected Result**:
- ✅ Login successful
- ✅ Redirect to `/dashboard/admin`
- ✅ Admin dashboard loads with:
  - Analytics overview
  - Transaction management
  - Customer management
  - Campaign tracking
  - Reports & insights

**If Error**:
- Redirect to customer dashboard → Check role in user_profiles
- 403 Forbidden → Check admin permissions

---

### Test 6: Google OAuth Login (Existing User)

**URL**: https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/login

**Steps**:
1. Click "Continue with Google"
2. Select same Google account used in Test 3
3. Authorize (if needed)

**Expected Result**:
- ✅ OAuth flow completes
- ✅ Existing profile loaded
- ✅ Redirect to appropriate dashboard based on role
- ✅ No duplicate profile created

---

## 🔍 DEBUGGING TIPS

### Check Server Logs:
```bash
tail -f /tmp/nextjs.log
```

### Check Database Tables:
```sql
-- Check user count
SELECT COUNT(*) FROM auth.users;

-- Check profiles
SELECT id, email, role, customer_phone FROM user_profiles;

-- Check customers
SELECT customer_phone, customer_name, total_visits FROM barbershop_customers;

-- Check RLS policies
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename = 'user_profiles';
```

### Test API Endpoints:
```bash
# Test admin key verification
curl -X POST https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai/api/auth/verify-admin-key \
  -H "Content-Type: application/json" \
  -d '{"key": "BOZQ_BARBERSHOP_ADMIN_2025_SECRET"}'

# Expected: {"valid": true}
```

### Check Auth Session:
Open browser console (F12) and run:
```javascript
// Check if Supabase client is working
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

---

## 📋 CHECKLIST SUMMARY

### Before Testing:
- [ ] Run Fix #1: RLS Infinite Recursion SQL script
- [ ] Run Fix #2: Update Site URL in Supabase
- [ ] Run Fix #3: Configure Google OAuth (optional but recommended)

### Testing:
- [ ] Test 1: Customer registration dengan email ✅/❌
- [ ] Test 2: Customer login & dashboard redirect ✅/❌
- [ ] Test 3: Google OAuth registration ✅/❌
- [ ] Test 4: Admin registration dengan secret key ✅/❌
- [ ] Test 5: Admin login & dashboard redirect ✅/❌
- [ ] Test 6: Google OAuth login (existing user) ✅/❌

### Verification:
- [ ] No "infinite recursion" errors
- [ ] No "Loading profile..." stuck
- [ ] Proper dashboard redirects based on role
- [ ] Profile data loads correctly
- [ ] Google OAuth works without localhost errors

---

## 🚀 QUICK START COMMANDS

```bash
# Check server status
curl -s https://3000-if6dfg0gou4tww2zt9mvq-2b54fc91.sandbox.novita.ai | grep -o '<title>.*</title>'

# Expected: <title>BALIK.LAGI x Barbershop Data Monetization</title>

# View server logs
tail -f /tmp/nextjs.log

# Restart server if needed
fuser -k 3000/tcp && cd /home/user/webapp && npm run dev > /tmp/nextjs.log 2>&1 &
```

---

## 📞 SUPPORT

Jika ada masalah yang tidak ter-cover di guide ini:

1. Check documentation di `/uploaded_files/`:
   - PANDUAN_LENGKAP_KONFIGURASI.md
   - AUTHENTICATION_TEST_GUIDE.md
   - QUICK_REFERENCE_CARD.md

2. Check SQL scripts:
   - FIX_RLS_INFINITE_RECURSION.sql
   - APPLY_RLS_POLICIES.sql
   - DEPLOY_TO_SUPABASE.sql

---

**Good luck dengan testing! 🚀**
