# 🏢 Multi-Location Support Migration Guide

## 📋 Overview

Migration ini menambahkan dukungan multi-location/multi-branch ke BALIK.LAGI system, memungkinkan satu barbershop owner untuk mengelola multiple locations.

**Migration File**: `migrations/01_multi_location_support.sql`  
**Status**: ✅ Ready to apply  
**Estimated Time**: 2-3 minutes  
**Impact**: Low (safe, idempotent, with rollback)

---

## ⚠️ PRE-MIGRATION CHECKLIST

Sebelum apply migration, pastikan:

- [ ] ✅ Backup database sudah dibuat
- [ ] ✅ Migration script sudah di-review
- [ ] ✅ Test script sudah dijalankan (`node scripts/test_migration.js`)
- [ ] ✅ Punya akses ke Supabase SQL Editor
- [ ] ✅ Environment sudah di-setup (`.env.local`)

---

## 🚀 HOW TO APPLY MIGRATION

### **Method 1: Via Supabase SQL Editor** (RECOMMENDED)

1. **Login ke Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `qwqmhvwqeynnyxaecqzw`

2. **Open SQL Editor**
   - Click "SQL Editor" di sidebar kiri
   - Click "New Query"

3. **Copy-Paste Migration Script**
   ```bash
   # Copy file content
   cat migrations/01_multi_location_support.sql
   ```
   - Paste ke SQL Editor
   - Click "Run" (atau Ctrl+Enter)

4. **Wait for Completion**
   - Migration akan berjalan 2-3 menit
   - Check console output untuk success messages
   - Look for: "✅ MULTI-LOCATION SUPPORT MIGRATION COMPLETED SUCCESSFULLY!"

5. **Verify Results**
   - Run verification queries (lihat section dibawah)
   - Check "Table Editor" untuk melihat `branches` table baru

### **Method 2: Via Command Line** (Advanced)

```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref qwqmhvwqeynnyxaecqzw

# Apply migration
supabase db push

# Or execute directly
psql "$DATABASE_URL" -f migrations/01_multi_location_support.sql
```

---

## ✅ VERIFICATION QUERIES

Setelah migration selesai, run queries ini di SQL Editor untuk verify:

### **1. Check branches table created**
```sql
SELECT 
    'branches table exists' as status,
    COUNT(*) as branch_count
FROM branches;
```

Expected: Should show table exists with branches created

### **2. Check column additions**
```sql
-- Check capsters.branch_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'capsters' AND column_name = 'branch_id';

-- Check service_catalog.branch_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_catalog' AND column_name = 'branch_id';

-- Check bookings.branch_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'branch_id';

-- Check transactions.branch_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'barbershop_transactions' AND column_name = 'branch_id';
```

Expected: All should return `branch_id | uuid`

### **3. Check data migration**
```sql
-- Check branches created (1 per barbershop)
SELECT 
    b.branch_name,
    b.branch_code,
    b.is_flagship,
    b.is_active,
    bp.barbershop_name
FROM branches b
JOIN barbershop_profiles bp ON b.barbershop_id = bp.id;

-- Check capsters assigned to branches
SELECT 
    c.capster_name,
    b.branch_name,
    c.branch_id IS NOT NULL as has_branch
FROM capsters c
LEFT JOIN branches b ON c.branch_id = b.id
WHERE c.barbershop_id IS NOT NULL;

-- Check bookings linked to branches
SELECT 
    bk.customer_name,
    bk.booking_date,
    b.branch_name,
    bk.branch_id IS NOT NULL as has_branch
FROM bookings bk
LEFT JOIN branches b ON bk.branch_id = b.id
LIMIT 10;
```

Expected: All should show proper linkages

### **4. Check RLS policies**
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'branches';

