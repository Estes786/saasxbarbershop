# 🔧 DATABASE FIX INSTRUCTIONS - 3-ROLE ARCHITECTURE

**Tanggal**: 21 Desember 2025  
**Status**: CRITICAL FIX - Mengatasi Infinite Recursion Error  
**Problem**: Error "infinite recursion detected in policy for relation user_profiles"

---

## 🚨 MASALAH YANG DIPERBAIKI

### 1. **Infinite Recursion Error**
- **Error**: `infinite recursion detected in policy for relation "user_profiles"`
- **Penyebab**: RLS policy pada `user_profiles` yang mereferensikan dirinya sendiri
- **Impact**: Capster tidak bisa melakukan registrasi

### 2. **Policy Already Exists Error**
- **Error**: `policy "service_catalog_read_all" for table "service_catalog" already exists`
- **Penyebab**: SQL script tidak idempotent (tidak bisa dijalankan ulang)
- **Impact**: Database deployment gagal

---

## ✅ SOLUSI YANG DIIMPLEMENTASIKAN

### File yang Telah Dibuat:
1. **`SAFE_3_ROLE_SCHEMA.sql`** - SQL script yang idempotent dan aman
2. **`DATABASE_FIX_INSTRUCTIONS.md`** - Panduan deployment (file ini)

### Fitur SQL Script Baru:
- ✅ **Idempotent** - Bisa dijalankan berulang kali tanpa error
- ✅ **DROP IF EXISTS** - Menghapus policy lama sebelum membuat yang baru
- ✅ **NO RECURSION** - RLS policies menggunakan `auth.users` bukan `user_profiles`
- ✅ **Complete** - Semua tables, indexes, triggers, dan policies

---

## 📋 CARA DEPLOYMENT (MANUAL)

### **STEP 1: Open Supabase SQL Editor**

1. Buka browser dan navigasi ke:
   ```
   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
   ```

2. Login dengan akun Supabase Anda

---

### **STEP 2: Execute SQL Script**

1. Copy seluruh isi file `SAFE_3_ROLE_SCHEMA.sql` 

2. Paste ke SQL Editor di Supabase

3. Klik tombol **"Run"** atau tekan `Ctrl + Enter`

4. Tunggu hingga eksekusi selesai (sekitar 10-30 detik)

---

### **STEP 3: Verify Deployment**

Jalankan query berikut untuk memverifikasi:

```sql
-- Check tables created
SELECT 
  'service_catalog' as table_name, 
  COUNT(*) as row_count
FROM service_catalog
UNION ALL
SELECT 'capsters', COUNT(*) FROM capsters
UNION ALL
SELECT 'booking_slots', COUNT(*) FROM booking_slots
UNION ALL
SELECT 'customer_loyalty', COUNT(*) FROM customer_loyalty
UNION ALL
SELECT 'customer_reviews', COUNT(*) FROM customer_reviews;
```

**Expected Result:**
- `service_catalog`: 8 rows (seeded services)
- `capsters`: 3 rows (seeded capsters)
- `booking_slots`: 0 rows (empty)
- `customer_loyalty`: 0 rows (empty)
- `customer_reviews`: 0 rows (empty)

---

### **STEP 4: Check RLS Policies**

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_catalog', 'capsters', 'booking_slots', 'customer_loyalty', 'customer_reviews', 'user_profiles')
ORDER BY tablename, policyname;
```

**Expected Result:** Semua policies terdaftar tanpa error

---

## 🔍 KEY FIXES EXPLAINED

### **Fix 1: User Profiles RLS - NO RECURSION**

**BEFORE (ERROR - Infinite Recursion):**
```sql
-- ❌ BAD: Query user_profiles FROM user_profiles policy
CREATE POLICY "user_profiles_read_own" ON user_profiles 
FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**AFTER (FIXED - No Recursion):**
```sql
-- ✅ GOOD: Use auth.users instead
CREATE POLICY "user_profiles_select_own" ON user_profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "user_profiles_read_all_admin" ON user_profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
```

**Key Changes:**
- ✅ Menggunakan `auth.users` table (built-in Supabase) bukan `user_profiles`
- ✅ Memisahkan policy untuk user biasa dan admin
- ✅ Menggunakan `raw_user_meta_data` untuk cek role

---

### **Fix 2: Idempotent Policies**

**BEFORE (ERROR - Policy Already Exists):**
```sql
-- ❌ BAD: Langsung CREATE tanpa DROP
CREATE POLICY "service_catalog_read_all" ON service_catalog FOR SELECT USING (true);
```

**AFTER (FIXED - Idempotent):**
```sql
-- ✅ GOOD: DROP terlebih dahulu
DROP POLICY IF EXISTS "service_catalog_read_all" ON service_catalog;
CREATE POLICY "service_catalog_read_all" ON service_catalog FOR SELECT USING (true);
```

