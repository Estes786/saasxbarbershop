# 🗄️ PANDUAN SETUP DATABASE SUPABASE

## 📋 Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Langkah Setup Database](#langkah-setup-database)
3. [Verifikasi Database](#verifikasi-database)
4. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Sebelum memulai, pastikan Anda memiliki:
- ✅ Akses ke [Supabase Dashboard](https://supabase.com/dashboard)
- ✅ Project Supabase sudah dibuat
- ✅ Kredensial Supabase:
  - **NEXT_PUBLIC_SUPABASE_URL**: https://qwqmhvwqeynnyxaecqzw.supabase.co
  - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: (sudah tersedia)
  - **SUPABASE_SERVICE_ROLE_KEY**: (sudah tersedia)

---

## Langkah Setup Database

### **Step 1: Login ke Supabase Dashboard**

1. Buka browser dan navigasi ke: https://supabase.com/dashboard
2. Login menggunakan kredensial Anda
3. Pilih project: **qwqmhvwqeynnyxaecqzw**

### **Step 2: Buka SQL Editor**

1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik tombol **"New query"** untuk membuat query baru

### **Step 3: Copy SQL Script**

File SQL script yang perlu dijalankan:
```
APPLY_3_ROLE_SCHEMA_SAFE.sql
```

**Lokasi file**: Di root repository GitHub atau lokal project

**Cara copy script**:
```bash
# Jika di lokal
cat /home/user/webapp/APPLY_3_ROLE_SCHEMA_SAFE.sql

# Atau buka di GitHub:
https://github.com/Estes786/saasxbarbershop/blob/main/APPLY_3_ROLE_SCHEMA_SAFE.sql
```

### **Step 4: Jalankan SQL Script**

1. **Paste** seluruh isi file `APPLY_3_ROLE_SCHEMA_SAFE.sql` ke SQL Editor
2. **Review** script untuk memastikan tidak ada kesalahan
3. Klik tombol **"RUN"** di pojok kanan bawah
4. Tunggu hingga script selesai dieksekusi (biasanya 5-10 detik)

**Output yang diharapkan:**
```
✅ Tables created successfully
✅ RLS policies applied
✅ Seed data inserted
✅ Triggers created
```

### **Step 5: Verifikasi Hasil Eksekusi**

Script akan otomatis menjalankan query verifikasi di akhir. Hasil yang diharapkan:

**Tabel yang dibuat:**
- ✅ service_catalog (8 rows)
- ✅ capsters (3 rows)
- ✅ booking_slots (0 rows - siap digunakan)
- ✅ customer_loyalty (0 rows - siap digunakan)
- ✅ customer_reviews (0 rows - siap digunakan)

**RLS Policies:**
- ✅ service_catalog: 2 policies
- ✅ capsters: 3 policies
- ✅ booking_slots: 3 policies
- ✅ customer_loyalty: 3 policies
- ✅ customer_reviews: 4 policies

---

## Verifikasi Database

### **Manual Verification via SQL Editor**

Jalankan query berikut di SQL Editor untuk memverifikasi:

#### **1. Check Tables**
```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'service_catalog',
    'capsters',
    'booking_slots',
    'customer_loyalty',
    'customer_reviews'
  )
ORDER BY tablename;
```

#### **2. Check Row Counts**
```sql
SELECT 
  'service_catalog' as table_name, 
  (SELECT COUNT(*) FROM service_catalog) as row_count
UNION ALL
SELECT 
  'capsters', 
  (SELECT COUNT(*) FROM capsters)
UNION ALL
SELECT 
  'booking_slots', 
  (SELECT COUNT(*) FROM booking_slots)
UNION ALL
SELECT 
  'customer_loyalty', 
  (SELECT COUNT(*) FROM customer_loyalty)
UNION ALL
SELECT 
  'customer_reviews', 
  (SELECT COUNT(*) FROM customer_reviews);
```

**Expected Output:**
```
service_catalog  | 8
capsters         | 3
booking_slots    | 0
customer_loyalty | 0
customer_reviews | 0
```

#### **3. Check Service Catalog Data**
```sql
SELECT 
  service_name,
  service_category,
  base_price,
  duration_minutes,
  is_active
FROM service_catalog
ORDER BY display_order;
```

**Expected Services:**
1. Cukur Dewasa - Rp 18.000
2. Cukur Anak (6-10) - Rp 15.000
3. Cukur Balita - Rp 18.000
4. Keramas - Rp 10.000
5. Kumis + Jenggot - Rp 10.000
6. Cukur + Keramas - Rp 25.000
7. Semir (Hitam) - Rp 50.000
8. Hairlight/Bleaching - Rp 150.000

#### **4. Check Capsters Data**
```sql
SELECT 
  capster_name,
  phone,
  specialization,
  rating,
  years_of_experience
FROM capsters
ORDER BY capster_name;
```

**Expected Capsters:**
1. **Agus Priyanto** - Haircut specialist (4.5★)
2. **Budi Santoso** - All services (4.8★)
3. **Dedi Wijaya** - Coloring specialist (4.9★)

#### **5. Check RLS Policies**
```sql
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_catalog', 'capsters', 'booking_slots', 'customer_loyalty', 'customer_reviews')
ORDER BY tablename, policyname;
```

---

## Troubleshooting

### ❌ **Error: "policy already exists"**

**Penyebab:** Script sudah pernah dijalankan sebelumnya

**Solusi:**
1. Script `APPLY_3_ROLE_SCHEMA_SAFE.sql` sudah **idempotent** (aman dijalankan multiple kali)
2. Script akan otomatis `DROP POLICY IF EXISTS` sebelum membuat policy baru
3. Jalankan ulang script, error seharusnya tidak muncul lagi

### ❌ **Error: "relation does not exist"**

**Penyebab:** Tabel parent (user_profiles, bookings, dll) belum ada

**Solusi:**
1. Pastikan tabel existing sudah ada:
   - `user_profiles`
   - `bookings`
   - `barbershop_transactions`
   - `barbershop_customers`

2. Jika tabel belum ada, jalankan migration dasar terlebih dahulu

### ❌ **Error: "foreign key constraint fails"**

**Penyebab:** Data reference tidak valid (misalnya user_id tidak ada di user_profiles)

**Solusi:**
1. Skip insert capsters dengan user_id: Hapus kolom `user_id` dari INSERT statement
2. Atau pastikan user_id yang di-reference sudah ada di tabel `user_profiles`

### ❌ **Error: "duplicate key value"**

**Penyebab:** Data sudah ada sebelumnya

**Solusi:**
Script sudah menggunakan `DELETE FROM` sebelum `INSERT`. Jalankan ulang script.

### ⚠️ **Verification Query Returns 0 Rows**

**Penyebab:** Script gagal dieksekusi atau ada error yang tidak terlihat

**Solusi:**
1. Scroll up di SQL Editor untuk melihat error message
2. Jalankan verification queries secara manual (lihat section Verifikasi Database)
3. Pastikan script dijalankan dengan akses admin/service_role

---

## 🎯 Next Steps

Setelah database setup selesai:

1. ✅ **Test Frontend**
   - Buka aplikasi: https://3000-if6lklkxaktsek1dfbt3t-dfc00ec5.sandbox.novita.ai
   - Navigasi ke homepage
   - Lihat 3-role navigation (Customer, Capster, Admin)

2. ✅ **Test Registration Flow**
   - Register sebagai Customer
   - Register sebagai Capster (coming soon)
   - Register sebagai Admin (butuh secret key)

3. ✅ **Test Authentication**
   - Login dengan email/password
   - Login dengan Google OAuth

4. ✅ **Test Dashboard Access**
   - Customer dashboard
   - Capster dashboard (akan dibangun)
   - Admin dashboard

---

## 📞 Support

Jika mengalami masalah:

1. **Check PM2 Logs:**
   ```bash
   pm2 logs saasxbarbershop --nostream
   ```

2. **Check Database Connection:**
   ```bash
   node /home/user/webapp/analyze_database_complete.js
   ```

3. **Contact:**
   - GitHub Issues: https://github.com/Estes786/saasxbarbershop/issues
   - Project Owner: Faras Haidar

---

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Last Updated**: 21 Desember 2025
