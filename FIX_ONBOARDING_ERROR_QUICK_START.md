# ⚡ FIX ONBOARDING ERROR - QUICK START

**Error**: `capsters_barbershop_id_fkey` violation  
**Waktu**: 5 menit  
**Difficulty**: Mudah

---

## 🎯 LANGKAH 1: JALANKAN SQL FIX

### **Buka Supabase Dashboard:**
```
https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
```

### **Klik: SQL Editor → New Query**

### **Copy & Paste file ini:**
```
ULTIMATE_ONBOARDING_FIX_30DEC2025.sql
```

### **Klik: RUN atau Ctrl+Enter**

### **Verify berhasil:**
```sql
SELECT COUNT(*) FROM capsters WHERE barbershop_id IS NULL;
-- Harus return: 0
```

✅ **Done!** Jika return 0, lanjut ke step 2.

---

## 🎯 LANGKAH 2: UPDATE FRONTEND CODE

Cari file onboarding (misalnya `app/admin/onboarding/page.tsx`)

**Ganti ini:**
```typescript
const { data, error } = await supabase
  .from('capsters')
  .insert({
    user_id: user.id,
    name: formData.name,
    barbershop_id: null  // ❌ INI PENYEBAB ERROR!
  });
```

**Dengan ini:**
```typescript
const { data, error } = await supabase.rpc('create_barbershop_with_owner', {
  p_owner_id: user.id,
  p_barbershop_name: formData.barbershopName,
  p_barbershop_address: formData.address || 'Belum diisi',
  p_barbershop_phone: formData.phone || '-',
  p_capster_name: formData.capsterName,
  p_capster_phone: formData.phone,
  p_capster_specialization: formData.specialization || 'General'
});

if (data?.success) {
  // Success!
  router.push('/admin/dashboard');
}
```

✅ **Done!**

---

## 🎯 LANGKAH 3: TEST

1. Register user baru
2. Complete onboarding
3. **Expected**: ✅ No error, masuk dashboard

---

## 🆘 MASIH ERROR?

**Jalankan ini di SQL Editor:**
```sql
-- Check apakah function exists
SELECT proname FROM pg_proc WHERE proname = 'create_barbershop_with_owner';

-- Jika kosong, berarti SQL fix belum dijalankan
-- Ulangi langkah 1
```

---

## 📞 NEED HELP?

1. Screenshot error message
2. Kirim ke support
3. Attach file: `ULTIMATE_ONBOARDING_FIX_30DEC2025.sql`

---

**SELESAI! 🎉**

Total waktu: ~5 menit  
Hasil: Onboarding work perfectly
