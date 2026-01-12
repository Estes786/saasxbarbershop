# 🎯 FIX LENGKAP: Masalah Registrasi & Login Capster

## 📋 MASALAH YANG DITEMUKAN

Berdasarkan analisis video dan screenshot yang Anda kirim, saya menemukan masalah-masalah berikut:

### 1. ❌ **Loading Profile Infinite Loop**
- **Masalah**: Setelah registrasi capster berhasil, redirect ke dashboard stuck di "Loading profile..."
- **Penyebab**: Dashboard capster membutuhkan `capster_id` yang tidak dibuat otomatis saat registrasi
- **Dampak**: User tidak bisa mengakses dashboard capster setelah registrasi

### 2. ❌ **Error "undefined role"**
- **Masalah**: Login capster menunjukkan error "Your account is registered as undefined"
- **Penyebab**: 
  - User profile belum dibuat dengan benar
  - Role tidak ter-set pada saat OAuth callback
- **Dampak**: Tidak bisa login menggunakan akun yang sudah terdaftar

### 3. ❌ **Duplikasi Akun / Cannot Re-login**
- **Masalah**: Setelah registrasi, akun tidak bisa digunakan untuk login lagi
- **Penyebab**: 
  - Mismatch antara proses registrasi dan login
  - Capster record tidak dibuat saat registrasi
- **Dampak**: Akun "hilang" setelah registrasi pertama kali

## ✅ SOLUSI YANG SUDAH DIIMPLEMENTASIKAN

### 1. **Fix AuthContext.tsx - Auto Create Capster Record**

**File**: `lib/auth/AuthContext.tsx`

**Perubahan**:
- Tambahkan logic untuk otomatis membuat record di table `capsters` setelah user profile dibuat
- Update `user_profiles.capster_id` setelah capster record dibuat
- Log setiap step untuk debugging

**Kode yang ditambahkan**:
```typescript
// 3.5. If capster role, create capster record
if (role === 'capster') {
  console.log('✂️ Creating capster record...');
  const { data: capsterData, error: capsterError } = await supabase
    .from("capsters")
    .insert({
      user_id: authData.user.id,
      capster_name: customerData?.name || email,
      phone: customerData?.phone || null,
      specialization: 'all',
      is_available: true,
    } as any)
    .select()
    .single();

  if (!capsterError && capsterData) {
    console.log('✅ Capster record created with ID:', (capsterData as any).id);
    // Update user profile with capster_id
    await supabase
      .from("user_profiles")
      .update({ capster_id: (capsterData as any).id } as any)
      .eq("id", authData.user.id);
    console.log('✅ User profile updated with capster_id');
  }
}
```

### 2. **Fix OAuth Callback - Support Capster Role**

**File**: `app/auth/callback/route.ts`

**Perubahan**:
- Tambahkan handling untuk role `capster` di OAuth flow
- Redirect ke dashboard capster jika role adalah capster
- Auto-create capster record untuk OAuth registration

**Kode yang ditambahkan**:
```typescript
// If capster role, create capster record
if (roleToAssign === 'capster') {
  console.log('[OAuth] Creating capster record for OAuth user...');
  const { data: capsterData, error: capsterError } = await supabase
    .from('capsters')
    .insert({
      user_id: session.user.id,
      capster_name: displayName,
      phone: null,
      specialization: 'all',
      is_available: true,
    } as any)
    .select()
    .single();

  if (!capsterError && capsterData) {
    console.log('[OAuth] Capster record created, updating user profile...');
    await supabase
      .from('user_profiles')
      .update({ capster_id: (capsterData as any).id } as any)
      .eq('id', session.user.id);
  }
}

// Redirect based on role
let dashboardUrl = '/dashboard/customer'; // default
if (roleToAssign === 'admin') {
  dashboardUrl = '/dashboard/admin';
} else if (roleToAssign === 'capster') {
  dashboardUrl = '/dashboard/capster';
}
```

### 3. **Fix Dashboard Capster - Graceful Handling**

**File**: `app/dashboard/capster/page.tsx`

**Perubahan**:
- Tambahkan logic untuk create capster record jika belum ada
- Handle gracefully saat `capster_id` belum di-set
- Auto-update user profile dengan capster_id yang baru dibuat

**Kode yang ditambahkan**:
```typescript
// 1. Load or create capster record if not exists
let currentCapsterId = profile?.capster_id;

if (!currentCapsterId) {
  console.log('⚠️ No capster_id found, attempting to create capster record...');
  // Try to create capster record
  const { data: capsterData, error: capsterError } = await supabase
    .from("capsters")
    .insert({
      user_id: profile?.id,
      capster_name: profile?.customer_name || profile?.email || 'Capster',
      phone: profile?.customer_phone || null,
      specialization: 'all',
      is_available: true,
    } as any)
    .select()
    .single();

  if (!capsterError && capsterData) {
    currentCapsterId = (capsterData as any).id;
    setCapsterId(currentCapsterId);
    console.log('✅ Capster record created:', currentCapsterId);
    
    // Update user profile with capster_id
    await supabase
      .from("user_profiles")
      .update({ capster_id: currentCapsterId } as any)
      .eq("id", profile?.id);
      
    console.log('✅ User profile updated with capster_id');
  }
}
```

### 4. **SQL Fix - Database Schema**

**File**: `FINAL_FIX_CAPSTER_COMPLETE.sql`

**Perubahan**:
- Remove problematic foreign key constraint
- Ensure all tables exist with correct schema
- Fix RLS policies untuk semua role
- Add indexes untuk performance

