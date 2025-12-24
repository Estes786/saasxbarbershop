# 🔐 SECRET KEY / ACCESS KEY SYSTEM - CONCEPT & IMPLEMENTATION

## 📋 OVERVIEW

**Goal**: Implementasi sistem Secret Key/Access Key untuk menjaga exclusivity platform SaaSxBarbershop dan mencegah registrasi publik yang tidak terotorisasi.

## 🎯 CONCEPT

### **Kenapa Butuh Secret Key?**
1. **Exclusivity**: Hanya orang yang punya key yang bisa daftar
2. **Data Protection**: Mencegah spam registration & data flood
3. **Controlled Access**: Admin kontrol siapa yang boleh masuk
4. **MVP Security**: Fase awal butuh keamanan maksimal

### **3-Role Secret Key Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     SECRET KEY SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  ADMIN KEY    │  │  CAPSTER KEY  │  │ CUSTOMER KEY  │   │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤   │
│  │ - Pre-defined │  │ - Pre-defined │  │ - Pre-defined │   │
│  │ - 1 per admin │  │ - 1 per shop  │  │ - Generated   │   │
│  │ - Unlimited   │  │ - Multi-use   │  │ - Single-use  │   │
│  │   use         │  │               │  │   or Multi    │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ DATABASE SCHEMA

### **New Table: `secret_keys`**

```sql
CREATE TABLE IF NOT EXISTS secret_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code TEXT UNIQUE NOT NULL,
    key_type TEXT NOT NULL CHECK (key_type IN ('admin', 'capster', 'customer')),
    barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_secret_keys_code ON secret_keys(key_code);
CREATE INDEX IF NOT EXISTS idx_secret_keys_type ON secret_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_secret_keys_barbershop ON secret_keys(barbershop_id);

-- Table to track key usage
CREATE TABLE IF NOT EXISTS secret_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_key_id UUID REFERENCES secret_keys(id) ON DELETE CASCADE,
    used_by_email TEXT NOT NULL,
    used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_key_usage_secret_key ON secret_key_usage_logs(secret_key_id);
CREATE INDEX IF NOT EXISTS idx_key_usage_user ON secret_key_usage_logs(used_by_user_id);
```

## 🔑 KEY TYPES & RULES

### **1. ADMIN KEY**
- **Purpose**: Register sebagai Admin
- **Format**: `ADMIN-[UUID]` contoh: `ADMIN-abc123def456`
- **Max Uses**: Unlimited
- **Expiry**: Never (kecuali di-disable manual)
- **Distribution**: Given by Platform Owner (You)
- **Example**: `ADMIN-7X9K2-MASTER-2024`

### **2. CAPSTER KEY**
- **Purpose**: Register sebagai Capster
- **Format**: `CAPSTER-[SHOP_ID]-[CODE]` contoh: `CAPSTER-shop1-xyz789`
- **Max Uses**: 10-50 (configurable per barbershop)
- **Expiry**: Optional (could be 30/60/90 days)
- **Distribution**: Given by Barbershop Owner/Admin
- **Example**: `CAPSTER-BARBER1-5M3TZ`

### **3. CUSTOMER KEY**
- **Purpose**: Register sebagai Customer
- **Format**: `CUSTOMER-[CODE]` contoh: `CUSTOMER-abc123`
- **Max Uses**: 1 (single-use) atau 100 (multi-use for marketing)
- **Expiry**: Optional
- **Distribution**: Given by Barbershop/Marketing campaign
- **Example**: `CUSTOMER-PROMO-DEC24`

## 🛠️ IMPLEMENTATION STEPS

### **Step 1: Create Database Tables & Functions**

```sql
-- Function to validate secret key
CREATE OR REPLACE FUNCTION validate_secret_key(
    p_key_code TEXT,
    p_key_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_key RECORD;
    v_result JSONB;
BEGIN
    -- Find the key
    SELECT * INTO v_key
    FROM secret_keys
    WHERE key_code = p_key_code
      AND key_type = p_key_type
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', FALSE,
            'reason', 'Invalid, inactive, expired, or max uses reached'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'valid', TRUE,
        'key_id', v_key.id,
        'barbershop_id', v_key.barbershop_id,
        'remaining_uses', CASE 
            WHEN v_key.max_uses IS NULL THEN NULL
            ELSE v_key.max_uses - v_key.current_uses
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use secret key (increment counter & log)
CREATE OR REPLACE FUNCTION use_secret_key(
    p_key_code TEXT,
    p_user_email TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_key_id UUID;
BEGIN
    -- Validate first
    IF NOT (validate_secret_key(p_key_code, split_part(p_key_code, '-', 1))::jsonb->>'valid')::boolean THEN
        RETURN FALSE;
    END IF;
    
    -- Get key_id
    SELECT id INTO v_key_id FROM secret_keys WHERE key_code = p_key_code;
    
    -- Increment usage
    UPDATE secret_keys
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_key_id;
    
    -- Log usage
    INSERT INTO secret_key_usage_logs (secret_key_id, used_by_email, used_by_user_id)
    VALUES (v_key_id, p_user_email, p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Step 2: Seed Initial Keys**

```sql
-- Admin Master Key (unlimited use, never expires)
INSERT INTO secret_keys (key_code, key_type, max_uses, is_active)
VALUES ('ADMIN-MASTER-2024', 'admin', NULL, TRUE)
ON CONFLICT (key_code) DO NOTHING;

