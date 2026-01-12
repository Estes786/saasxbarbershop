# ⚡ QUICK FIX GUIDE - Authentication Setup

**Status**: ✅ Code 100% Ready - Configuration Required  
**Time**: 5-10 minutes

---

## 🚀 2 LANGKAH SIMPLE

### **STEP 1: Apply RLS Policies** (5 menit)

1. Buka: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
2. Copy isi file: `/home/user/webapp/apply_all_fixes.sql`
3. Paste ke SQL Editor
4. Click "Run"
5. ✅ Done!

---

### **STEP 2: Setup Google OAuth** (10 menit)

#### A. Google Cloud Console

**URL**: https://console.cloud.google.com/apis/credentials

1. Create OAuth 2.0 Client ID
2. Add Authorized redirect URIs:
   ```
   https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback
   ```
3. Copy Client ID & Client Secret

#### B. Supabase Dashboard

**URL**: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw

1. Go to: Authentication → Providers
2. Enable Google
3. Paste Client ID & Secret
4. Click "Save"
5. ✅ Done!

---

## 🧪 TEST NOW!

**URL**: https://3000-inos0ot5c1vl9ww05jzr3-0e616f0a.sandbox.novita.ai

### Test Google Login:
1. Go to `/login`
2. Click "Continue with Google"
3. Should redirect to dashboard (NOT localhost!)

### Test Email Registration:
1. Go to `/register`
2. Fill form
3. Check email for confirmation
4. Confirm and login

---

## ✅ SUCCESS INDICATORS

- ✅ No "localhost:3000" error
- ✅ Google login redirects to dashboard
- ✅ Email registration creates profile
- ✅ Login works for both customer and admin

---

## 🆘 NEED HELP?

Check: `AUTHENTICATION_FIX_COMPLETE_GUIDE.md` untuk detailed instructions.

---

**GitHub**: https://github.com/Estes786/saasxbarbershop  
**Latest Commit**: "Authentication fix complete - RLS policies, SQL fixes"
