# 🚀 COMPREHENSIVE SUPABASE CONFIGURATION GUIDE
## BALIK.LAGI Barbershop - Authentication Complete Setup

**Date**: December 19, 2025  
**Application URL**: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai  
**Supabase Project**: qwqmhvwqeynnyxaecqzw  
**Status**: ⚠️ **REQUIRES CONFIGURATION**

---

## 📊 CURRENT STATUS

### ✅ Working Components:
1. ✅ Next.js application built successfully
2. ✅ Server running on port 3000
3. ✅ Supabase connection established
4. ✅ Database tables exist:
   - user_profiles (1 row)
   - barbershop_customers (15 rows)
5. ✅ 17 auth users in Supabase
6. ✅ Service role permissions working

### ⚠️ Issues Identified from Screenshots:

1. **Google OAuth NOT Configured**
   - Error: "Failed to review OAuth Server apps"
   - Screenshot shows OAuth Apps section has error
   - Need to configure Google OAuth credentials

2. **Email Authentication NOT Configured**
   - Warning: "All fields must be filled before SMTP can be enabled"
   - Custom SMTP not configured
   - Email confirmation not working

3. **User Profile Loading Issues**
   - "Loading profile..." stuck on screen
   - Possible RLS policy issues
   - Profile creation during OAuth might be failing

---

## 🔧 CONFIGURATION STEPS (IN ORDER)

### STEP 1: Apply RLS Policies (CRITICAL - DO THIS FIRST)

**Why**: Without proper RLS policies, users cannot create/read their profiles during registration or OAuth

**How to Apply**:

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **New query**
4. Copy the SQL from `APPLY_RLS_POLICIES.sql` file (below)
5. Click: **Run**
6. Verify: Should see "Success. No rows returned"

