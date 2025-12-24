# 🔐 ACCESS KEY SYSTEM CONCEPT - SAAS X BARBERSHOP

**Brand**: BOZQ (Exclusive Barbershop Access)  
**Version**: 1.0.0  
**Date**: December 24, 2024

---

## 📋 OVERVIEW

Sistem **ACCESS KEY** dirancang untuk menjaga **EXCLUSIVITY** platform OASIS BI PRO x Barbershop dengan mencegah public signup yang tidak terauthorized. Setiap role (Customer, Capster, Admin) memerlukan SECRET ACCESS KEY unik untuk bisa melakukan registrasi.

---

## 🎯 TUJUAN

- ❌ **Mencegah public signup** yang tidak terauthorized
- ✅ **Kontrol siapa yang bisa register** untuk setiap role
- 🛡️ **Menjaga exclusivity platform** khusus untuk OASIS Barbershop
- 📊 **Tracking registrations** yang valid
- 🔒 **Proteksi dari spam & data junk**

---

## 🔑 ACCESS KEYS UNTUK SETIAP ROLE

### 1. **CUSTOMER ACCESS KEY**

```
Access Key: CUSTOMER_BOZQ_ACCESS_1
Purpose: Customer registration
Usage: Unlimited
```

**Cara Distribusi:**
- ✅ Diberikan saat customer datang ke barbershop pertama kali
- ✅ Di-print di kartu member/struk
- ✅ Diberikan via WhatsApp setelah verifikasi
- ✅ Share via Instagram/social media OASIS
- ✅ Display di barbershop (poster/standing banner)

**Target Audience:**
- Customer baru yang ingin booking online
- Customer existing yang belum punya akun
- Walk-in customer yang tertarik pakai app

---

### 2. **CAPSTER ACCESS KEY**

```
Access Key: CAPSTER_BOZQ_ACCESS_1
Purpose: Capster/Barberman registration
Usage: Unlimited
```

**Cara Distribusi:**
- ✅ Diberikan oleh admin/owner saat onboarding capster baru
- ✅ Share via WhatsApp grup internal capster
- ✅ Di-print di SOP/guidebook untuk capster
- ✅ Diberikan saat training orientasi

**Target Audience:**
- Capster resmi OASIS Barbershop
- Barberman yang sudah di-hire
- Staff barbershop yang bekerja di OASIS

**Features:**
- Auto-approval (tidak perlu waiting approval admin)
- Langsung bisa login setelah registrasi
- Akses ke Capster Dashboard

---

### 3. **ADMIN ACCESS KEY**

```
Access Key: ADMIN_BOZQ_ACCESS_1
Purpose: Admin registration  
Usage: Limited (10 uses maximum)
```

**Cara Distribusi:**
- ✅ **EXCLUSIVE** - hanya untuk founder & management
- ✅ Diberikan secara private (WA personal/email)
- ✅ Tidak boleh di-share public

**Target Audience:**
- Owner OASIS Barbershop
- Business Manager
- Operations Manager
- Finance Manager
- Marketing Manager

**Features:**
- Limited to 10 registrations (exclusivity)
- Full access ke semua fitur platform
- Dashboard analytics & reporting
- User management capabilities

---

## 🏗️ TECHNICAL IMPLEMENTATION

### Database Schema

```sql
CREATE TABLE access_keys (
  id UUID PRIMARY KEY,
  key_name TEXT UNIQUE,
  access_key TEXT UNIQUE,
  role TEXT CHECK (role IN ('customer', 'capster', 'admin')),
  description TEXT,
  max_uses INTEGER DEFAULT NULL,  -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Validation Function

```sql
CREATE FUNCTION validate_access_key(
  p_access_key TEXT,
  p_role TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  key_name TEXT,
  message TEXT
)
```

**Validation Checks:**
1. ✅ Key exists for the role
2. ✅ Key is active
3. ✅ Key has not expired
4. ✅ Max uses not exceeded

---

## 🎨 UI/UX FLOW

### Registration Flow dengan ACCESS KEY

```
1. User klik "Register as Customer/Capster/Admin"
   ↓
2. System shows ACCESS KEY input field
   ↓
3. User masukkan ACCESS KEY (contoh: CUSTOMER_BOZQ_ACCESS_1)
   ↓
4. System validate ACCESS KEY via API
   ↓
