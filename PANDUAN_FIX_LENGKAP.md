# 🚀 PANDUAN LENGKAP: FIX DATABASE & GOOGLE OAUTH

## ❗ MASALAH YANG DIIDENTIFIKASI

Berdasarkan error yang Anda alami:
```
"insert or update on table "user_profiles" violates foreign key constraint "user_profiles_customer_phone_fkey""
```

**Root Cause:**
- Table `user_profiles` memiliki foreign key constraint pada kolom `customer_phone` yang merujuk ke `barbershop_customers(customer_phone)`
- Saat registrasi, `user_profiles` dibuat PERTAMA kali, tetapi `barbershop_customers` belum ada
- Ini menyebabkan constraint violation

**Solusi:** 
- Hapus foreign key constraint yang bermasalah
- Gunakan trigger untuk auto-create `barbershop_customers` setelah `user_profiles` berhasil dibuat

---

## 📋 LANGKAH 1: APPLY SQL FIX KE SUPABASE

### A. Login ke Supabase Dashboard

1. Buka: https://supabase.com/dashboard
2. Login dengan akun Anda
3. Pilih project: **qwqmhvwqeynnyxaecqzw**

### B. Buka SQL Editor

1. Di sidebar kiri, klik **SQL Editor**
2. Klik **+ New query**

### C. Copy & Paste SQL Fix

1. Buka file: `/home/user/webapp/FINAL_DATABASE_FIX.sql`
2. Copy SEMUA isi file
3. Paste ke SQL Editor
4. Klik **Run** (atau tekan Ctrl+Enter)

### D. Tunggu Hingga Selesai

SQL akan:
- ✅ Drop foreign key constraint yang bermasalah
- ✅ Recreate semua tabel dengan schema yang benar
- ✅ Setup RLS policies untuk semua 3 role
- ✅ Buat trigger auto-create barbershop_customers
- ✅ Verify schema dan policy count

**Expected Output:**
```
3 rows returned
6 policies per table
Function volatility: STABLE
```

---

## 📋 LANGKAH 2: KONFIGURASI GOOGLE OAUTH

### A. Buka Auth Providers di Supabase

1. Di sidebar, klik **Authentication** → **Providers**
2. Scroll ke **Google**
3. Toggle **Enable Google provider** menjadi **ON**

### B. Dapatkan Google OAuth Credentials

#### Option 1: Gunakan Existing Credentials (Jika Punya)
Jika Anda sudah punya Google Cloud Project:
- Client ID: `your-google-client-id.apps.googleusercontent.com`
- Client Secret: `your-google-client-secret`

#### Option 2: Buat Baru (Recommended)

1. **Buka Google Cloud Console**
   - https://console.cloud.google.com/

2. **Buat Project Baru** (atau pilih existing)
   - Klik **Select a project** → **NEW PROJECT**
   - Name: `SaaSxBarbershop`
   - Klik **CREATE**

3. **Enable Google+ API**
   - Search: "Google+ API"
   - Klik **ENABLE**

4. **Configure OAuth Consent Screen**
   - Navigation Menu → **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - App name: `SaaSxBarbershop`
   - User support email: `<your-email>`
   - Developer contact: `<your-email>`
   - Klik **SAVE AND CONTINUE**
   - Scopes: Skip (default is fine)
   - Test users: Add your email
   - Klik **SAVE AND CONTINUE**

5. **Create OAuth 2.0 Client ID**
   - **APIs & Services** → **Credentials**
   - Klik **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `SaaSxBarbershop Web Client`
   - **Authorized redirect URIs**, tambahkan:
     ```
     https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback
     ```
   - Klik **CREATE**
   - **SIMPAN** Client ID dan Client Secret yang muncul!

### C. Masukkan ke Supabase

1. Kembali ke Supabase **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID (for OAuth)**: `<your-client-id>`
   - **Client Secret (for OAuth)**: `<your-client-secret>`
3. Klik **Save**

### D. Update Site URL (IMPORTANT!)

1. Di Supabase Dashboard: **Authentication** → **URL Configuration**
2. **Site URL**: 
   - Development: `http://localhost:3000`
   - Production: `https://saasxbarbershop.vercel.app` (atau domain Anda)
3. **Redirect URLs**, tambahkan SEMUA:
   ```
   http://localhost:3000/**
   https://saasxbarbershop.vercel.app/**
   ```
4. Klik **Save**

