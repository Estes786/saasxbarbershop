# 🚀 ACCESS KEY SYSTEM DEPLOYMENT GUIDE

## ✅ COMPLETED STEPS

1. ✅ Repository cloned dari GitHub
2. ✅ Files merged dari saasxbarbershop.zip 
3. ✅ Dependencies installed (442 packages)
4. ✅ Database analyzed:
   - user_profiles: 76 records
   - barbershop_customers: 17 records  
   - barbershop_transactions: 18 records
   - access_keys: **NOT EXISTS** (needs to be created)

---

## 🔴 CRITICAL: MANUAL SQL EXECUTION REQUIRED

Karena Supabase memerlukan SQL Editor untuk create table dan functions, ikuti langkah berikut:

### STEP 1: Login ke Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
2. Login dengan email: **hyydarr1@gmail.com**
3. Password: **@Daqukemang4**

### STEP 2: Open SQL Editor

1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik **"New query"**

### STEP 3: Execute SQL Script

1. Copy ENTIRE content dari file: **`IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql`**
2. Paste ke SQL Editor
3. Click **"Run"** button (atau tekan Ctrl/Cmd + Enter)
4. Tunggu hingga execution complete
5. Verify output menunjukkan success messages

### STEP 4: Verify Deployment

Setelah SQL script berhasil dijalankan, verify dengan query berikut di SQL Editor:

```sql
-- Check if table exists
SELECT * FROM access_keys;

-- Test validation function
SELECT * FROM validate_access_key('CUSTOMER_BOZQ_ACCESS_1', 'customer');
SELECT * FROM validate_access_key('CAPSTER_BOZQ_ACCESS_1', 'capster');
SELECT * FROM validate_access_key('ADMIN_BOZQ_ACCESS_1', 'admin');
```

Expected results:
- ✅ 3 access keys visible
- ✅ Validation returns `is_valid = true` untuk semua keys

---

## 🔑 ACCESS KEYS YANG AKAN DIBUAT

Setelah SQL script executed, akan ada 3 access keys:

### 1. **CUSTOMER_BOZQ_ACCESS_1**
- **Role**: customer
- **Uses**: Unlimited
- **Distribusi**: Diberikan ke customer di barbershop

### 2. **CAPSTER_BOZQ_ACCESS_1**
- **Role**: capster  
- **Uses**: Unlimited
- **Distribusi**: Diberikan ke capster oleh admin/owner

### 3. **ADMIN_BOZQ_ACCESS_1**
- **Role**: admin
- **Uses**: Maximum 10 uses
- **Distribusi**: Exclusive untuk management only

---

## 📝 NEXT STEPS (AFTER SQL EXECUTION)

### A. Update Registration Pages

Setelah database setup complete, kita akan:

1. **Update Customer Registration** (`/app/register/customer/page.tsx`)
   - Add ACCESS KEY input field
   - Validate key before signup
   - Show appropriate error messages

2. **Update Capster Registration** (`/app/register/capster/page.tsx`)
   - Add ACCESS KEY input field  
   - Validate key before signup
   - Auto-approve after valid key

3. **Update Admin Registration** (`/app/login/admin/page.tsx`)
   - Add ACCESS KEY input during registration
   - Extra security validation
   - Limit max uses to 10

### B. Create API Endpoint

```typescript
// /app/api/validate-access-key/route.ts
export async function POST(request: Request) {
  const { accessKey, role } = await request.json();
  
  const { data } = await supabase.rpc('validate_access_key', {
    p_access_key: accessKey,
    p_role: role
  });
  
  return Response.json(data);
}
```

### C. Test All Flows

- ✅ Customer registration dengan CUSTOMER_BOZQ_ACCESS_1
- ✅ Capster registration dengan CAPSTER_BOZQ_ACCESS_1  
- ✅ Admin registration dengan ADMIN_BOZQ_ACCESS_1
- ✅ Invalid key rejection
- ✅ Expired key handling
- ✅ Max uses limit enforcement

---

## 🔒 SECURITY NOTES

- ✅ Access keys validated server-side only
- ✅ RLS policies protect access_keys table
- ✅ Only admins can create/modify keys
- ✅ Usage tracking for all keys
- ✅ Keys can be revoked anytime

---

## 📊 MONITORING

Admin dapat monitor key usage via:

1. **Supabase Dashboard → Table Editor → access_keys**
2. Query usage stats:
```sql
SELECT 
  key_name,
  access_key,
  role,
  current_uses,
  max_uses,
  is_active,
  created_at
FROM access_keys
ORDER BY created_at DESC;
```

---

## ⚠️ IMPORTANT

**SETELAH SQL SCRIPT EXECUTED:**
1. Verify semua table dan function tercipta
2. Test validation dengan sample keys
3. Lanjutkan development frontend integration
4. Push changes to GitHub

---

**Status**: 🔴 **WAITING FOR SQL EXECUTION**  
**Priority**: 🔥 **HIGH - Required before frontend integration**  
**Estimated Time**: ⏱️ **5 minutes to execute SQL**

---

**Created**: December 24, 2024  
**Next**: Frontend integration untuk access key validation