5. If VALID:
   - Show registration form (email, password, nama, etc)
   - User complete registration
   - System increment usage counter
   - Success redirect to dashboard
   
   If INVALID:
   - Show error message
   - "Invalid access key for this role"
   - "Access key has expired"
   - "Access key reached limit"
```

### UI Components

**1. Access Key Input Field**
```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    🔑 Access Key *
  </label>
  <input
    type="text"
    placeholder="Enter your BOZQ access key"
    className="w-full px-4 py-2 border rounded-lg"
    required
  />
  <p className="text-xs text-gray-500 mt-1">
    Contoh: CUSTOMER_BOZQ_ACCESS_1
  </p>
</div>
```

**2. Error Messages**
```tsx
// Invalid key
<Alert variant="error">
  ❌ Invalid access key for customer registration.
  Please contact admin for valid key.
</Alert>

// Expired key
<Alert variant="warning">
  ⚠️ This access key has expired.
  Please request new key from admin.
</Alert>

// Max uses reached
<Alert variant="warning">
  ⚠️ This access key has reached its usage limit.
  Please contact admin for new key.
</Alert>
```

---

## 📊 ADMIN DASHBOARD - KEY MANAGEMENT

Admin dapat manage access keys melalui dashboard:

**Features:**
- ✅ View all access keys
- ✅ Create new access keys
- ✅ Deactivate/activate keys
- ✅ Set expiration date
- ✅ Set max uses limit
- ✅ View usage statistics
- ✅ Track who used which key

**Example Admin View:**
```
╔══════════════════════════════════════════════════════════╗
║  ACCESS KEY MANAGEMENT                                   ║
╠══════════════════════════════════════════════════════════╣
║ 1. CUSTOMER_BOZQ_ACCESS_1                               ║
║    Uses: 45 / unlimited | Active: ✅ | Role: Customer  ║
║                                                          ║
║ 2. CAPSTER_BOZQ_ACCESS_1                                ║
║    Uses: 12 / unlimited | Active: ✅ | Role: Capster   ║
║                                                          ║
║ 3. ADMIN_BOZQ_ACCESS_1                                  ║
║    Uses: 5 / 10 | Active: ✅ | Role: Admin             ║
╚══════════════════════════════════════════════════════════╝
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend (Supabase)
- [ ] Execute `IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql`
- [ ] Verify table `access_keys` exists
- [ ] Verify function `validate_access_key` exists
- [ ] Verify function `increment_access_key_usage` exists
- [ ] Test validation with sample keys

### Frontend (Next.js)
- [ ] Update Customer registration page
- [ ] Update Capster registration page
- [ ] Update Admin registration page
- [ ] Add ACCESS KEY input field
- [ ] Implement validation before form submission
- [ ] Add error handling & user feedback
- [ ] Test registration flow for all 3 roles

### Distribution
- [ ] Print customer access key cards
- [ ] Share capster key via internal channel
- [ ] Distribute admin keys to management
- [ ] Update marketing materials

---

## 📝 NEXT STEPS

### Phase 1: Database Setup ✅
- Execute SQL script in Supabase
- Verify tables and functions

### Phase 2: Frontend Integration 🔄
- Update registration pages
- Add ACCESS KEY validation
- Test user flows

### Phase 3: Distribution 📢
- Print & distribute keys
- Update onboarding process
- Train staff

### Phase 4: Monitoring 📊
- Track key usage
- Monitor registration conversion
- Gather user feedback

---

## 💡 FUTURE ENHANCEMENTS

1. **Dynamic Key Generation**
   - Auto-generate keys with expiration
   - One-time use keys for VIP customers

2. **QR Code Integration**
   - Convert keys to QR codes
   - Scan QR to auto-fill access key

3. **Key Analytics**
   - Track which keys convert best
   - ROI analysis per distribution channel

4. **Role-based Key Limits**
   - Different max uses per customer type
   - Premium keys for loyal customers

---

## 🔒 SECURITY NOTES

- ✅ Keys are validated server-side
- ✅ Usage is tracked and limited
- ✅ Keys can be revoked anytime
- ✅ RLS policies protect key management
- ✅ Only admins can create/modify keys

---

**🎉 CONCEPT COMPLETE - Ready for Implementation!**

**Key Files:**
- SQL Script: `IMPLEMENT_ACCESS_KEY_SYSTEM_BOZQ.sql`
- Concept Doc: This file
- Next: Frontend implementation

---

**Contact for Access Keys:**
- Customer: Tanya di barbershop
- Capster: Hubungi admin/owner
- Admin: Exclusive untuk management only
