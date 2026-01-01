# 🏢 MULTI-LOCATION SUPPORT - PHASE 1 IMPLEMENTATION

**Date**: 01 Januari 2026  
**Status**: ✅ READY TO EXECUTE  
**Priority**: CRITICAL

---

## 📋 OVERVIEW

Phase 1 dari Multi-Location Support menambahkan kemampuan untuk barbershop mengelola multiple branches/locations dalam sistem BALIK.LAGI.

### **What's Included in Phase 1:**

✅ **Database Schema Changes:**
- New `branches` table untuk store branch information
- `branch_id` column added to: `capsters`, `service_catalog`, `bookings`, `barbershop_transactions` (if exists)
- Foreign key relationships and indexes
- Row Level Security (RLS) policies

✅ **Data Migration:**
- Automatic creation of "Main Branch" for existing barbershops
- Automatic assignment of existing capsters to default branch
- Linking existing bookings to branches via capster

✅ **Helper Functions:**
- `get_active_branches_count(barbershop_id)` - Count active branches
- `get_default_branch(barbershop_id)` - Get flagship/first branch

---

## 🗄️ DATABASE SCHEMA ANALYSIS

### **Current State (Analyzed):**

```
barbershop_profiles (2 rows):
  - id, owner_id, name, address, phone, open_time, close_time, days_open
  - logo_url, description, instagram, whatsapp, is_active
  - created_at, updated_at, barbershop_name, operating_hours

capsters (22 rows):
  - id, user_id, capster_name, phone, specialization, rating
  - total_customers_served, total_revenue_generated, is_available
  - working_hours, profile_image_url, bio, years_of_experience
  - created_at, updated_at, barbershop_id ✅ (already exists!)
  - name, status, approved_at, rejected_at, is_active, total_bookings

bookings (3 rows):
  - id, customer_phone, customer_name, booking_date, booking_time
  - service_tier, requested_capster, notes, status, created_at, updated_at
  - capster_id, service_id, total_price, reminder_sent, whatsapp_number
  - queue_number, estimated_start_time, estimated_duration_minutes
  - actual_start_time, actual_end_time, waiting_time_minutes
  - customer_notes, capster_notes, booking_source, reminder_sent_at
  - rating, feedback

service_catalog (23 rows):
  - id, service_name, service_category, base_price, duration_minutes
  - description, image_url, is_active, display_order
  - created_at, updated_at, barbershop_id ✅ (already exists!)

branches (0 rows) ✅ (table exists but empty!)

access_keys (3 rows):
  - id, key_name, access_key, role, description
  - max_uses, current_uses, is_active, expires_at
  - created_at, updated_at, created_by

loyalty_points (0 rows)
customers (0 rows)
```

### **Changes to be Made:**

1. **Table `branches`** - Already exists but empty
   - Will be populated with "Main Branch" for each barbershop

2. **Table `capsters`** - Add `branch_id` column
   - Link each capster to a branch
   - Existing capsters will be assigned to default branch

3. **Table `service_catalog`** - Add `branch_id` column (optional)
   - Allow branch-specific services

4. **Table `bookings`** - Add `branch_id` column
   - Track which branch each booking belongs to

---

## 🚀 EXECUTION INSTRUCTIONS

### **Option 1: Manual Execution via Supabase Dashboard** ✅ RECOMMENDED

1. **Login to Supabase Dashboard:**
   ```
   URL: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
   ```

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste SQL Script:**
   - Open file: `migrations/01_multi_location_support_FIXED.sql`
   - Copy all contents
   - Paste into SQL Editor

4. **Execute:**
   - Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for execution to complete (~10-30 seconds)

5. **Verify Success:**
   - Check for "✅ MULTI-LOCATION SUPPORT MIGRATION COMPLETED SUCCESSFULLY!" message
   - Review migration summary showing:
     - Total branches created (should be 2 for your 2 barbershops)
     - Capsters assigned to branches (should be 22)
     - Bookings linked to branches (should be 3)

### **Option 2: Execute via Node.js Script**

```bash
cd /home/user/webapp
node run_migration.mjs
```

**Note:** This may fail due to Supabase API limitations with multi-statement SQL. If it fails, use Option 1.

---

## ✅ VERIFICATION CHECKLIST

After running the migration, verify these changes:

### **1. Check Branches Table:**

```sql
SELECT * FROM branches;
```

**Expected Result:**
- 2 branches (one for each barbershop)
- `branch_name` like "Barbershop Name - Main Branch"
- `branch_code` like "MAIN001", "MAIN002"
- `is_flagship` = true
- `is_active` = true

### **2. Check Capsters Have branch_id:**

```sql
SELECT id, capster_name, barbershop_id, branch_id 
FROM capsters 
WHERE branch_id IS NOT NULL;
```

**Expected Result:**
- All 22 capsters should have `branch_id` assigned

### **3. Check Bookings Have branch_id:**

