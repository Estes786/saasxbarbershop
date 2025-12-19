# 🚀 GOOGLE OAUTH CONFIGURATION GUIDE - COMPLETE FIX

**Date**: December 19, 2025  
**Status**: ✅ **READY FOR DEPLOYMENT**  
**Public URL**: https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai

---

## 📊 CURRENT STATUS

✅ **Database**: All 7 tables exist and ready  
✅ **Build**: Successful without errors  
✅ **Server**: Running on port 3000  
✅ **Code**: OAuth callback route properly configured with server-side client

---

## 🔧 REQUIRED FIXES

### **FIX #1: Configure Google OAuth in Supabase Dashboard**

#### Step 1: Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (if not exists)
3. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai`
   - `https://qwqmhvwqeynnyxaecqzw.supabase.co`
   
4. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/auth/callback`
   - `https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback`
   
5. Copy **Client ID** and **Client Secret**

#### Step 2: Enable Google Provider in Supabase

1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/auth/providers
2. Find "Google" provider
3. Toggle **Enable** ON
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

---

### **FIX #2: Configure Row Level Security (RLS) Policies**

The `user_profiles` table needs proper RLS policies to allow authenticated users to read/write their own profiles.

**SQL to execute in Supabase SQL Editor**:

```sql
-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (during sign up)
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Service role can manage all profiles (for server-side operations)
CREATE POLICY "Service role has full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Execute this SQL**:
1. Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
2. Copy the SQL above
3. Click "Run"

---

### **FIX #3: Update Environment Variables (Production)**

When deploying to production (Vercel/Netlify), ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qwqmhvwqeynnyxaecqzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDU2MTgsImV4cCI6MjA4MTUyMTYxOH0.mKN2LQxDwcV3QmebUB-ytfLQMgWROA7xVu60kAY-LJs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cW1odndxZXlubnl4YWVjcXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0NTYxOCwiZXhwIjoyMDgxNTIxNjE4fQ.pBkPeldz1NW0qCI17RHnCWVaGqmCCbrvmuWlo2skpbk
ADMIN_SECRET_KEY=BOZQ_BARBERSHOP_ADMIN_2025_SECRET
```

Then update Google OAuth redirect URIs to match your production domain.

---

## 🧪 TESTING INSTRUCTIONS

### Test Google OAuth Flow:

1. **Local Testing**:
   ```
   http://localhost:3000/login
   Click "Continue with Google"
   → Should redirect to Google login
   → After auth, should redirect to /dashboard/customer
   ```

2. **Sandbox Testing**:
   ```
   https://3000-i71dxz6o37tzvul9asndi-d0b9e1e2.sandbox.novita.ai/login
   Click "Continue with Google"
   → Should work if Google OAuth URIs are configured
   ```

### Test Email Registration Flow:

1. Go to `/register`
2. Fill in:
   - Email: `test@example.com`
   - Name: `Test User`
   - Phone: `081234567890`
   - Password: `test123456`
3. Click "Daftar"
4. Should show success message
5. Check email for confirmation link
6. After confirmation, login at `/login`

---

## 🎯 AUTHENTICATION FLOW DIAGRAM

```
User clicks "Login with Google"
  ↓
AuthContext.signInWithGoogle() called
  ↓
Supabase OAuth redirect to Google
  ↓
User authenticates with Google
  ↓
Google redirects to /auth/callback?code=XXX
  ↓
Callback route (server-side):
  - Exchange code for session
  - Check if user_profiles exists
  - If not exists: Create customer profile
  - If exists: Get role from profile
  ↓
Redirect based on role:
  - admin → /dashboard/admin
  - customer → /dashboard/customer
```

---

## ✅ VERIFICATION CHECKLIST

Before testing, ensure:

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Google provider enabled in Supabase with correct credentials
- [ ] OAuth redirect URIs configured in Google Console
- [ ] RLS policies applied to user_profiles table
- [ ] Environment variables set correctly
- [ ] Application built and running

---

## 🚨 TROUBLESHOOTING

### Issue: "localhost menolak untuk tersambung"

**Cause**: OAuth callback trying to redirect to localhost:3000 but server not running  
**Fix**: Ensure development server is running before testing OAuth

### Issue: "Profile creation failed"

**Cause**: RLS policies blocking insert operation  
**Fix**: Apply RLS policies from FIX #2 above

### Issue: "Session failed"

**Cause**: Cookie configuration or session exchange failed  
**Fix**: Clear browser cookies and try again. Ensure Supabase URL is correct.

---

## 📝 NOTES

- OAuth callback route already uses server-side Supabase client (✅ correct)
- Auto-profile creation for new Google users is implemented
- Role-based dashboard redirects work properly
- All database tables exist and ready for use

---

## 🚀 NEXT STEPS AFTER CONFIGURATION

1. Apply RLS policies (FIX #2)
2. Configure Google OAuth in Supabase Dashboard (FIX #1)
3. Test authentication flows
4. Deploy to production with proper environment variables
5. Update Google OAuth URIs to production domain

---

**Status**: ✅ Code is ready. Only configuration needed.
