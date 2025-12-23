# 🔧 PANDUAN APPLY FIX: User Profile Not Found Error

## ❌ Masalah
Error: **"User profile not found. Please contact admin. This could be an RLS policy issue"**

## 🎯 Root Cause
RLS policies menggunakan subquery yang membaca `user_profiles` table lagi, menyebabkan **infinite recursion** atau policy tidak bisa mengakses data.

## ✅ Solusi
Gunakan **HANYA** `auth.uid() = id` **TANPA** subquery apapun.

---

## 📋 LANGKAH-LANGKAH APPLY FIX

### Step 1: Buka Supabase SQL Editor
1. Buka browser dan kunjungi:
   ```
   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
   ```

2. Login dengan credentials Supabase Anda

### Step 2: Copy SQL Script
1. Buka file: `FIX_RLS_USER_PROFILE_NOT_FOUND.sql`
2. **SELECT ALL** (Ctrl+A) dan **COPY** (Ctrl+C) semua content

### Step 3: Execute SQL
1. **PASTE** (Ctrl+V) SQL ke Supabase SQL Editor
2. Klik tombol **"RUN"** di pojok kanan atas
3. Tunggu hingga selesai (biasanya 2-5 detik)

### Step 4: Verify Success
Cek output di bagian bawah SQL Editor, harus muncul:

```
✅ user_profiles policies created (SIMPLIFIED)
✅ barbershop_customers policies created (OPEN for authenticated)
✅ capsters policies created (OPEN for authenticated)
✅ Trigger auto_create_barbershop_customer created
```

Dan tabel verification:

```
| tablename             | rls_status  | policy_count |
|-----------------------|-------------|--------------|
| user_profiles         | ✅ Enabled  | 5            |
| barbershop_customers  | ✅ Enabled  | 4            |
| capsters             | ✅ Enabled  | 5            |
```

---

## 🧪 TESTING SETELAH FIX

### Test 1: Customer Registration
```bash
# URL: http://localhost:3000/register
# atau: https://saasxbarbershop.vercel.app/register

1. Isi form:
   - Email: test-customer@example.com
   - Password: Test123!
   - Name: Test Customer
   - Phone: +628123456789

2. Klik "Daftar"
3. ✅ Harus berhasil tanpa error
4. ✅ Harus redirect ke /dashboard/customer
```

### Test 2: Customer Login
```bash
# URL: http://localhost:3000/login/customer

1. Login dengan:
   - Email: test-customer@example.com
   - Password: Test123!

2. ✅ Harus berhasil tanpa "User profile not found" error
3. ✅ Harus redirect ke /dashboard/customer
```

### Test 3: Capster Login
```bash
# URL: http://localhost:3000/login/capster

1. Login dengan credentials capster
2. ✅ Harus berhasil tanpa error
3. ✅ Harus redirect ke /dashboard/capster
```

### Test 4: Admin Login
```bash
# URL: http://localhost:3000/login/admin

1. Login dengan:
   - Email: hyvy311sudwKc54nviwXoi2zD1zyeo3@gmail.com
   - Password: (your admin password)

2. ✅ Harus berhasil tanpa error
3. ✅ Harus redirect ke /dashboard/admin
```

---

## 🔍 KEY CHANGES DALAM SQL FIX

### Before (❌ BROKEN):
```sql
-- BAD: Using subquery causes infinite recursion
CREATE POLICY "admin_read_all_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles  -- ❌ RECURSION!
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### After (✅ FIXED):
```sql
-- GOOD: Direct auth.uid() check only
CREATE POLICY "users_read_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);  -- ✅ NO RECURSION!
```

---

## 📊 POLICY SUMMARY AFTER FIX

### user_profiles (5 policies)
1. `service_role_bypass` - Service role full access
2. `users_read_own` - Users read their own profile
3. `users_insert_own` - Users insert their own profile
4. `users_update_own` - Users update their own profile
5. `anon_insert_profile` - Anon can insert (for signup)

### barbershop_customers (4 policies)
1. `service_role_customers_bypass` - Service role full access
2. `authenticated_read_all_customers` - All authenticated can read
3. `authenticated_insert_customers` - All authenticated can insert
4. `authenticated_update_customers` - All authenticated can update

### capsters (5 policies)
1. `service_role_capsters_bypass` - Service role full access
2. `authenticated_read_capsters` - All authenticated can read
3. `capsters_insert_own` - Capster insert their own
4. `capsters_update_own` - Capster update their own
5. `authenticated_manage_capsters` - All authenticated can manage

---

## 🆘 TROUBLESHOOTING

### Error: "permission denied"
- ✅ Make sure you're logged in to Supabase as project owner
- ✅ Check that you're in the correct project

### Error: "already exists"
- ✅ Ini normal! Script sudah idempotent, akan DROP existing policies dulu
- ✅ Scroll ke bawah, cek apakah ada message "✅ policies created"

### Masih error "User profile not found"
1. ✅ Clear browser cache dan cookies
2. ✅ Logout dan login kembali
3. ✅ Check di Supabase SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
4. ✅ Pastikan ada 5 policies seperti di summary

---

## 📝 CATATAN PENTING

1. ⚠️ **Script ini IDEMPOTENT** - Aman dijalankan berkali-kali
2. ⚠️ **Tidak akan menghapus data** - Hanya mengubah policies
3. ⚠️ **Service role key** digunakan untuk bypass RLS saat trigger
4. ✅ **Trigger auto-create customer** sudah termasuk dalam fix

---

## 🎉 SETELAH FIX BERHASIL

Semua flow ini harus bekerja **TANPA ERROR**:
- ✅ Customer registration (email)
- ✅ Customer registration (Google OAuth)
- ✅ Customer login
- ✅ Capster login
- ✅ Admin login
- ✅ Dashboard loading untuk semua role
- ✅ Profile data tampil dengan benar

---

**Last Updated**: 23 Desember 2024
**Status**: ✅ Ready to Apply