**SQL to Apply**:
```sql
-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For user_profiles table
-- ========================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;

-- POLICY 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- POLICY 2: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- POLICY 3: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- POLICY 4: Service role has full access (CRITICAL for OAuth callback)
CREATE POLICY "Service role has full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- VERIFICATION
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

**Expected Result**: Should show 4 policies (one for SELECT, INSERT, UPDATE, and ALL)

---

### STEP 2: Configure Email Authentication

**Supabase Dashboard Path**: 
1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers
2. Click: **Email** (in Authentication → Providers)

**Configuration Options**:

#### Option A: Use Supabase Built-in Email (Recommended for Development)

1. Enable: **Enable Email provider** (toggle ON)
2. Confirm email: **Disable** (for faster testing)
3. Secure email change: **Enable** (recommended)
4. Save Changes

**Note**: Supabase sends emails from their domain. Good for development/testing.

#### Option B: Custom SMTP (Recommended for Production)

If you have custom email service (Gmail, SendGrid, etc.):

1. Enable: **Enable custom SMTP**
2. Fill in:
   - **Sender email**: your@domain.com
   - **Sender name**: BALIK.LAGI
   - **Host**: smtp.gmail.com (for Gmail)
   - **Port**: 587
   - **Username**: your@gmail.com
   - **Password**: Your app password (NOT regular password!)
3. Save Changes

**How to get Gmail App Password**:
1. Go to: https://myaccount.google.com/security
2. Enable: 2-Factor Authentication
3. Go to: App passwords
4. Create new app password for "Mail"
5. Copy the 16-character password
6. Use that in Supabase SMTP settings

---

### STEP 3: Configure Google OAuth (CRITICAL)

This is the main issue from your screenshots! 

#### Part A: Get Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Create Project** (if you don't have one):
   - Project name: "BALIK.LAGI Barbershop"
   - Click "Create"

3. **Configure OAuth Consent Screen**:
   - Go to: OAuth consent screen (left sidebar)
   - User Type: **External**
   - App name: BALIK.LAGI Barbershop
   - User support email: your@email.com
   - Developer email: your@email.com
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Select: `openid`, `email`, `profile`
   - Test users: Add your email
   - Click "Save and Continue"

4. **Create OAuth Client ID**:
   - Go to: Credentials (left sidebar)
   - Click: **+ CREATE CREDENTIALS** → OAuth client ID
   - Application type: **Web application**
   - Name: "BALIK.LAGI Web Client"
   
   **CRITICAL - Authorized JavaScript origins**:
   ```
   https://qwqmhvwqeynnyxaecqzw.supabase.co
   https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai
   http://localhost:3000
   ```
   
   **CRITICAL - Authorized redirect URIs**:
   ```
   https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback
   https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/auth/callback
   http://localhost:3000/auth/callback
   ```
   
   - Click: **Create**
   - **SAVE** the Client ID and Client Secret (you'll need these!)

#### Part B: Configure Google OAuth in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers
2. **Click**: OAuth Apps → Google
3. **Enable**: Toggle "Enable Google provider" to ON
4. **Enter**:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. **Redirect URL** (copy this):
   ```
   https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback
   ```
   This should match what you put in Google Console!
   
6. **Click**: Save

**Verification**:
- Go back to OAuth Apps section
- Should see Google with green checkmark
- No more "Failed to review OAuth Server apps" error

---

### STEP 4: Configure Site URL and Redirect URLs

**Supabase Dashboard Path**: Authentication → URL Configuration

1. **Site URL**: 
   ```
   https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai
   ```

2. **Redirect URLs** (add all of these):
   ```
   https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/auth/callback
   https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/dashboard/customer
   https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/dashboard/admin
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard/customer
   http://localhost:3000/dashboard/admin
   ```

3. **Save Changes**

---

## 🧪 TESTING PROCEDURES

### TEST 1: Email Registration (Customer)

**URL**: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/register

**Steps**:
1. Fill in form:
   - Email: testcustomer@example.com
   - Nama Lengkap: Test Customer
   - Nomor HP: 081234567890
   - Password: test123456
   - Konfirmasi Password: test123456

2. Click: **Daftar**

**Expected Result**:
- ✅ Success message: "Registrasi Berhasil! 🎉"
- ✅ Message says: "Silakan cek email Anda untuk konfirmasi"
- ✅ Email sent to testcustomer@example.com (if email configured)
- ✅ User appears in Supabase Auth → Users
- ✅ Profile appears in user_profiles table

**If it fails**:
- Check: RLS policies are applied (Step 1)
- Check: Email provider is enabled (Step 2)
- Check: Console logs for errors (F12 → Console)

---

### TEST 2: Email Login (Customer)

**URL**: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/login

**Steps**:
1. Click email confirmation link (if email configured)
2. Enter credentials:
   - Email: testcustomer@example.com
   - Password: test123456
3. Click: **Login**

**Expected Result**:
- ✅ Redirects to: `/dashboard/customer`
- ✅ Shows customer dashboard
- ✅ Profile loaded successfully
- ✅ No "Loading profile..." stuck

**If stuck on "Loading profile..."**:
- Issue: RLS policies not allowing profile read
- Fix: Re-run Step 1 (RLS policies)

---

### TEST 3: Google OAuth Registration

**URL**: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/register

**Steps**:
1. Click: **Continue with Google**
2. Select Google account
3. Grant permissions

**Expected Result**:
- ✅ Redirects to Google sign-in
- ✅ After auth, redirects to `/dashboard/customer`
- ✅ Profile auto-created in user_profiles
- ✅ Shows customer dashboard

**If it fails**:
- Error: "Google sign-up failed"
  - Check: Google OAuth is configured (Step 3)
  - Check: Redirect URIs match in Google Console
- Stuck on "Loading profile..."
  - Check: RLS policies (Step 1)
  - Check: Service role policy exists

---

### TEST 4: Google OAuth Login

**URL**: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/login

**Steps**:
1. Click: **Continue with Google**
2. Select Google account (previously registered)

**Expected Result**:
- ✅ Redirects to `/dashboard/customer` (or `/dashboard/admin` if admin)
- ✅ Dashboard loads correctly
- ✅ Profile data displayed

---

### TEST 5: Admin Registration with Secret Key

**URL**: https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/register/admin

**Steps**:
1. Fill in form:
   - Kode Admin: `BOZQ_BARBERSHOP_ADMIN_2025_SECRET`
   - Email: admin@example.com
   - Password: admin123456
   - Konfirmasi Password: admin123456

2. Click: **Daftar**

**Expected Result**:
- ✅ Success message
- ✅ User created with role: 'admin'
- ✅ Can login and access `/dashboard/admin`

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Loading profile..." Stuck Forever

**Cause**: RLS policies not allowing authenticated users to read their profiles

**Fix**:
1. Run Step 1 (Apply RLS policies)
2. Verify with this SQL:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
3. Should see 4 policies

---

### Issue 2: "Google sign-up failed"

**Cause**: Google OAuth not configured or redirect URIs mismatch

**Fix**:
1. Complete Step 3 (Configure Google OAuth)
2. Verify redirect URIs in Google Console match exactly:
   - `https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback`
3. Wait 5 minutes for Google to propagate changes

---

### Issue 3: "Failed to review OAuth Server apps"

**Cause**: Google OAuth provider not properly configured in Supabase

**Fix**:
1. Go to Supabase → Authentication → Providers
2. Click: OAuth Apps
3. Enable and configure Google provider with valid credentials

---

### Issue 4: Email Not Sent

**Cause**: Email provider not configured

**Fix**:
1. For development: Use Supabase built-in email (Step 2, Option A)
2. For production: Configure custom SMTP (Step 2, Option B)
3. Check Supabase → Authentication → Email Templates

---

### Issue 5: Profile Creation Error During Registration

**Error**: "Error creating profile: new row violates row-level security policy"

**Cause**: User trying to insert profile but RLS policy not allowing it

**Fix**:
1. Ensure "Users can insert their own profile" policy exists
2. Run:
   ```sql
   CREATE POLICY "Users can insert their own profile"
   ON user_profiles
   FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = id);
   ```

---

## 📋 VERIFICATION CHECKLIST

Before declaring "configuration complete", verify ALL of these:

### Supabase Configuration:
- [ ] RLS policies applied on user_profiles (4 policies)
- [ ] Email provider enabled
- [ ] Google OAuth configured with valid credentials
- [ ] Site URL configured
- [ ] Redirect URLs added

### Authentication Flows:
- [ ] Customer can register with email
- [ ] Customer can login with email
- [ ] Customer can register with Google OAuth
- [ ] Customer can login with Google OAuth
- [ ] Admin can register with secret key
- [ ] Admin can login and access admin dashboard

### Dashboard Access:
- [ ] Customer redirected to `/dashboard/customer` after login
- [ ] Admin redirected to `/dashboard/admin` after login
- [ ] Profile data loads correctly
- [ ] No "Loading profile..." stuck

---

## 🎯 EXPECTED FINAL STATE

After completing all steps:

1. **Supabase Dashboard**:
   - ✅ Authentication → Providers → Email: Enabled
   - ✅ Authentication → Providers → Google: Enabled (green checkmark)
   - ✅ Authentication → URL Configuration: All URLs configured
   - ✅ Database → user_profiles: RLS enabled with 4 policies

2. **Application**:
   - ✅ Register page works for email and Google
   - ✅ Login page works for email and Google
   - ✅ Users redirected to correct dashboards
   - ✅ Profiles load without issues

3. **Testing**:
   - ✅ Can create new customer account
   - ✅ Can login as customer
   - ✅ Can create admin account with secret key
   - ✅ Can login as admin
   - ✅ Google OAuth flow works end-to-end

---

## 📞 SUPPORT

If you encounter issues:

1. Check Supabase logs: Project → Logs
2. Check browser console: F12 → Console
3. Check server logs: `pm2 logs saasxbarbershop --nostream`
4. Verify environment variables in `.env.local`

---

## 🚀 QUICK START COMMANDS

```bash
# Check current status
cd /home/user/webapp && node check_supabase_config.js

# Restart server
pm2 restart saasxbarbershop

# Check logs
pm2 logs saasxbarbershop --nostream

# Test authentication
curl https://3000-ip2yojjfafejkwks39c3b-5634da27.sandbox.novita.ai/api/auth/verify-admin-key \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"secretKey":"BOZQ_BARBERSHOP_ADMIN_2025_SECRET"}'
```

---

**Last Updated**: December 19, 2025  
**Status**: Ready for Configuration  
**Estimated Time**: 15-20 minutes to complete all steps

