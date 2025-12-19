# 🧪 AUTHENTICATION TESTING GUIDE

**Date**: December 19, 2025  
**Status**: Ready for Testing  
**Sandbox URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai

---

## 📋 PRE-TEST CHECKLIST

Before testing, ensure:

1. ✅ Server is running: `pm2 list` should show saasxbarbershop as "online"
2. ✅ Database tables exist: Run `node deploy_to_supabase.js` to verify
3. ✅ Environment variables set in `.env.local`
4. ✅ RLS policies applied: Execute `APPLY_RLS_POLICIES.sql` in Supabase SQL Editor

---

## 🧪 TEST SUITE

### TEST 1: Email Registration (Customer)

**URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/register

**Steps**:
1. Fill in registration form:
   - Email: `testcustomer1@example.com`
   - Nama Lengkap: `Test Customer 1`
   - Nomor HP: `081234567890`
   - Password: `test123456`
   - Konfirmasi Password: `test123456`

2. Click "Daftar" button

**Expected Result**:
- ✅ Show success message: "Registrasi Berhasil! 🎉"
- ✅ Message says: "Silakan cek email Anda untuk konfirmasi akun"
- ✅ "Login Sekarang" button appears

**Possible Errors & Fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| "Email already registered" | User exists | Use different email |
| "Profile creation failed" | RLS policy blocking | Apply RLS policies from APPLY_RLS_POLICIES.sql |
| "Password minimal 6 karakter" | Password too short | Use minimum 6 characters |
| "Nomor HP wajib diisi" | Phone field empty | Fill in phone number |

---

### TEST 2: Email Confirmation

**After registration**:
1. Check email inbox for Supabase confirmation email
2. Click confirmation link in email
3. Should redirect to Supabase confirmation page

**Expected Result**:
- ✅ Email confirmed successfully
- ✅ User account activated

**Note**: If no email received, check:
- Spam folder
- Supabase email settings: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/templates
- Email confirmations might be disabled in Supabase

---

### TEST 3: Email Login (Customer)

**URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/login

**Steps**:
1. Fill in login form:
   - Email: `testcustomer1@example.com`
   - Password: `test123456`

2. Click "Login" button

**Expected Result**:
- ✅ Redirect to `/dashboard/customer`
- ✅ Customer dashboard loads with user info
- ✅ Navigation shows customer role features

**Possible Errors & Fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid login credentials" | Wrong email/password | Check credentials |
| "Email not confirmed" | Email not verified | Confirm email first |
| Redirect to login again | Session not created | Check RLS policies |
| "Profile not found" | Profile missing | Check user_profiles table |

---

### TEST 4: Google OAuth Sign Up

**URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/register

**Steps**:
1. Click "Continue with Google" button
2. Select Google account or login
3. Authorize application

**Expected Result**:
- ✅ Redirect to Google login page
- ✅ After auth, redirect to `/auth/callback`
- ✅ Auto-create customer profile
- ✅ Final redirect to `/dashboard/customer`

**Possible Errors & Fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| "Google OAuth not configured" | Provider not enabled | Enable Google in Supabase Auth Providers |
| "Redirect URI mismatch" | Wrong OAuth URIs | Add sandbox URL to Google Console |
| "localhost menolak tersambung" | Redirect to localhost | Configure correct callback URL in Supabase |
| "Profile creation failed" | RLS policy issue | Apply RLS policies |

---

### TEST 5: Google OAuth Login

**URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/login

**Steps**:
1. Click "Continue with Google" button
2. Select existing Google account
3. Authorize if prompted

**Expected Result**:
- ✅ Redirect to Google (if not already logged in)
- ✅ Redirect to `/auth/callback`
- ✅ Load existing profile from database
- ✅ Redirect to dashboard based on role

---

### TEST 6: Admin Registration (Special)

**URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/register/admin

**Steps**:
1. Fill in registration form:
   - Email: `testadmin@example.com`
   - Password: `admin123456`
   - Konfirmasi Password: `admin123456`
   - Admin Secret Key: `BOZQ_BARBERSHOP_ADMIN_2025_SECRET`

2. Click "Daftar sebagai Admin" button

**Expected Result**:
- ✅ Success message appears
- ✅ Admin profile created with role='admin'
- ✅ Can login and access `/dashboard/admin`

**Possible Errors & Fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid admin secret key" | Wrong secret | Use correct secret from .env.local |
| "Admin registration failed" | Profile creation error | Check RLS policies |

---

### TEST 7: Logout

**In any dashboard**:
1. Click "Logout" button or link

**Expected Result**:
- ✅ Redirect to `/login`
- ✅ Session cleared
- ✅ Cannot access dashboard without re-login

---

## 🔍 DEBUGGING TOOLS

### Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/logs/explorer
2. Filter by "Auth" to see authentication events
3. Look for errors or failed attempts

### Check User Profiles

```sql
-- In Supabase SQL Editor
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 10;
```

### Check Auth Users

```sql
-- In Supabase SQL Editor
SELECT id, email, confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Server Logs

```bash
# In terminal
pm2 logs saasxbarbershop --nostream
```

---

## 📊 TEST RESULTS TEMPLATE

| Test | Status | Notes | Timestamp |
|------|--------|-------|-----------|
| Email Registration | ⏳ Not tested | | |
| Email Confirmation | ⏳ Not tested | | |
| Email Login | ⏳ Not tested | | |
| Google OAuth Sign Up | ⏳ Not tested | | |
| Google OAuth Login | ⏳ Not tested | | |
| Admin Registration | ⏳ Not tested | | |
| Logout | ⏳ Not tested | | |

**Legend**:
- ✅ Passed
- ❌ Failed
- ⏳ Not tested
- ⚠️ Partial

---

## 🚀 NEXT STEPS AFTER TESTING

1. Document all test results
2. Fix any failing tests
3. Verify all authentication flows work
4. Prepare for production deployment
5. Update Google OAuth URIs for production domain

---

**Ready to test!** 🎯
