# 🔧 DATABASE SETUP MANUAL - 3 ROLE ARCHITECTURE

## ⚠️ PENTING: BACA INI TERLEBIH DAHULU!

File ini berisi instruksi lengkap untuk setup database 3-role architecture di Supabase. 

**Status Error Saat Ini:**
- ❌ Error: "policy 'service_catalog_read_all' for table 'service_catalog' already exists"
- ✅ **FIXED**: File `APPLY_3_ROLE_SCHEMA_FIXED.sql` sudah dibuat dengan handling yang aman

---

## 📋 LANGKAH-LANGKAH SETUP

### **STEP 1: Login ke Supabase Dashboard**

1. Buka browser dan akses: https://supabase.com/dashboard
2. Login menggunakan credentials Anda
3. Select project: `qwqmhvwqeynnyxaecqzw`

---

### **STEP 2: Buka SQL Editor**

1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik tombol **"New Query"** atau **"+ New query"**

---

### **STEP 3: Copy SQL Script**

Ada 2 file SQL yang bisa Anda gunakan:

#### **Option A: APPLY_3_ROLE_SCHEMA_FIXED.sql (RECOMMENDED) ✅**

File ini **AMAN** untuk dijalankan berulang kali (idempotent):
- ✅ Menangani duplicate policy errors
- ✅ Menggunakan `IF NOT EXISTS` untuk semua CREATE TABLE
- ✅ Menggunakan `ON CONFLICT DO NOTHING` untuk INSERT
- ✅ Menggunakan `DO $$ BEGIN ... END $$` untuk DROP POLICY

```bash
# Location
/home/user/webapp/APPLY_3_ROLE_SCHEMA_FIXED.sql
```

#### **Option B: APPLY_3_ROLE_SCHEMA.sql (Original)**

File original yang mungkin error jika ada duplicate policies:

```bash
# Location
/home/user/webapp/APPLY_3_ROLE_SCHEMA.sql
```

**REKOMENDASI: Gunakan Option A (FIXED version)**

---

### **STEP 4: Paste dan Execute**

1. Copy seluruh isi file `APPLY_3_ROLE_SCHEMA_FIXED.sql`
2. Paste ke SQL Editor di Supabase
3. Klik tombol **"Run"** atau tekan `Ctrl+Enter` / `Cmd+Enter`
4. Tunggu hingga eksekusi selesai (mungkin 10-30 detik)

---

### **STEP 5: Verifikasi Hasil**

Setelah script selesai dijalankan, Anda akan melihat hasil verification queries di bagian bawah:

#### **Expected Output 1: Tables Created**

```
schemaname | tablename                | tableowner
public     | booking_slots            | postgres
public     | bookings                 | postgres
public     | capsters                 | postgres
public     | customer_loyalty         | postgres
public     | customer_reviews         | postgres
public     | service_catalog          | postgres
public     | user_profiles            | postgres
public     | barbershop_transactions  | postgres
```

✅ **Pastikan semua 8 tabel ada**

#### **Expected Output 2: RLS Policies**

```
tablename         | policyname                          | cmd
service_catalog   | service_catalog_read_all            | SELECT
service_catalog   | service_catalog_write_admin         | ALL
capsters          | capsters_read_all                   | SELECT
capsters          | capsters_update_own                 | UPDATE
capsters          | capsters_admin_all                  | ALL
booking_slots     | booking_slots_read_all              | SELECT
booking_slots     | booking_slots_manage_own            | ALL
booking_slots     | booking_slots_admin_all             | ALL
customer_loyalty  | customer_loyalty_read_own           | SELECT
customer_loyalty  | customer_loyalty_read_capster_admin | SELECT
customer_loyalty  | customer_loyalty_update_admin       | UPDATE
customer_reviews  | customer_reviews_read_approved      | SELECT
customer_reviews  | customer_reviews_create_own         | INSERT
customer_reviews  | customer_reviews_read_all_staff     | SELECT
customer_reviews  | customer_reviews_manage_admin       | UPDATE
```

✅ **Pastikan semua policies ada**

#### **Expected Output 3: Row Counts**

```
table_name       | row_count
service_catalog  | 8
capsters         | 3
booking_slots    | 0
customer_loyalty | 0
customer_reviews | 0
```

✅ **Pastikan service_catalog = 8 rows & capsters = 3 rows**

---

### **STEP 6: Check for Errors**

Jika ada error, baca pesan error-nya dengan teliti:

#### **Error 1: Policy Already Exists**

```
ERROR: policy "xxx" for table "yyy" already exists
```