-- List policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'branches';
```

Expected: 
- `rowsecurity` should be `true`
- Should see 4 policies (admin, capster, customer, public)

---

## 📊 EXPECTED RESULTS

After successful migration, you should see:

### **New Table: `branches`**
```
branches
├── id (uuid, primary key)
├── barbershop_id (uuid, foreign key)
├── branch_name (varchar)
├── branch_code (varchar, unique)
├── address (text)
├── city (varchar)
├── province (varchar)
├── ... (16+ more columns)
```

### **Updated Tables with `branch_id`:**
- ✅ `capsters` - links capster to branch
- ✅ `service_catalog` - links service to branch (optional)
- ✅ `bookings` - tracks which branch booking is for
- ✅ `barbershop_transactions` - tracks branch for transaction

### **Default Branches Created:**
- 1 default "Main Branch" per existing barbershop
- Marked as `is_flagship = true`
- All existing capsters assigned to this branch
- All existing bookings linked to this branch

### **RLS Policies:**
- ✅ Admin: Full access to their barbershop's branches
- ✅ Capster: Can view their assigned branch
- ✅ Customer: Can view all active branches
- ✅ Public: Can view all active branches

---

## 🔄 ROLLBACK (IF NEEDED)

Jika migration gagal atau perlu di-undo, run rollback script yang ada di bagian akhir migration file:

```sql
-- CAUTION: This will remove all multi-location data!

-- Drop helper functions
DROP FUNCTION IF EXISTS get_active_branches_count(UUID);
DROP FUNCTION IF EXISTS get_default_branch(UUID);

-- Drop RLS policies
DROP POLICY IF EXISTS "Admin full access to branches" ON branches;
DROP POLICY IF EXISTS "Capsters can view their branch" ON branches;
DROP POLICY IF EXISTS "Customers can view active branches" ON branches;
DROP POLICY IF EXISTS "Public can view active branches" ON branches;

-- Remove branch_id columns
ALTER TABLE barbershop_transactions DROP COLUMN IF EXISTS branch_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS branch_id;
ALTER TABLE service_catalog DROP COLUMN IF EXISTS branch_id;
ALTER TABLE capsters DROP COLUMN IF EXISTS branch_id;

-- Drop branches table
DROP TABLE IF EXISTS branches CASCADE;

-- Cleanup
SELECT '✅ ROLLBACK COMPLETED' as status;
```

---

## 🐛 TROUBLESHOOTING

### **Issue: Migration hangs or times out**
**Solution**: 
- Split migration into smaller parts
- Run each section separately
- Increase timeout in SQL Editor settings

### **Issue: "permission denied" error**
**Solution**:
- Make sure you're using SERVICE_ROLE_KEY
- Check you're logged in as admin/owner
- Verify database permissions

### **Issue: "relation already exists"**
**Solution**:
- Migration is idempotent - safe to re-run
- It will skip existing tables/columns
- Check output for "already exists, skipping" messages

### **Issue: Foreign key constraint fails**
**Solution**:
- Make sure barbershop_profiles has data
- Check capsters have valid barbershop_id
- Review pre-migration test output

---

## 📈 POST-MIGRATION TASKS

After successful migration:

1. **Test in Development**
   - [ ] Create new branch via admin
   - [ ] Assign capster to branch
   - [ ] Test customer booking with branch selection
   - [ ] Verify RLS policies work

2. **Update Application Code**
   - [ ] Build admin branch management UI
   - [ ] Add branch selector to customer booking
   - [ ] Update analytics to filter by branch
   - [ ] Update capster dashboard to show branch

3. **Documentation**
   - [ ] Update API documentation
   - [ ] Update user guide
   - [ ] Document branch management workflow

4. **Monitoring**
   - [ ] Monitor database performance
   - [ ] Check for any errors in logs
   - [ ] Validate data integrity

---

## 📞 SUPPORT

Jika ada masalah atau pertanyaan:

1. **Check Logs**
   - Lihat console output migration
   - Check Supabase Dashboard > Logs

2. **Verify Data**
   - Run verification queries diatas
   - Check table structure in Table Editor

3. **Contact**
   - GitHub Issues: https://github.com/Estes786/saasxbarbershop/issues
   - Email: hyydarr1@gmail.com

---

**Migration Created**: 01 Januari 2026  
**Last Updated**: 01 Januari 2026  
**Version**: 1.0.0  
**Status**: ✅ Ready for production
