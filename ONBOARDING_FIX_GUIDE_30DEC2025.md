# 🎯 ONBOARDING FIX GUIDE - 30 DESEMBER 2025

## 📊 MASALAH YANG DITEMUKAN

Setelah melakukan **DEEP ANALYSIS** terhadap database Supabase actual state, ditemukan masalah berikut:

### ❌ **Error 1: `column "barbershop_id" does not exist`**

**Root Cause:**
- Table `barbershops` **TIDAK ADA** di database
- Sehingga foreign key `barbershop_id` tidak bisa dibuat pada table lain

### ❌ **Error 2: `column "name" of relation "capsters" does not exist`**

**Root Cause:**
- Table `capsters` memiliki column bernama `capster_name` bukan `name`
- Frontend dan beberapa function mencari column `name` yang tidak ada

### ⚠️ **Error 3: Onboarding Progress Incomplete**

**Root Cause:**
- Table `onboarding_progress` ada tapi tidak memiliki semua kolom yang diperlukan
- Foreign key ke `barbershops` tidak ada karena table-nya tidak ada

---

## 🔍 CURRENT DATABASE STATE (ACTUAL)

### ✅ Table: `capsters`
**Columns yang ada:**
```
- id
- user_id
- capster_name ✅ (bukan "name")
- phone
- specialization
- rating
- total_customers_served
- total_revenue_generated
- is_available
- working_hours
- profile_image_url
- bio
- years_of_experience
- created_at
- updated_at
- barbershop_id
```

**Columns yang HILANG:**
- ❌ `name` (yang dicari oleh frontend)
- ❌ `status` (pending/approved/rejected)
- ❌ `approved_at`
- ❌ `rejected_at`

### ❌ Table: `barbershops`
**Status:** TIDAK ADA!

### ✅ Table: `onboarding_progress`
**Status:** ADA tapi kosong dan mungkin tidak lengkap kolom-kolomnya

### ✅ Table: `user_profiles`
**Columns yang ada:**
```
- id
- email
- role
- customer_phone
- customer_name
- created_at
- updated_at
- full_name
- user_role
- capster_id
```

---

## ✅ SOLUSI: FIX SCRIPT SQL

File: **`FIX_ONBOARDING_SCHEMA_FINAL_30DEC2025.sql`**

### 🎯 Apa yang dilakukan script ini?

1. **CREATE `barbershops` table** (jika belum ada)
   - Struktur lengkap dengan semua columns
   - RLS policies untuk security
   - Proper constraints dan indexes
   - Support untuk opening hours (JSONB)
   - Support untuk services catalog (JSONB)

2. **FIX `capsters` table**
   - Tambah column `name` sebagai alias dari `capster_name`
   - Copy data dari `capster_name` → `name`
   - Tambah column `status` (pending/approved/rejected)
   - Tambah column `approved_at` dan `rejected_at`
   - Fix foreign key `barbershop_id` dengan proper cascade

3. **UPDATE `onboarding_progress` table**
   - Tambah column `barbershop_id` (FK ke barbershops)
   - Tambah column `current_step`
   - Tambah column `completed_steps` (JSONB array)
   - Tambah column `is_completed`
   - Tambah column `completed_at`

4. **CREATE helper functions**
   - `complete_onboarding_step(user_id, step)` - Mark step as completed
   - `complete_onboarding(user_id)` - Mark onboarding as complete

5. **CREATE triggers**
   - Auto-update `updated_at` columns
   - Maintain data consistency

6. **GRANT permissions**
   - Proper access for authenticated users

---

## 🚀 CARA APPLY FIX

### **Option 1: Via Supabase Dashboard (RECOMMENDED)**

1. **Buka Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Login dengan akun Anda

2. **Select Project**
   - Project: `qwqmhvwqeynnyxaecqzw`

3. **Buka SQL Editor**
   - Menu: SQL Editor (icon database)
   - Klik "New query"

4. **Copy Script**
   - Buka file: `FIX_ONBOARDING_SCHEMA_FINAL_30DEC2025.sql`
   - Copy seluruh isi file

5. **Paste & Run**
   - Paste script ke SQL Editor
   - Click "Run" atau tekan Ctrl+Enter
   - Tunggu sampai selesai (±10 detik)

6. **Verify Success**
   - Cek output, harus muncul "Success"
   - Tidak ada error messages

### **Option 2: Via Supabase CLI** (jika sudah install)

```bash
# Install Supabase CLI (jika belum)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref qwqmhvwqeynnyxaecqzw

# Run migration
supabase db push
```

---

## ✅ VERIFICATION (Cek Setelah Apply)

Jalankan queries ini di SQL Editor untuk memverifikasi:

```sql
-- 1. Check barbershops table
SELECT 'barbershops' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'barbershops';

-- 2. Check capsters columns (should include 'name')
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'capsters'
ORDER BY ordinal_position;

-- 3. Check onboarding_progress columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'onboarding_progress'
ORDER BY ordinal_position;

-- 4. Check if 'name' column exists in capsters
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'capsters' AND column_name = 'name'
) as name_column_exists;
```

**Expected Results:**
- `barbershops` table: ~15 columns
- `capsters` table: Should include column `name`
- `onboarding_progress`: Should include `barbershop_id`, `current_step`, `completed_steps`, `is_completed`
- `name_column_exists`: `true`

---

## 🔒 SAFETY GUARANTEES

### ✅ **100% IDEMPOTENT**
- Script bisa dijalankan berkali-kali tanpa error
- Menggunakan `CREATE TABLE IF NOT EXISTS`
- Menggunakan `DO $$ BEGIN ... IF NOT EXISTS ... END $$`
- Tidak akan duplicate data

### ✅ **100% SAFE**
- **TIDAK akan drop table apapun**
- **TIDAK akan delete data apapun**
- **HANYA menambahkan** missing structures
- **HANYA mengupdate** untuk compatibility

### ✅ **Data Preservation**
- Data di `capsters` table AMAN
- Data di `user_profiles` table AMAN
- Data di `onboarding_progress` table AMAN
- Data lama akan di-copy ke column baru (capster_name → name)

---

## 🎯 SETELAH APPLY: Testing Onboarding

1. **Register sebagai Admin/Owner baru**
   - URL: https://saasxbarbershop.vercel.app/register
   - Pilih role: Owner

2. **Onboarding Flow Should Work:**
   - ✅ Step 1: Info Barbershop → Simpan ke table `barbershops`
   - ✅ Step 2: Setup Capster → Insert ke table `capsters` dengan column `name`
   - ✅ Step 3: Katalog Layanan → Simpan ke `barbershops.services`
   - ✅ Step 4: Generate Access Keys → Create customer/capster keys
   - ✅ Step 5: Test Booking → Mark onboarding complete

3. **Verify in Database:**
```sql
-- Check barbershop was created
SELECT * FROM barbershops WHERE user_id = 'YOUR_USER_ID';

-- Check capsters were added (should have 'name' column)
SELECT id, name, capster_name, status FROM capsters WHERE barbershop_id = 'YOUR_BARBERSHOP_ID';

-- Check onboarding progress
SELECT * FROM onboarding_progress WHERE user_id = 'YOUR_USER_ID';
```

---

## 🐛 TROUBLESHOOTING

### **Error: "permission denied for table barbershops"**

**Solution:**
```sql
-- Grant permissions manually
GRANT SELECT, INSERT, UPDATE ON public.barbershops TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.capsters TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_progress TO authenticated;
```

### **Error: "function update_updated_at_column does not exist"**

**Solution:**
```sql
-- Create missing trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Error: "column capster_name is null"**

**Cause:** Old data in capsters table
**Solution:**
```sql
-- Update null capster_name from name column
UPDATE public.capsters
SET capster_name = name
WHERE capster_name IS NULL AND name IS NOT NULL;
```

---

## 📋 CHECKLIST SETELAH FIX

- [ ] Script SQL berhasil dijalankan tanpa error
- [ ] Table `barbershops` sudah ada (verify via SQL)
- [ ] Column `name` ada di table `capsters`
- [ ] Column `status` ada di table `capsters`
- [ ] Table `onboarding_progress` lengkap dengan `barbershop_id`, `current_step`, dsb
- [ ] RLS policies active untuk security
- [ ] Test register admin baru → onboarding berhasil
- [ ] Test menambahkan capster → data masuk dengan column `name`
- [ ] No error "column does not exist" lagi!

---

## 🎉 SUCCESS CRITERIA

**Onboarding dianggap berhasil jika:**
1. ✅ Admin bisa complete semua 5 steps tanpa error
2. ✅ Data tersimpan di database (barbershops, capsters, onboarding_progress)
3. ✅ Access keys ter-generate dengan benar
4. ✅ Admin bisa login ke dashboard tanpa error

---

## 📞 SUPPORT

Jika masih ada error setelah apply script:

1. **Capture error message** (screenshot atau copy text)
2. **Check Supabase logs** (menu: Logs → Database)
3. **Verify table structure** menggunakan queries di atas
4. **Contact developer** dengan info error lengkap

---

## 📄 FILES IN THIS FIX

- `FIX_ONBOARDING_SCHEMA_FINAL_30DEC2025.sql` - Main fix script
- `ONBOARDING_FIX_GUIDE_30DEC2025.md` - This guide
- `analyze_actual_schema.js` - Script untuk analyze database
- `test_fix_script.js` - Script untuk test sebelum apply

---

**Last Updated:** 30 Desember 2025  
**Status:** ✅ READY TO APPLY  
**Tested:** ✅ DRY RUN PASSED  
**Safety:** ✅ 1000% SAFE & IDEMPOTENT
