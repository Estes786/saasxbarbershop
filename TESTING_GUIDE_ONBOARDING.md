# 🧪 TESTING GUIDE - ONBOARDING FIX

**Date**: 30 December 2025  
**Project**: BALIK.LAGI System  
**Purpose**: Test onboarding flow after database fix

---

## 🎯 WHAT TO TEST

### Test 1: Capster Registration (Admin Onboarding)
**Goal**: Verify capster can register without barbershop_id

**Steps:**
1. Open application: https://saasxbarbershop.vercel.app
2. Navigate to register page
3. Select role: **Capster/Admin**
4. Fill in registration form:
   - Name: `Test Capster`
   - Email: `testcapster@example.com`
   - Password: `Password123`
5. Submit registration

**Expected Result:**
- ✅ Registration succeeds
- ✅ No error about `capsters_barbershop_id_fkey`
- ✅ User is created with `barbershop_id = NULL`
- ✅ Status is set to `pending`

**If Error Occurs:**
- ❌ Check Supabase logs
- ❌ Verify SQL script was executed
- ❌ Check frontend console for errors

---

### Test 2: Incremental Profile Update
**Goal**: Verify capster can update profile incrementally

**Steps:**
1. Login as newly registered capster
2. Navigate to profile page
3. Update profile incrementally:
   - First update: Add phone number
   - Second update: Add specialization
   - Third update: Add bio
4. Save after each update

**Expected Result:**
- ✅ Each update succeeds independently
- ✅ No errors about NOT NULL constraints
- ✅ Data persists after each save

---

### Test 3: Name Field Synchronization
**Goal**: Verify name <-> capster_name auto-sync works

**Steps:**
1. Open Supabase SQL Editor
2. Insert test capster with only `name`:
   ```sql
   INSERT INTO capsters (user_id, name, status)
   VALUES (
     (SELECT id FROM auth.users LIMIT 1),
     'Test Name Only',
     'pending'
   )
   RETURNING *;
   ```
3. Check if `capster_name` is auto-filled

**Expected Result:**
- ✅ `capster_name` is automatically set to `'Test Name Only'`
- ✅ Trigger works correctly

**Test Reverse Sync:**
```sql
INSERT INTO capsters (user_id, capster_name, status)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Capster Name Only',
  'pending'
)
RETURNING *;
```

**Expected Result:**
- ✅ `name` is automatically set to `'Test Capster Name Only'`

---

### Test 4: Barbershop Assignment
**Goal**: Verify capster can be assigned to barbershop later

**Steps:**
1. Create capster without barbershop (Test 1)
2. Login as barbershop owner
3. Navigate to capster management
4. Assign pending capster to barbershop
5. Approve capster

**Expected Result:**
- ✅ `barbershop_id` is updated successfully
- ✅ No foreign key errors
- ✅ Capster status changes to `approved`

---

### Test 5: Barbershop Deletion (Safety Test)
**Goal**: Verify capster survives barbershop deletion

**Steps:**
1. Create barbershop with assigned capsters
2. Delete the barbershop
3. Check capster records

**Expected Result:**
- ✅ Capsters still exist in database
- ✅ `barbershop_id` is set to `NULL` (not CASCADE deleted)
- ✅ Capster data is preserved

---

### Test 6: Default Values
**Goal**: Verify default values are set correctly

**Steps:**
1. Create new capster with minimal data:
   ```sql
   INSERT INTO capsters (user_id, name, status)
   VALUES (
     (SELECT id FROM auth.users LIMIT 1),
     'Minimal Capster',
     'pending'
   )
   RETURNING *;
   ```

**Expected Result:**
- ✅ `rating` = `5.0`
- ✅ `total_customers_served` = `0`
- ✅ `total_revenue_generated` = `0`
- ✅ `is_available` = `true`
- ✅ `years_of_experience` = `0`

---

### Test 7: Performance (Indexes)
**Goal**: Verify queries are fast with indexes

**Steps:**
1. Open Supabase SQL Editor
2. Run query with EXPLAIN ANALYZE:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM capsters
   WHERE barbershop_id = 'some-uuid'
   AND status = 'approved';
   ```

**Expected Result:**
- ✅ Uses index on `barbershop_id`
- ✅ Uses index on `status`
- ✅ Query time < 10ms

---

## 🔍 VERIFICATION QUERIES

### Check All Capsters
```sql
SELECT 
  id,
  name,
  capster_name,
  barbershop_id,
  status,
  phone,
  specialization,
  created_at
FROM capsters
ORDER BY created_at DESC
LIMIT 10;
```

### Check Capsters Without Barbershop
```sql
SELECT 
  COUNT(*) as count,
  status
FROM capsters
WHERE barbershop_id IS NULL
GROUP BY status;
```

### Check Trigger Function
```sql
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'capsters'::regclass;
```

### Check Foreign Key Constraint
```sql
SELECT
  con.conname as constraint_name,
  con.contype as constraint_type,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  confdeltype as on_delete_action,
  confupdtype as on_update_action
FROM pg_constraint con
WHERE conname = 'capsters_barbershop_id_fkey';
```

Expected:
- `on_delete_action` = `n` (SET NULL)

---

## 🐛 TROUBLESHOOTING

### Error: Still getting foreign key error
**Solution:**
```sql
-- Re-run the fix script
\i ONBOARDING_FIX_FINAL.sql
```

### Error: Trigger not working
**Solution:**
```sql
-- Recreate trigger
DROP TRIGGER IF EXISTS sync_capster_names_trigger ON capsters;
CREATE TRIGGER sync_capster_names_trigger
  BEFORE INSERT OR UPDATE ON capsters
  FOR EACH ROW
  EXECUTE FUNCTION sync_capster_names();
```

### Error: Default values not applied
**Solution:**
```sql
-- Reset defaults
ALTER TABLE capsters ALTER COLUMN rating SET DEFAULT 5.0;
ALTER TABLE capsters ALTER COLUMN total_customers_served SET DEFAULT 0;
ALTER TABLE capsters ALTER COLUMN total_revenue_generated SET DEFAULT 0;
ALTER TABLE capsters ALTER COLUMN is_available SET DEFAULT true;
ALTER TABLE capsters ALTER COLUMN years_of_experience SET DEFAULT 0;
```

---

## ✅ TEST COMPLETION CHECKLIST

- [ ] Test 1: Capster Registration
- [ ] Test 2: Incremental Profile Update
- [ ] Test 3: Name Field Synchronization
- [ ] Test 4: Barbershop Assignment
- [ ] Test 5: Barbershop Deletion Safety
- [ ] Test 6: Default Values
- [ ] Test 7: Performance

---

## 📊 EXPECTED METRICS

After successful fix:
- **Onboarding Success Rate**: > 95%
- **Error Rate**: < 1%
- **Average Onboarding Time**: < 2 minutes
- **Database Query Time**: < 10ms
- **No Foreign Key Errors**: ✅
- **No Check Constraint Errors**: ✅
- **No NOT NULL Errors**: ✅

---

**Author**: AI Assistant  
**Date**: 30 December 2025  
**Status**: Ready for Testing