---

## 📋 LANGKAH 3: TEST REGISTRASI & LOGIN

### A. Start Development Server

```bash
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs
```

### B. Test Registration Flow

#### Test 1: Customer Registration via Email
1. Buka: http://localhost:3000/register/customer
2. Isi form:
   - Email: `customer@test.com`
   - Password: `Test123!`
   - Nama: `Test Customer`
   - No. Telepon: `+628123456789`
3. Klik **Daftar**
4. ✅ **Expected**: Redirect ke `/customer/dashboard`

#### Test 2: Customer Registration via Google
1. Buka: http://localhost:3000/register/customer
2. Klik **Sign in with Google**
3. Pilih Google account
4. ✅ **Expected**: 
   - Profile created dengan role='customer'
   - Auto-create barbershop_customers record
   - Redirect ke `/customer/dashboard`

#### Test 3: Admin Login via Email
1. **PERTAMA**: Buat admin user di Supabase SQL Editor:
   ```sql
   -- Create admin user
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     'admin@oasis.com',
     crypt('Admin123!', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW()
   )
   RETURNING id;
   
   -- Copy the returned UUID, then:
   INSERT INTO user_profiles (id, email, role, full_name)
   VALUES ('<UUID-from-above>', 'admin@oasis.com', 'admin', 'System Admin');
   ```

2. Login:
   - Email: `admin@oasis.com`
   - Password: `Admin123!`
3. ✅ **Expected**: Redirect ke `/admin/dashboard`

### C. Verify di Supabase

1. **Table Editor** → **user_profiles**
   - Check: Ada record baru dengan role yang sesuai
   - Check: `customer_phone` terisi (untuk customer)

2. **Table Editor** → **barbershop_customers**
   - Check: Ada record dengan `customer_phone` yang sama
   - Check: Auto-created by trigger

3. **Authentication** → **Users**
   - Check: User sudah confirmed (untuk email)
   - Check: Provider = 'google' (untuk Google sign-in)

---

## 🐛 TROUBLESHOOTING

### Error: "User already registered"
**Cause**: Email sudah ada di `auth.users` tapi belum di `user_profiles`

**Fix**:
```sql
-- Delete from auth.users
DELETE FROM auth.users WHERE email = 'problematic@email.com';

-- Try register again
```

### Error: "infinite recursion detected in policy"
**Cause**: RLS policy menggunakan function yang query table yang sama

**Fix**: SQL sudah di-fix dengan function volatility `STABLE` instead of `IMMUTABLE`

### Error: "Could not fetch user"
**Cause**: Session expired atau invalid

**Fix**:
```javascript
// Clear session
await supabase.auth.signOut();
// Try login again
```

### Google OAuth tidak muncul
**Cause**: Provider belum enabled atau credentials salah

**Fix**:
1. Check Supabase **Authentication** → **Providers** → **Google** is **ON**
2. Verify Client ID & Secret
3. Check redirect URI match exactly:
   ```
   https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback
   ```

---

## ✅ CHECKLIST FINAL

Sebelum declare SUCCESS, pastikan:

- [ ] SQL fix berhasil di-apply di Supabase SQL Editor
- [ ] Verification queries return expected results
- [ ] Google OAuth configured dengan Client ID & Secret
- [ ] Site URL & Redirect URLs sudah benar
- [ ] Customer bisa register via Email ✅
- [ ] Customer bisa register via Google ✅
- [ ] Admin bisa login ✅
- [ ] `user_profiles` dan `barbershop_customers` ter-sync ✅
- [ ] No foreign key constraint errors ✅

---

## 🎯 NEXT STEPS (FASE 3)

Setelah semua test berhasil:

1. **Build Capster Registration Flow**
   - `/register/capster` page
   - Auto-create `capsters` record
   - Link to `user_profiles.capster_id`

2. **Build Booking System**
   - Customer booking form
   - Real-time queue management
   - WhatsApp notifications

3. **Push to GitHub**
   ```bash
   cd /home/user/webapp
   git add .
   git commit -m "Fix: Resolve foreign key constraint & add Google OAuth"
   git push origin main
   ```

---

## 📞 NEED HELP?

Jika masih ada error, check:
1. Browser Console (F12) → Console tab
2. Supabase Logs: Dashboard → Logs → API/Auth logs
3. Server logs: `pm2 logs webapp --nostream`

Provide error message untuk debugging!
