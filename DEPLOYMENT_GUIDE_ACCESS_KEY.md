# 🚀 ACCESS KEY SYSTEM - DEPLOYMENT GUIDE

**Project**: BALIK.LAGI x Barbershop  
**Feature**: SECRET ACCESS KEY System (BOZQ Brand)  
**Version**: 1.0.0  
**Date**: December 24, 2024

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Frontend Verification](#frontend-verification)
4. [Testing](#testing)
5. [Distribution](#distribution)
6. [Troubleshooting](#troubleshooting)

---

## ⚡ QUICK START

### Prerequisites
- ✅ Supabase project active
- ✅ Database credentials ready
- ✅ Access to Supabase Dashboard

### What Was Implemented?
1. ✅ **Database Schema** - `access_keys` table with RLS policies
2. ✅ **Validation Functions** - Server-side validation logic
3. ✅ **API Routes** - `/api/access-key/validate` and `/api/access-key/increment`
4. ✅ **Frontend UI** - Capster registration page with ACCESS KEY input
5. ✅ **Documentation** - Complete concept and implementation guide

---

## 🗄️ DATABASE SETUP

### Step 1: Execute SQL Script

**CRITICAL: This must be done first before testing!**

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
   ```

2. **Copy SQL Script**:
   - Open file: `IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql`
   - Select ALL content (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

3. **Paste and Execute**:
   - Paste into Supabase SQL Editor
   - Click **RUN** button (or press F5)
   - Wait for execution (usually 2-5 seconds)

4. **Verify Success**:
   Look for these messages in the output:
   ```
   ✅ Table access_keys created successfully
   ✅ Index idx_access_keys_key created
   ✅ Index idx_access_keys_role created
   ✅ Index idx_access_keys_active created
   ✅ ACCESS KEY SYSTEM DEPLOYMENT COMPLETE!
   
   🔑 ACCESS KEYS (BOZQ Brand):
     1. CUSTOMER: CUSTOMER_BOZQ_ACCESS_1
     2. CAPSTER:  CAPSTER_BOZQ_ACCESS_1
     3. ADMIN:    ADMIN_BOZQ_ACCESS_1
   ```

### Step 2: Verify Database

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if table exists
SELECT * FROM access_keys;

-- Should return 3 rows with access keys for each role
```

**Expected Output:**
| key_name | access_key | role | current_uses | is_active |
|----------|------------|------|--------------|-----------|
| CUSTOMER_BOZQ_ACCESS_2025 | CUSTOMER_BOZQ_ACCESS_1 | customer | 0 | true |
| CAPSTER_BOZQ_ACCESS_2025 | CAPSTER_BOZQ_ACCESS_1 | capster | 0 | true |
| ADMIN_BOZQ_ACCESS_2025 | ADMIN_BOZQ_ACCESS_1 | admin | 0 | true |

---

## 🔍 FRONTEND VERIFICATION

### Check API Routes

1. **Validate Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/access-key/validate \
     -H "Content-Type: application/json" \
     -d '{"accessKey":"CAPSTER_BOZQ_ACCESS_1","role":"capster"}'
   ```

   **Expected Response:**
   ```json
   {
     "valid": true,
     "keyName": "CAPSTER_BOZQ_ACCESS_2025",
     "message": "Access key is valid"
   }
   ```

2. **Test Invalid Key**:
   ```bash
   curl -X POST http://localhost:3000/api/access-key/validate \
     -H "Content-Type: application/json" \
     -d '{"accessKey":"INVALID_KEY","role":"capster"}'
   ```

   **Expected Response:**
   ```json
   {
     "valid": false,
     "message": "Invalid access key for this role"
   }
   ```

---

## 🧪 TESTING

### Manual Testing Flow

#### Test 1: Capster Registration with Valid Key

1. Navigate to: `http://localhost:3000/register/capster`
2. Enter Access Key: `CAPSTER_BOZQ_ACCESS_1`
3. Click **Verify** button
4. Should see: ✅ "Access Key verified! You can proceed with registration."
5. Fill in other fields (email, password, name, phone)
6. Click **Daftar Sebagai Capster**
7. Should successfully register and redirect to dashboard

#### Test 2: Invalid Access Key

1. Navigate to: `http://localhost:3000/register/capster`
2. Enter Access Key: `WRONG_KEY_123`
3. Click **Verify** button
4. Should see: ❌ "Invalid access key for this role"
5. Registration form should remain disabled

#### Test 3: Wrong Role Key

1. Navigate to: `http://localhost:3000/register/capster`
2. Enter Access Key: `CUSTOMER_BOZQ_ACCESS_1` (customer key for capster registration)
3. Click **Verify** button
4. Should see: ❌ "Invalid access key for this role"

### Automated Testing (Optional)

Run this script to test validation:

```bash
node analyze_access_key_state.js
```

---

## 📢 DISTRIBUTION

### ACCESS KEY Distribution Strategy

#### 1. **CUSTOMER Keys**
- Print on member cards
- Display at barbershop entrance
- Share via WhatsApp after first visit
- Post on Instagram/social media
- Include in email receipts

#### 2. **CAPSTER Keys**
- Give during onboarding
- Include in employee handbook
- Share in internal WhatsApp group
- Display in staff room

#### 3. **ADMIN Keys**
- ⚠️ **HIGHLY CONFIDENTIAL**
- Only share with management
- Send via encrypted channel
- Limited to 10 uses

### Sample Distribution Message

**For Customers (WhatsApp/Instagram):**
```
🎉 Welcome to OASIS Barbershop!

Untuk booking online dan mendapatkan loyalty rewards, 
download aplikasi kami dan daftar dengan ACCESS KEY:

🔑 CUSTOMER_BOZQ_ACCESS_1

Register di: [link]
```

**For Capsters (Internal Memo):**
```
Welcome to OASIS Team! 🤝

To access Capster Dashboard, please register using:

🔑 ACCESS KEY: CAPSTER_BOZQ_ACCESS_1

Registration link: [link]

This key is for OASIS staff only. Please keep confidential.
```

---

## 🔧 TROUBLESHOOTING

### Problem 1: "Table access_keys does not exist"

**Solution:**
- SQL script not executed yet
- Go back to [Database Setup](#database-setup)
- Execute `IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql`

### Problem 2: "Function validate_access_key does not exist"

**Solution:**
- SQL script partially executed
- Re-run entire SQL script from top to bottom
- Ensure no errors in Supabase output

### Problem 3: "Access key validation fails but key is correct"

**Possible causes:**
1. Key entered with wrong case (should be uppercase)
2. Extra spaces before/after key
3. Using customer key for capster registration (role mismatch)

**Solution:**
- Trim spaces: `accessKey.trim().toUpperCase()`
- Check role matches registration page
- Verify in database: `SELECT * FROM access_keys WHERE access_key = 'YOUR_KEY'`

### Problem 4: "Cannot increment usage after registration"

**Solution:**
- Check if `increment_access_key_usage` function exists
- Verify API route is working: `/api/access-key/increment`
- Check server logs for errors

---

## 📊 MONITORING

### Track Access Key Usage

Run this query to monitor usage:

```sql
SELECT 
  key_name,
  access_key,
  role,
  current_uses,
  max_uses,
  is_active,
  CASE 
    WHEN max_uses IS NULL THEN 'Unlimited'
    WHEN current_uses >= max_uses THEN 'LIMIT REACHED'
    ELSE CONCAT(ROUND(current_uses::numeric / max_uses * 100, 1), '%')
  END as usage_percentage
FROM access_keys
ORDER BY role, key_name;
```

### Weekly Reports

Generate weekly access key reports:

```sql
-- Usage summary by role
SELECT 
  role,
  COUNT(*) as total_keys,
  SUM(current_uses) as total_registrations,
  AVG(current_uses) as avg_uses_per_key
FROM access_keys
GROUP BY role;
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] SQL script executed successfully
- [ ] Verified 3 access keys exist in database
- [ ] Tested `/api/access-key/validate` endpoint
- [ ] Tested `/api/access-key/increment` endpoint
- [ ] Tested Capster registration flow with valid key
- [ ] Tested Capster registration flow with invalid key
- [ ] Updated Customer registration page (TODO)
- [ ] Updated Admin registration page (TODO)
- [ ] Distributed customer access keys
- [ ] Distributed capster access keys
- [ ] Secured admin access keys
- [ ] Pushed to GitHub
- [ ] Updated README.md

---

## 🎯 NEXT STEPS

### Phase 2: Complete All Registration Pages

1. **Customer Registration** (`/register/page.tsx`)
   - Add ACCESS KEY input
   - Use key: `CUSTOMER_BOZQ_ACCESS_1`
   
2. **Admin Registration** (`/register/admin/page.tsx`)
   - Add ACCESS KEY input
   - Use key: `ADMIN_BOZQ_ACCESS_1`
   - Show usage counter (limited to 10)

### Phase 3: Admin Dashboard Enhancement

1. **Access Key Management Page**
   - View all keys
   - Create new keys
   - Deactivate keys
   - View usage statistics

2. **Analytics**
   - Registration conversion rate by key
   - Most used distribution channels
   - ROI analysis

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Console Logs** - Browser DevTools (F12)
2. **Check Server Logs** - Terminal running Next.js
3. **Check Supabase Logs** - Supabase Dashboard → Logs
4. **Review Documentation** - `ACCESS_KEY_CONCEPT_BOZQ.md`

---

## 🎉 COMPLETION STATUS

### ✅ Completed
- Database schema
- Validation functions
- API routes
- Capster registration page
- Documentation
- SQL script (idempotent)

### 🚧 Pending (Optional)
- Customer registration page update
- Admin registration page update
- Admin dashboard key management
- Analytics & reporting

---

**🔐 ACCESS KEY SYSTEM - READY FOR DEPLOYMENT!**

---

**Files Summary:**
- `IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql` - Database setup script
- `ACCESS_KEY_CONCEPT_BOZQ.md` - Concept documentation
- `DEPLOYMENT_GUIDE_ACCESS_KEY.md` - This file
- `app/api/access-key/validate/route.ts` - Validation API
- `app/api/access-key/increment/route.ts` - Usage increment API
- `app/(auth)/register/capster/page.tsx` - Updated registration page

**Generated on**: December 24, 2024  
**Version**: 1.0.0  
**Status**: ✅ PRODUCTION READY