-- Capster Keys (per barbershop, 50 uses each)
INSERT INTO secret_keys (key_code, key_type, barbershop_id, max_uses, is_active)
VALUES 
    ('CAPSTER-BARBER1-ABC123', 'capster', NULL, 50, TRUE),
    ('CAPSTER-BARBER2-XYZ789', 'capster', NULL, 50, TRUE)
ON CONFLICT (key_code) DO NOTHING;

-- Customer Promo Key (multi-use for marketing)
INSERT INTO secret_keys (key_code, key_type, max_uses, is_active, expires_at)
VALUES ('CUSTOMER-PROMO-DEC24', 'customer', 100, TRUE, NOW() + INTERVAL '30 days')
ON CONFLICT (key_code) DO NOTHING;

-- Customer Single-Use Keys (for individual invites)
INSERT INTO secret_keys (key_code, key_type, max_uses, is_active)
VALUES 
    ('CUSTOMER-SINGLE-001', 'customer', 1, TRUE),
    ('CUSTOMER-SINGLE-002', 'customer', 1, TRUE),
    ('CUSTOMER-SINGLE-003', 'customer', 1, TRUE)
ON CONFLICT (key_code) DO NOTHING;
```

### **Step 3: Update Registration Flow (Frontend)**

**Changes needed in:**
- `/app/login/customer/page.tsx`
- `/app/login/capster/page.tsx`
- `/app/login/admin/page.tsx`

Add secret key input field:

```typescript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Secret Key / Access Code
  </label>
  <input
    type="text"
    placeholder="Enter your secret key"
    value={secretKey}
    onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    required
  />
  <p className="text-xs text-gray-500 mt-1">
    Contact admin untuk mendapatkan secret key
  </p>
</div>
```

### **Step 4: Update Registration Handler (Backend)**

Modify AuthContext or API route to validate secret key before creating user:

```typescript
// Before creating auth.users:
const { valid, key_id, barbershop_id } = await validateSecretKey(secretKey, role);

if (!valid) {
  throw new Error('Invalid or expired secret key');
}

// After successful registration:
await useSecretKey(secretKey, email, user.id);
```

## 📊 ADMIN INTERFACE

### **Secret Key Management Dashboard**

Features needed:
1. **View All Keys**: List semua keys dengan status, usage, expires
2. **Create New Key**: Form untuk generate key baru
3. **Deactivate Key**: Disable key jika ada abuse
4. **Usage Analytics**: Lihat berapa kali key dipakai, siapa yang pakai

```typescript
// Components needed:
- SecretKeyList.tsx
- SecretKeyForm.tsx
- SecretKeyUsageChart.tsx
- SecretKeyCard.tsx
```

## 🔒 SECURITY CONSIDERATIONS

1. **Key Storage**: Keys disimpan di database, TIDAK di frontend env
2. **Validation**: Always validate server-side (Edge Function/RPC)
3. **Rate Limiting**: Prevent brute force key guessing
4. **Audit Log**: Track semua usage untuk monitoring
5. **Expiry**: Set expiry untuk promotional keys
6. **Revocation**: Admin bisa disable key kapan saja

## 📈 BENEFITS

### **For MVP Phase:**
✅ **Controlled Growth**: Admin kontrol siapa yang join
✅ **Data Quality**: No spam users
✅ **Exclusivity**: Premium feeling
✅ **Analytics**: Track conversion per key

### **For Production/SaaS:**
✅ **Marketing Tool**: Distribute keys via campaigns
✅ **Revenue Model**: Sell access keys
✅ **Partnership**: Share keys dengan barbershop partners
✅ **Viral Growth**: Referral keys with tracking

## 🚀 NEXT STEPS

1. **Create SQL Script**: Idempotent script untuk create tables & seed keys
2. **Update Frontend**: Add secret key input di registration
3. **Update Backend**: Validate key before user creation
4. **Build Admin UI**: Secret key management dashboard
5. **Test Flow**: Test registration dengan valid/invalid keys
6. **Document Keys**: Share keys dengan users (admin, capster, customer)

## 📝 EXAMPLE KEYS TO DISTRIBUTE

```
ADMIN KEYS (For You/Platform Owners):
- ADMIN-MASTER-2024
- ADMIN-OWNER-HYYDARR

CAPSTER KEYS (For Barbershop Staff):
- CAPSTER-BARBER1-ABC123
- CAPSTER-BARBER2-XYZ789

CUSTOMER KEYS (For End Users):
- CUSTOMER-PROMO-DEC24 (100 uses, expires 30 days)
- CUSTOMER-WELCOME-2024 (Unlimited, never expires)
- CUSTOMER-SINGLE-XXX (One-time use)
```

## 💡 ENHANCEMENTS (Future)

1. **QR Code**: Generate QR code untuk easy key distribution
2. **Email Integration**: Auto-send key via email after payment
3. **Tiered Keys**: Bronze/Silver/Gold keys dengan benefits berbeda
4. **Referral System**: User dapat key baru untuk refer friends
5. **Analytics Dashboard**: Advanced key performance metrics

---

**STATUS**: ✅ Concept Ready - Siap Implement!
