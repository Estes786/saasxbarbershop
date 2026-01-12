# 🔧 SOLUSI LENGKAP - FIX RBAC & AUTHENTICATION

## 📋 MASALAH YANG DITEMUKAN

Berdasarkan analisis, ada beberapa masalah:

1. **RLS Policy Blocking** - "new row violates row-level security policy for table 'barbershop_customers'"
2. **Redirect tidak sesuai role** - Admin diarahkan ke customer dashboard
3. **Google OAuth role detection** - Role tidak terdeteksi saat login dengan Google

## ✅ SOLUSI LANGKAH DEMI LANGKAH

### LANGKAH 1: Apply RLS Policies di Supabase Dashboard

**PENTING**: Anda HARUS apply SQL ini di Supabase Dashboard > SQL Editor

```sql
-- ========================================
-- COMPREHENSIVE RLS FIX FOR RBAC
-- ========================================

-- PART 1: Fix user_profiles policies
-- Drop ALL existing policies
DROP POLICY IF EXISTS "service_role_full_access" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_select_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_update_own" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON user_profiles;

-- Disable and re-enable RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create NEW policies
CREATE POLICY "service_role_full_access" 
ON user_profiles FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "users_insert_own_profile" 
ON user_profiles FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_select_own_profile" 
ON user_profiles FOR SELECT TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" 
ON user_profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_select_all_profiles" 
ON user_profiles FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- PART 2: Fix barbershop_customers policies
-- Drop ALL existing policies
DROP POLICY IF EXISTS "service_role_full_access_customers" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON barbershop_customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_view_own_data" ON barbershop_customers;
DROP POLICY IF EXISTS "customers_insert_during_signup" ON barbershop_customers;
DROP POLICY IF EXISTS "admin_view_all_customers" ON barbershop_customers;

-- Disable and re-enable RLS
ALTER TABLE barbershop_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- Create NEW policies
CREATE POLICY "service_role_full_access_customers" 
ON barbershop_customers FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "customers_view_own_data" 
ON barbershop_customers FOR SELECT TO authenticated 
USING (customer_phone IN (
  SELECT customer_phone FROM user_profiles WHERE id = auth.uid()
));

CREATE POLICY "customers_insert_during_signup" 
ON barbershop_customers FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "admin_view_all_customers" 
ON barbershop_customers FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Verify policies created
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'barbershop_customers')
ORDER BY tablename, policyname;
```

**CARA APPLY:**
1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
2. Klik **SQL Editor** di sidebar kiri
3. Klik **New Query**
4. Copy-paste SQL di atas
5. Klik **Run** (atau tekan Ctrl+Enter)
6. Pastikan tidak ada error - semua query harus sukses

**VERIFIKASI:**
Setelah apply, cek di SQL Editor hasil query terakhir. Anda harus melihat:
- **user_profiles**: 5 policies (service_role_full_access, users_insert_own_profile, users_select_own_profile, users_update_own_profile, admin_select_all_profiles)
- **barbershop_customers**: 4 policies (service_role_full_access_customers, customers_view_own_data, customers_insert_during_signup, admin_view_all_customers)

---

### LANGKAH 2: Code Sudah Diperbaiki

Code sudah saya fix di repository:
- ✅ AuthContext.tsx - Role detection dan redirect logic
- ✅ RLS policies structure
- ✅ OAuth callback handling

---

### LANGKAH 3: Testing Flow

Setelah apply SQL di atas, test dengan:

**Test 1: Register Customer**
```
Email: testcustomer@example.com
Password: Test1234!
Phone: 081234567890
Name: Test Customer
```
Expected: Redirect ke `/dashboard/customer`

**Test 2: Register Admin**
```
Email: testadmin@example.com  
Password: Admin1234!
```
Expected: Redirect ke `/dashboard/admin`

**Test 3: Login dengan Email**
Expected: Redirect sesuai role masing-masing

**Test 4: Login dengan Google**
Expected: Redirect ke customer dashboard (default role)

---

## 🎯 KESIMPULAN

**ROOT CAUSE**: 
RLS policies terlalu ketat, blocking INSERT operation saat signup customer.

**SOLUTION**:
1. Apply SQL fix di atas (MANDATORY - harus dilakukan manual di dashboard)
2. Code sudah diperbaiki
3. Test semua flow

**NEXT STEPS UNTUK ANDA**:
1. ✅ Apply SQL di Supabase Dashboard (PRIORITAS #1)
2. ✅ Verifikasi policies created
3. ✅ Test registration flow
4. ✅ Test login flow  
5. ✅ Test Google OAuth
6. ✅ Verify role-based redirects

Setelah Anda apply SQL tersebut, konfirmasi ke saya dan saya akan lanjutkan dengan build & deployment!