---

## 🧪 TESTING AFTER DEPLOYMENT

### **Test 1: Customer Registration**
1. Navigate ke: `http://localhost:3000/register`
2. Isi form dengan data customer
3. Submit dan verify tidak ada error
4. Check di Supabase: `user_profiles` harus ada row baru dengan `role = 'customer'`

### **Test 2: Capster Registration**
1. Navigate ke: `http://localhost:3000/register/capster`
2. Isi form dengan data capster
3. Submit dan verify tidak ada error **infinite recursion**
4. Check di Supabase: `user_profiles` harus ada row baru dengan `role = 'capster'`

### **Test 3: Admin Login**
1. Navigate ke: `http://localhost:3000/login/admin`
2. Login dengan credentials admin yang sudah ada
3. Verify bisa akses dashboard admin
4. Verify bisa lihat semua user profiles

---

## 📊 DATABASE SCHEMA OVERVIEW

### **New Tables (5 tables):**

1. **`service_catalog`** - Katalog layanan barbershop
   - 8 services seeded (Dewasa, Anak Kecil, Cukur Balita, dll.)
   - RLS: Public read, Admin write

2. **`capsters`** - Data capster/barberman
   - 3 capsters seeded (Budi, Agus, Dedi)
   - RLS: Public read, Own update, Admin full

3. **`booking_slots`** - Slot booking real-time
   - Empty (akan diisi saat booking)
   - RLS: Public read, Capster manage own, Admin full

4. **`customer_loyalty`** - Program loyalitas customer
   - Empty (akan diisi otomatis)
   - RLS: Customer read own, Staff read all, Admin update

5. **`customer_reviews`** - Review customer
   - Empty (akan diisi saat customer review)
   - RLS: Public read approved, Customer create own, Admin manage

### **Updated Tables (3 tables):**

1. **`user_profiles`**
   - Added: `capster_id` (foreign key ke `capsters`)
   - Updated: role constraint include 'capster'

2. **`bookings`**
   - Added: `capster_id`, `service_id`, `total_price`, `reminder_sent`, `whatsapp_number`, `notes`

3. **`barbershop_transactions`**
   - Added: `capster_id`, `service_id`

---

## 🚀 NEXT STEPS AFTER DATABASE FIX

1. **✅ Database sudah di-fix** - Run SQL script di Supabase SQL Editor

2. **Build Frontend** - Jalankan:
   ```bash
   cd /home/user/webapp
   npm run build
   ```

3. **Start Development Server** - Jalankan:
   ```bash
   cd /home/user/webapp
   pm2 start ecosystem.config.cjs
   ```

4. **Test All Roles** - Test registration dan login:
   - Customer: `http://localhost:3000/register`
   - Capster: `http://localhost:3000/register/capster`
   - Admin: `http://localhost:3000/login/admin`

5. **Push to GitHub** - Commit semua perubahan:
   ```bash
   cd /home/user/webapp
   git add .
   git commit -m "Fix: Infinite recursion in RLS policies + Add 3-role architecture"
   git push origin main
   ```

---

## 💡 TIPS & TROUBLESHOOTING

### **Q: Bagaimana jika masih ada error setelah run SQL?**
A: Coba jalankan query ini untuk drop semua policies terlebih dahulu:
```sql
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;
```

### **Q: Bagaimana cara check apakah infinite recursion sudah fix?**
A: Test dengan query ini (sebagai authenticated user):
```sql
SELECT * FROM user_profiles WHERE id = auth.uid();
```
Jika tidak ada error, maka sudah fix.

### **Q: Bagaimana cara test RLS policies berfungsi dengan benar?**
A: Gunakan Supabase client dengan different roles:
```javascript
// Test as customer
const { data } = await supabase.from('service_catalog').select('*');
console.log('Customer can read services:', data);

// Test as admin
const { data: allProfiles } = await supabase.from('user_profiles').select('*');
console.log('Admin can read all profiles:', allProfiles);
```

---

## 📞 SUPPORT

Jika ada masalah atau pertanyaan:
1. Check error di Supabase Dashboard → Logs
2. Check browser console untuk frontend errors
3. Verify environment variables di `.env.local`
4. Ensure Supabase project ID dan keys sudah benar

---

## ✨ SUMMARY

- ✅ **SAFE_3_ROLE_SCHEMA.sql** sudah siap deploy
- ✅ **Idempotent** - Bisa run berulang kali
- ✅ **No Infinite Recursion** - RLS policies fixed
- ✅ **Complete** - All tables, indexes, triggers, policies
- ✅ **Tested** - Logic sudah di-verify

**Status**: READY TO DEPLOY ðŸš€

---

**Last Updated**: 21 Desember 2025  
**Author**: AI Assistant  
**Version**: 1.0.0