**Solution:**
- Ini normal jika Anda menjalankan script berkali-kali
- File `APPLY_3_ROLE_SCHEMA_FIXED.sql` sudah menangani ini dengan `DO $$ BEGIN ... END $$` blocks
- Script akan tetap berjalan dan ignore error ini

#### **Error 2: Table Already Exists**

```
ERROR: relation "xxx" already exists
```

**Solution:**
- Ini normal, script menggunakan `CREATE TABLE IF NOT EXISTS`
- Script akan skip dan lanjut ke step berikutnya

#### **Error 3: Column Already Exists**

```
ERROR: column "xxx" of relation "yyy" already exists
```

**Solution:**
- Ini normal, script menggunakan `ADD COLUMN IF NOT EXISTS`
- Script akan skip dan lanjut

#### **Error 4: Foreign Key Constraint**

```
ERROR: insert or update on table "xxx" violates foreign key constraint
```

**Solution:**
- Ini serius! Berarti ada data yang belum sesuai
- Check apakah tabel `barbershop_customers` sudah ada
- Check apakah tabel `user_profiles` sudah ada
- Hubungi developer untuk troubleshooting

---

## ✅ VERIFICATION CHECKLIST

Setelah script selesai, check list ini:

- [ ] **8 Tables Created:**
  - service_catalog
  - capsters
  - booking_slots
  - customer_loyalty
  - customer_reviews
  - user_profiles (updated)
  - bookings (updated)
  - barbershop_transactions (updated)

- [ ] **15 RLS Policies Created** (see Expected Output 2)

- [ ] **Seed Data Inserted:**
  - 8 services in service_catalog
  - 3 capsters in capsters

- [ ] **Triggers Created:**
  - set_referral_code (auto-generate referral code)
  - trg_update_capster_stats (update capster stats)
  - trg_update_capster_rating (update capster rating)

- [ ] **Functions Created:**
  - generate_referral_code()
  - update_capster_stats()
  - update_capster_rating()

---

## 🔄 JIKA ADA MASALAH

### **Scenario 1: Script Berhenti di Tengah Jalan**

1. Baca pesan error dengan teliti
2. Copy error message
3. Cari di script SQL baris mana yang error
4. Comment out baris tersebut dengan `--` di depannya
5. Run ulang script

### **Scenario 2: Ingin Reset Semua**

**⚠️ HATI-HATI: INI AKAN MENGHAPUS SEMUA DATA!**

```sql
-- DROP ALL NEW TABLES (RUN WITH EXTREME CAUTION!)
DROP TABLE IF EXISTS customer_reviews CASCADE;
DROP TABLE IF EXISTS customer_loyalty CASCADE;
DROP TABLE IF EXISTS booking_slots CASCADE;
DROP TABLE IF EXISTS capsters CASCADE;
DROP TABLE IF EXISTS service_catalog CASCADE;

-- DROP TRIGGERS
DROP TRIGGER IF EXISTS set_referral_code ON customer_loyalty;
DROP TRIGGER IF EXISTS trg_update_capster_stats ON barbershop_transactions;
DROP TRIGGER IF EXISTS trg_update_capster_rating ON customer_reviews;

-- DROP FUNCTIONS
DROP FUNCTION IF EXISTS generate_referral_code();
DROP FUNCTION IF EXISTS update_capster_stats();
DROP FUNCTION IF EXISTS update_capster_rating();

-- Then run APPLY_3_ROLE_SCHEMA_FIXED.sql again
```

### **Scenario 3: Hanya Ingin Re-create Policies**

Jika Anda hanya ingin membuat ulang RLS policies tanpa drop tables:

```sql
-- Just run the DO blocks for DROP POLICY and CREATE POLICY
-- See lines 40-50, 81-93, etc in APPLY_3_ROLE_SCHEMA_FIXED.sql
```

---

## 📞 SUPPORT

Jika Anda mengalami masalah yang tidak tercantum di sini:

1. Screenshot error message
2. Copy SQL script yang Anda jalankan
3. Check current state database dengan:

```sql
-- Check what tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check what policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

4. Hubungi developer dengan info lengkap

---

## 🎯 NEXT STEPS AFTER DATABASE SETUP

Setelah database setup selesai:

1. ✅ **Update frontend code** untuk support 3-role navigation
2. ✅ **Create Capster Registration page** (/register/capster)
3. ✅ **Build Capster Dashboard** (/dashboard/capster)
4. ✅ **Implement Predictive Algorithm** (customer visit prediction)
5. ✅ **Build Booking System** (killer feature!)

---

**Last Updated**: 21 Desember 2025  
**Status**: Ready for execution  
**File Location**: `/home/user/webapp/APPLY_3_ROLE_SCHEMA_FIXED.sql`