```sql
SELECT id, customer_name, booking_date, capster_id, branch_id 
FROM bookings 
WHERE branch_id IS NOT NULL;
```

**Expected Result:**
- All 3 bookings should have `branch_id` assigned

### **4. Test Helper Functions:**

```sql
-- Get active branches count for a barbershop
SELECT get_active_branches_count('your-barbershop-id-here');

-- Get default branch for a barbershop
SELECT get_default_branch('your-barbershop-id-here');
```

---

## 🔍 TROUBLESHOOTING

### **Error: "column branch_id already exists"**
✅ **Solution:** This is OK! Script is idempotent. It will skip creating duplicate columns.

### **Error: "table branches already exists"**
✅ **Solution:** This is OK! Script will skip table creation and proceed to data migration.

### **Error: "foreign key constraint violation"**
❌ **Problem:** Data inconsistency detected.

**Fix Steps:**
1. Check orphaned records:
   ```sql
   -- Find capsters without valid barbershop_id
   SELECT * FROM capsters 
   WHERE barbershop_id NOT IN (SELECT id FROM barbershop_profiles);
   
   -- Find bookings without valid capster_id
   SELECT * FROM bookings 
   WHERE capster_id NOT IN (SELECT id FROM capsters);
   ```

2. Clean up orphaned records or assign valid IDs before re-running migration.

---

## 📊 EXPECTED RESULTS

After successful execution, you should see output like:

```
✓ branches table already exists, skipping creation
✓ Creating indexes...
✓ Indexes created successfully
⚠ branch_id already exists in capsters, skipping
⚠ branch_id already exists in service_catalog, skipping
⚠ branch_id already exists in bookings, skipping
✓ Starting data migration...
✓ Creating default branch for 2 barbershops...
✓ Created default branches for 2 barbershops
✓ Updated 22 capsters with default branch
✓ Updated 3 bookings with branch
✓ Setting up RLS policies for branches...
✓ RLS enabled, old policies dropped
✓ RLS policies created successfully
✓ Helper functions created successfully
✓ Validating migrated data...
✅ All barbershops have at least one branch
✅ All capsters have branch assignment
📊 Migration Summary:
   - Total branches created: 2
   - Capsters assigned to branches: 22
   - Bookings linked to branches: 3

✅ MULTI-LOCATION SUPPORT MIGRATION COMPLETED SUCCESSFULLY!
```

---

## 🎯 PHASE 1 COMPLETE - NEXT STEPS

Once Phase 1 is successfully executed, we can proceed to:

### **Phase 2: Backend APIs (15-20 hours)**
- ✅ Create `/api/admin/branches` endpoints
- ✅ Branch CRUD operations (Create, Read, Update, Delete)
- ✅ Capster assignment API
- ✅ Branch-specific analytics

### **Phase 3: Frontend Components (15-20 hours)**
- ✅ Admin branch management dashboard
- ✅ Customer branch selector in booking flow
- ✅ Branch analytics and comparison
- ✅ Multi-branch reporting

### **Phase 4: Testing & Deployment (8-10 hours)**
- ✅ Comprehensive testing
- ✅ Production deployment
- ✅ Monitoring and logging

---

## 🔄 ROLLBACK (IF NEEDED)

If you need to undo this migration, execute the rollback script at the bottom of `01_multi_location_support_FIXED.sql`:

```sql
-- Drop helper functions
DROP FUNCTION IF EXISTS get_active_branches_count(UUID);
DROP FUNCTION IF EXISTS get_default_branch(UUID);

-- Drop RLS policies
DROP POLICY IF EXISTS "Admin full access to branches" ON branches;
DROP POLICY IF EXISTS "Capsters can view their branch" ON branches;
DROP POLICY IF EXISTS "Customers can view active branches" ON branches;
DROP POLICY IF EXISTS "Public can view active branches" ON branches;

-- Remove branch_id columns
ALTER TABLE bookings DROP COLUMN IF EXISTS branch_id;
ALTER TABLE service_catalog DROP COLUMN IF EXISTS branch_id;
ALTER TABLE capsters DROP COLUMN IF EXISTS branch_id;

-- Drop branches table
DROP TABLE IF EXISTS branches CASCADE;
```

---

## 📝 FILES CREATED

1. **migrations/01_multi_location_support_FIXED.sql** - Main migration script (FIXED VERSION)
2. **PHASE1_IMPLEMENTATION_GUIDE.md** - This documentation
3. **run_migration.mjs** - Optional Node.js executor (may not work due to API limitations)
4. **analyze_db.mjs** - Database schema analyzer

---

## ✅ SAFETY FEATURES

✅ **Idempotent** - Safe to run multiple times  
✅ **Data Preservation** - No data loss, only additions  
✅ **Rollback Support** - Can be undone if needed  
✅ **Validation** - Checks data integrity before and after  
✅ **Error Handling** - Graceful handling of edge cases  

---

**Ready to execute?** Follow Option 1 (Supabase Dashboard) for the safest execution! 🚀
