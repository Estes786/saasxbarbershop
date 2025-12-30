# 🔧 PANDUAN FIX ONBOARDING ERROR

**Error**: `column "name" of relation "capsters" does not exist`

**Root Cause**: Tabel `capsters` yang ada menggunakan kolom `capster_name`, sedangkan onboarding flow mengharapkan kolom `name`.

**Tanggal**: 30 Desember 2025

---

## 📊 Analisis Masalah

### Current State
- ✅ Tabel `capsters` sudah ada dengan kolom: `capster_name`, `phone`, `specialization`, dll
- ✅ Frontend onboarding sudah ada di `/app/onboarding/page.tsx`
- ❌ SQL migration belum dijalankan ke Supabase
- ❌ Column mismatch: `capster_name` vs `name`

### Solution
Kami telah membuat migration script yang:
1. **Menambahkan kolom `name`** ke tabel `capsters` yang sudah ada
2. **Sinkronisasi otomatis** antara `name` dan `capster_name` menggunakan trigger
3. **Membuat tabel baru** yang diperlukan untuk onboarding:
   - `barbershop_profiles`
   - `service_catalog`
   - `access_keys`
   - `onboarding_progress`
4. **Membuat helper functions**: `complete_onboarding()`, `get_onboarding_status()`, `generate_access_key()`

---

## 🚀 CARA APPLY MIGRATION

### Metode 1: Supabase SQL Editor (RECOMMENDED)

1. **Buka Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/editor
   ```

2. **Klik "SQL Editor" di sidebar kiri**

3. **Buka New Query**

4. **Copy-paste isi file migration**
   ```
   ./supabase/migrations/20251230_fix_onboarding_compatibility.sql
   ```

5. **Klik "Run" atau tekan Ctrl+Enter**

6. **Tunggu hingga selesai** (biasanya ~5-10 detik)

7. **Verify** dengan query:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'capsters' 
   ORDER BY ordinal_position;
   ```
   
   Pastikan ada kolom `name` di hasil query.

### Metode 2: Supabase CLI (Alternative)

```bash
# Login ke Supabase
npx supabase login

# Link project
npx supabase link --project-ref qwqmhvwqeynnyxaecqzw

# Run migration
npx supabase db push
```

---

## ✅ VERIFIKASI SETELAH MIGRATION

### 1. Check Tables

Jalankan query berikut di SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'barbershop_profiles',
  'capsters',
  'service_catalog', 
  'access_keys',
  'onboarding_progress'
)
ORDER BY table_name;
```

Harusnya mengembalikan 5 tabel.

### 2. Check Functions

```sql
-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'complete_onboarding',
  'get_onboarding_status',
  'generate_access_key'
)
ORDER BY routine_name;
```

Harusnya mengembalikan 3 functions.

### 3. Test Capsters Column Sync

```sql
-- Test insert with 'name' column
INSERT INTO capsters (name, specialization, phone)
VALUES ('Test Capster', 'Hair Stylist', '08123456789')
RETURNING id, name, capster_name;

-- Both 'name' and 'capster_name' should have the same value
-- Delete test data
DELETE FROM capsters WHERE name = 'Test Capster';
```

---

## 🧪 TEST ONBOARDING FLOW

### 1. Build & Start Development Server

```bash
cd /home/user/webapp

# Kill any process on port 3000
fuser -k 3000/tcp 2>/dev/null || true

# Build project
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs --nostream

# Get public URL
curl http://localhost:3000
```

### 2. Test Onboarding

1. **Register sebagai Owner**
   - Buka: `http://localhost:3000` atau public URL
   - Klik "Register" sebagai Owner
   - Isi form registration

2. **Seharusnya redirect ke `/onboarding`**
   - URL: `http://localhost:3000/onboarding`

3. **Complete Onboarding Steps**:
   - **Step 1**: Isi Profil Barbershop (nama, alamat, telepon, jam buka)
   - **Step 2**: Tambah Capster (minimal 1)
   - **Step 3**: Setup Katalog Layanan (sudah ada default)
   - **Step 4**: Lihat Access Keys (auto-generated)
   - **Step 5**: Klik "Selesai"

4. **Verify Success**
   - Seharusnya redirect ke `/dashboard/admin`
   - Tidak ada error di console
   - Data tersimpan di database

### 3. Verify Database

Setelah onboarding selesai, check data:

```sql
-- Check barbershop_profiles
SELECT id, owner_id, name, address FROM barbershop_profiles;

-- Check capsters
SELECT id, barbershop_id, name, capster_name, specialization FROM capsters;

-- Check service_catalog
SELECT id, barbershop_id, service_name, base_price FROM service_catalog;

-- Check access_keys
SELECT id, barbershop_id, key_type, key_value FROM access_keys;

-- Check onboarding_progress
SELECT user_id, barbershop_id, step_completed, is_completed FROM onboarding_progress;
```

---

## 🐛 TROUBLESHOOTING

### Error: "column name does not exist"

**Solusi**: Migration belum dijalankan atau gagal. Ulangi Metode 1.

### Error: "function complete_onboarding does not exist"

**Solusi**: Function belum dibuat. Pastikan seluruh migration script dijalankan.

### Error: "permission denied for table"

**Solusi**: RLS policies belum aktif. Check:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Onboarding tidak muncul setelah register

**Solusi**: Check redirect logic di authentication flow. Pastikan role user adalah 'admin' atau 'owner'.

---

## 📝 NEXT STEPS AFTER FIX

1. ✅ Verify onboarding works end-to-end
2. ✅ Test dengan beberapa user
3. ✅ Build production
4. ✅ Push ke GitHub
5. ✅ Deploy ke production (Vercel)

---

## 📞 SUPPORT

Jika masih ada error:

1. Check browser console untuk error JavaScript
2. Check server logs: `pm2 logs --nostream`
3. Check Supabase logs di Dashboard > Logs
4. Provide screenshot error untuk troubleshooting

---

## ✨ EXPECTED RESULT

Setelah migration berhasil:

- ✅ User bisa register sebagai Owner
- ✅ Auto-redirect ke `/onboarding`
- ✅ Onboarding wizard berjalan 5 steps
- ✅ Data tersimpan ke database
- ✅ Redirect ke `/dashboard/admin` setelah selesai
- ✅ Access keys ter-generate otomatis
- ✅ Tidak ada error di console atau logs

**SELAMAT! Onboarding flow siap digunakan! 🎉**