**Highlights**:
- ✅ Drop `user_profiles_customer_phone_fkey` constraint
- ✅ Create all tables if not exists
- ✅ Enable RLS pada semua table
- ✅ Create policies untuk service_role, authenticated users, dan per-role access
- ✅ Add indexes pada kolom yang sering di-query

## 📂 FILE YANG DIMODIFIKASI

1. ✅ `lib/auth/AuthContext.tsx` - Auto create capster record
2. ✅ `app/auth/callback/route.ts` - Handle capster OAuth flow
3. ✅ `app/dashboard/capster/page.tsx` - Graceful capster_id handling
4. ✅ `FINAL_FIX_CAPSTER_COMPLETE.sql` - Comprehensive database fix
5. ✅ `.env.local` - Environment variables untuk development

## 🚀 LANGKAH SELANJUTNYA (YANG HARUS ANDA LAKUKAN)

### ⚡ PENTING: Apply SQL Fix ke Supabase

**1. Buka Supabase SQL Editor**:
```
https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
```

**2. Copy & Paste SQL Fix**:
- Buka file `FINAL_FIX_CAPSTER_COMPLETE.sql` dari repo GitHub Anda
- Copy seluruh isi file
- Paste ke SQL Editor
- Klik **RUN**

**3. Verify Results**:
- Harus muncul success messages
- Check bahwa RLS enabled pada semua tables
- Check policies count untuk setiap table

### 🧪 Testing Flow

#### Test 1: Capster Registration via Email
1. Buka: `https://saasxbarbershop.vercel.app/register/capster`
2. Isi form registrasi dengan data test:
   - Email: `test.capster@example.com`
   - Password: `password123`
   - Nama: `Test Capster`
   - Phone: `081234567890`
3. Klik "Daftar Sebagai Capster"
4. ✅ **Expected**: Redirect ke dashboard capster dengan data lengkap (tidak stuck loading)

#### Test 2: Capster Login  
1. Buka: `https://saasxbarbershop.vercel.app/login/capster`
2. Login dengan email yang sudah terdaftar
3. ✅ **Expected**: Berhasil login dan redirect ke dashboard (tidak ada error "undefined role")

#### Test 3: Capster Registration via Google OAuth
1. Buka: `https://saasxbarbershop.vercel.app/register/capster`
2. Klik "Sign in with Google (Capster)"
3. Pilih akun Google
4. ✅ **Expected**: 
   - Auto-create capster record
   - Redirect ke dashboard capster
   - Dashboard menampilkan data lengkap

### 📊 Verification Checklist

Setelah apply SQL fix dan testing, check:

- [ ] ✅ No more "Loading profile..." infinite loop
- [ ] ✅ No more "undefined role" error saat login
- [ ] ✅ Capster dapat register via Email
- [ ] ✅ Capster dapat register via Google OAuth
- [ ] ✅ Capster dapat login setelah registrasi
- [ ] ✅ Dashboard capster menampilkan stats dengan benar
- [ ] ✅ `user_profiles.capster_id` ter-set dengan benar
- [ ] ✅ Table `capsters` memiliki record untuk setiap capster

## 🔍 CARA DEBUGGING

### Check Browser Console (F12)

Saat registrasi atau login, buka browser console dan lihat log:

```
✅ Good logs (sukses):
📝 Starting signup process...
✅ Auth user created: <user_id>
✂️ Creating capster record...
✅ Capster record created with ID: <capster_id>
✅ User profile updated with capster_id
➡️ Redirecting to capster dashboard

❌ Bad logs (error):
❌ Error creating capster: <error_message>
❌ Failed to create capster record
```

### Check Supabase Dashboard

1. **Authentication → Users**: Pastikan user ada di list
2. **Table Editor → user_profiles**: 
   - Check `role` = 'capster'
   - Check `capster_id` != null
3. **Table Editor → capsters**:
   - Check record capster ada
   - Check `user_id` match dengan user profile

### Check Network Tab

Saat loading dashboard, check network requests:
- `/api/user_profiles?id=eq.<user_id>` - harus return role='capster'
- `/api/capsters?id=eq.<capster_id>` - harus return capster data

## 💡 TIPS

### Jika Masih Ada Masalah

1. **Clear browser cache** dan logout/login ulang
2. **Check Supabase logs** di Dashboard → Logs → API/Auth
3. **Re-run SQL fix** jika ada table schema yang tidak match
4. **Check RLS policies** pastikan tidak ada yang block user

### Untuk Development Lokal

Jika ingin test di local (http://localhost:3000):

```bash
cd /home/user/webapp
npm install  # install dependencies
npm run build  # build project (PENTING)
pm2 start ecosystem.config.cjs  # start server with PM2
```

Kemudian test di http://localhost:3000

## 🎯 SUCCESS CRITERIA

Project dinyatakan **FIXED** jika:

✅ Capster bisa register via Email tanpa error  
✅ Capster bisa register via Google OAuth  
✅ Capster bisa login setelah registrasi  
✅ Dashboard capster loading dengan benar (tidak stuck)  
✅ `capster_id` ter-set otomatis saat registrasi  
✅ Tidak ada error "undefined role" atau "Loading profile..."  

## 📞 BANTUAN

Jika masih ada error setelah apply SQL fix:

1. Screenshot error message (browser console)
2. Screenshot Supabase table `user_profiles` dan `capsters`
3. Share logs dari browser console
4. Share Supabase logs dari Dashboard → Logs

---

**Status**: ✅ **ALL FIXES IMPLEMENTED & READY FOR TESTING**

**Last Updated**: 22 Desember 2024  
**Next Step**: Apply SQL fix ke Supabase dan test registration flow
