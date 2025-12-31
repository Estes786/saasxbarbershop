# 🔧 MANUAL FIX INSTRUCTIONS - ONBOARDING ERROR

**Error**: `column "barbershop_id" of relation "service_catalog" does not exist`

**Date**: 31 Desember 2025  
**Status**: ⚠️ REQUIRES MANUAL SQL EXECUTION

---

## 📊 DIAGNOSIS HASIL ANALISIS

Setelah melakukan analisis database, ditemukan bahwa:

### ✅ Yang Sudah Benar:
- `capsters` table memiliki kolom `barbershop_id` ✓
- `capsters` table memiliki kolom `name` ✓
- `barbershop_profiles` table sudah ada ✓

### ❌ Yang Masih Kurang:
- `service_catalog` table **TIDAK memiliki** kolom `barbershop_id` ✗

**Actual Columns in service_catalog:**
```
id, service_name, service_category, base_price, duration_minutes, 
description, image_url, is_active, display_order, created_at, updated_at
```

---

## 🛠️ CARA MEMPERBAIKI

### Option 1: Via Supabase SQL Editor (RECOMMENDED)

1. **Buka Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
   
2. **Klik "SQL Editor" di sidebar kiri**

3. **Copy-paste SQL berikut dan klik "Run":**

```sql
-- ============================================================================
-- FIX ONBOARDING SCHEMA - SIMPLE VERSION
-- Safe untuk dijalankan berkali-kali (idempotent)
-- ============================================================================

BEGIN;

-- 1. Tambahkan barbershop_id ke service_catalog
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_catalog' 
        AND column_name = 'barbershop_id'
    ) THEN
        ALTER TABLE service_catalog 
        ADD COLUMN barbershop_id UUID REFERENCES barbershop_profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added barbershop_id to service_catalog';
    ELSE
        RAISE NOTICE '✓ barbershop_id already exists in service_catalog';
    END IF;
END $$;

-- 2. Buat index untuk performance
CREATE INDEX IF NOT EXISTS idx_service_catalog_barbershop_id 
ON service_catalog(barbershop_id);

-- 3. Pastikan barbershop_profiles memiliki kolom yang dibutuhkan
ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS barbershop_name TEXT;

ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb;

ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE barbershop_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Pastikan foreign key di capsters benar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'capsters_barbershop_id_fkey'
        AND table_name = 'capsters'
    ) THEN
        ALTER TABLE capsters
        ADD CONSTRAINT capsters_barbershop_id_fkey 
        FOREIGN KEY (barbershop_id) 
        REFERENCES barbershop_profiles(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added foreign key constraint to capsters';
    ELSE
        RAISE NOTICE '✓ Foreign key constraint already exists';
    END IF;
END $$;

COMMIT;

-- Verify fix
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_catalog' 
AND column_name = 'barbershop_id';
```

4. **Lihat hasil di "Results" panel**
   - Seharusnya muncul: `✅ Added barbershop_id to service_catalog`
   - Atau: `✓ barbershop_id already exists in service_catalog`

5. **Verify dengan query ini:**

```sql
-- Check if barbershop_id exists
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'service_catalog';
```

---

### Option 2: Via Command Line (Alternative)

Jika Anda punya akses ke psql:

```bash
# Set environment variables
export PGPASSWORD='your-db-password'
export DB_URL='postgresql://postgres:[password]@db.qwqmhvwqeynnyxaecqzw.supabase.co:5432/postgres'

# Run SQL file
psql $DB_URL -f FIX_ONBOARDING_SCHEMA_31DEC2025_FINAL.sql
```

---

## ✅ VERIFICATION STEPS

Setelah menjalankan SQL, verify dengan:

### 1. Run analysis script:
```bash
node analyze_supabase_schema.js
```

**Expected Output:**
```
✅ service_catalog columns found:
   - id
   - service_name
   - service_category
   - base_price
   - duration_minutes
   - description
   - image_url
   - is_active
   - display_order
   - created_at
   - updated_at
   - barbershop_id  ← HARUS ADA INI
```

### 2. Test onboarding flow:
```bash
npm run build
npm run dev
```

Lalu:
1. Buka http://localhost:3000
2. Register as new user
3. Complete onboarding wizard
4. ✅ Seharusnya tidak ada error lagi

---

## 🔮 PREDIKSI ERROR SELANJUTNYA

Setelah fix ini, kemungkinan error yang akan muncul:

### 1. ⚠️ "null value in column violates not-null constraint"
**Solusi**: Pastikan semua input di onboarding form terisi

### 2. ⚠️ "duplicate key value violates unique constraint"
**Solusi**: Tambahkan `ON CONFLICT` clause di INSERT statements

### 3. ⚠️ "permission denied for table"
**Solusi**: Setup RLS policies yang benar

---

## 📝 SUMMARY

### Yang Harus Dilakukan:
1. ✅ Jalankan SQL di Supabase SQL Editor (Option 1 di atas)
2. ✅ Verify dengan `node analyze_supabase_schema.js`
3. ✅ Test onboarding flow
4. ✅ Report back kalau masih ada error

### Yang TIDAK Perlu Dilakukan:
- ❌ Jangan rebuild database dari scratch
- ❌ Jangan hapus data yang sudah ada
- ❌ Jangan ubah code frontend (untuk error ini)

---

## 🆘 NEED HELP?

Jika setelah running SQL masih ada error:

1. Screenshot error message
2. Screenshot hasil `node analyze_supabase_schema.js`
3. Screenshot Supabase SQL Editor results
4. Report kembali untuk analisis lebih lanjut

---

**Created by**: AI Assistant  
**Date**: 31 Desember 2025  
**File**: `MANUAL_FIX_INSTRUCTIONS.md`
