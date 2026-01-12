# 📋 INSTRUKSI MANUAL: Apply Booking Fix ke Supabase

## ⚠️ PENTING: Script SQL Harus Dijalankan Manual di Supabase SQL Editor

Karena keterbatasan API, script SQL harus dijalankan manual di Supabase SQL Editor.

## 🔧 LANGKAH-LANGKAH:

### 1. Buka Supabase Dashboard
- URL: https://supabase.com/dashboard
- Login dengan account Anda
- Pilih project: `qwqmhvwqeynnyxaecqzw`

### 2. Buka SQL Editor
- Di sidebar kiri, klik **SQL Editor**
- Klik tombol **+ New Query**

### 3. Copy Script SQL
File yang harus di-apply: `FIX_BOOKING_COMPLETE_COMPREHENSIVE_05JAN2026.sql`

Atau copy script dari output di bawah ini.

### 4. Execute Script
- Paste script ke SQL Editor
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu sampai selesai (muncul "Success" message)

### 5. Verify
Setelah script berhasil, test:
```sql
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM barbershop_customers;
SELECT COUNT(*) FROM capsters WHERE is_active = true AND status = 'approved';
SELECT COUNT(*) FROM service_catalog WHERE is_active = true;
```

---

## ✅ Yang Akan Diperbaiki:

1. **RLS Policies** - Membuka akses read/write untuk booking
2. **Performance Indexes** - Mempercepat query booking history
3. **Foreign Key Constraints** - Fix branch_id menjadi nullable
4. **Service Tier Check** - Update constraint values

---

## 🎯 Hasil yang Diharapkan:

- ✅ Booking form loading lebih cepat (< 1 detik)
- ✅ Booking history tampil dengan data yang benar
- ✅ Customer bisa create booking tanpa error
- ✅ Data booking muncul real-time di dashboard

---

## 📞 Jika Ada Masalah:

Jika masih ada error setelah apply script, cek:

1. **Error Message** di Supabase SQL Editor
2. **Browser Console** untuk error dari frontend
3. **Network Tab** untuk melihat API calls yang gagal

Lalu laporkan error message yang spesifik untuk fix lebih lanjut.

---

Generated: 05 January 2026
Script: FIX_BOOKING_COMPLETE_COMPREHENSIVE_05JAN2026.sql
