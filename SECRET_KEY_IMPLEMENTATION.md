# 🔐 SECRET ACCESS KEY SYSTEM - SAAS x BARBERSHOP

## 📋 Overview

Sistem **ACCESS KEY** untuk melindungi registrasi dari public signup. Setiap role memiliki access key unik yang harus dimasukkan saat registrasi untuk menjaga exclusivity.

## 🎯 Concept

**Tujuan:**
- ❌ **Mencegah public signup** yang tidak terauthorized
- ✅ **Kontrol siapa yang bisa register** untuk setiap role
- 🛡️ **Menjaga exclusivity platform** khusus untuk OASIS Barbershop
- 📊 **Tracking registrations** yang valid

**MVP Approach:**
- Simple & straightforward
- Easy to share & manage
- Tidak ribet untuk user experience
- Scalable untuk future development

---

## 🔑 Access Keys untuk Setiap Role

### 1. **CUSTOMER Access Key**
```
Access Key: CUSTOMER_OASIS_2025
Purpose: Customer registration
Usage: Untuk customer baru yang ingin register
```

**Cara Distribusi:**
- Diberikan saat customer datang ke barbershop pertama kali
- Di-print di kartu member
- Diberikan via WhatsApp setelah verifikasi
- Share via Instagram/sosmed official OASIS

---

### 2. **CAPSTER Access Key**
```
Access Key: CAPSTER_OASIS_PRO_2025
Purpose: Capster/Stylist registration
Usage: Untuk capster yang diundang oleh admin
```

**Cara Distribusi:**
- Admin memberikan key saat hiring capster baru
- Dikirim via email invitation
- Share di group WhatsApp internal team
- Included di employee handbook

---

### 3. **ADMIN Access Key**
```
Access Key: ADMIN_OASIS_MASTER_2025
Purpose: Admin registration (super restricted)
Usage: Hanya untuk owner & top management
```

**Cara Distribusi:**
- **HIGHLY RESTRICTED** - hanya owner yang tahu
- Share 1-on-1 dengan top management
- Tidak boleh di-share publik
- Changed regularly untuk security

---

## 💻 Implementation Details

### Database Schema

#### Table: `access_keys`
```sql
CREATE TABLE IF NOT EXISTS public.access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'capster', 'admin')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT NULL, -- NULL = unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_used_by UUID REFERENCES auth.users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_keys_code ON access_keys(key_code);
CREATE INDEX IF NOT EXISTS idx_access_keys_role ON access_keys(role);
CREATE INDEX IF NOT EXISTS idx_access_keys_active ON access_keys(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage keys
CREATE POLICY "Admins can view all keys" ON access_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert keys" ON access_keys
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update keys" ON access_keys
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

---

### Validation Function

```sql
-- Function to validate access key
CREATE OR REPLACE FUNCTION public.validate_access_key(
  p_key_code TEXT,
  p_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
BEGIN
  -- Find the key
  SELECT * INTO v_key_record
  FROM access_keys
  WHERE key_code = p_key_code
  AND role = p_role
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_usage IS NULL OR usage_count < max_usage);

  -- Key not found or invalid
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update usage stats
  UPDATE access_keys
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    last_used_by = auth.uid()
  WHERE id = v_key_record.id;

  RETURN TRUE;
END;
$$;
```

---

## 🎨 Frontend Implementation

### Registration Form Update

#### For Customer Registration (`/app/register/customer/page.tsx`)

```tsx
'use client';

import { useState } from 'react';

export default function CustomerRegister() {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate access key
    const { data: isValid } = await supabase.rpc('validate_access_key', {
      p_key_code: accessKey,
      p_role: 'customer'
    });

    if (!isValid) {
      setError('❌ Invalid or expired access key!');
      return;
    }

    // Proceed with registration...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other fields... */}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          🔑 Access Key *
        </label>
        <input
          type="text"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
          placeholder="Enter your access key (e.g., CUSTOMER_OASIS_2025)"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Don't have an access key? Visit OASIS Barbershop or contact admin.
        </p>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
```

---

### Capster Registration (`/app/register/capster/page.tsx`)

```tsx
// Similar implementation but with:
// - Different placeholder: "CAPSTER_OASIS_PRO_2025"
// - Different message: "Access key provided by admin"
// - validate_access_key with p_role: 'capster'
```

---

### Admin Registration (`/app/login/admin/page.tsx`)

```tsx
// Admin registration in login page
// - Ultra strict validation
// - Additional security checks
// - Email notification to owner when admin key used
```

---

## 📊 Admin Dashboard - Key Management

### New Page: `/app/dashboard/admin/access-keys/page.tsx`

Features:
- ✅ **View all access keys** dengan usage statistics
- ✅ **Create new keys** untuk role tertentu
- ✅ **Deactivate/Activate keys**
- ✅ **Set expiration dates**
- ✅ **Set usage limits** (max usage count)
- ✅ **View usage history** (who used when)
- ✅ **Generate random secure keys**

---

## 🔒 Security Best Practices

### 1. Key Rotation
```sql
-- Recommended: Change keys every 3-6 months
UPDATE access_keys
SET is_active = false
WHERE role = 'customer'
AND key_code = 'CUSTOMER_OASIS_2025';

-- Create new key
INSERT INTO access_keys (key_code, role, description)
VALUES ('CUSTOMER_OASIS_2025_V2', 'customer', 'Q1 2025 Customer Key');
```

### 2. Usage Monitoring
```sql
-- Query suspicious activity
SELECT 
  key_code,
  role,
  usage_count,
  last_used_at,
  last_used_by
FROM access_keys
WHERE usage_count > 50  -- Alert if used more than 50 times
AND created_at > NOW() - INTERVAL '30 days';
```

### 3. Rate Limiting
```sql
-- Add rate limiting for key validation attempts
CREATE TABLE IF NOT EXISTS key_validation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code TEXT NOT NULL,
  ip_address INET,
  success BOOLEAN,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Block IP if too many failed attempts (implement in API)
```

---

## 📈 Future Enhancements

### Phase 2 Features:
1. **QR Code Keys** - Generate QR codes untuk easy sharing
2. **One-Time Keys** - Keys that expire after single use
3. **Role-Based Limits** - Different limits per role
4. **Email Verification** - Send key via email after verification
5. **Referral System** - Customer dapat generate key untuk refer friends

### Phase 3 Features:
1. **API Integration** - Expose key validation via API
2. **Webhook Notifications** - Alert admin when key used
3. **Analytics Dashboard** - Track conversion rates
4. **A/B Testing** - Test different key formats
5. **Multi-Tenant Support** - Different keys for different locations

---

## 🚀 Quick Start Guide

### For Admin:

1. **Setup Initial Keys:**
```sql
-- Run this once in Supabase SQL Editor
INSERT INTO access_keys (key_code, role, description, max_usage) VALUES
  ('CUSTOMER_OASIS_2025', 'customer', 'General customer registration key', NULL),
  ('CAPSTER_OASIS_PRO_2025', 'capster', 'Capster invitation key', 10),
  ('ADMIN_OASIS_MASTER_2025', 'admin', 'Admin access - RESTRICTED', 3);
```

2. **Share Keys:**
   - Print customer key on business cards
   - Email capster key to new hires
   - Keep admin key private

3. **Monitor Usage:**
   - Check dashboard monthly
   - Rotate keys quarterly
   - Investigate suspicious usage

### For Users:

**Customer:**
1. Visit OASIS Barbershop
2. Ask for "Digital Member Key"
3. Receive: `CUSTOMER_OASIS_2025`
4. Use key when registering online

**Capster:**
1. Receive invitation email from admin
2. Email contains key: `CAPSTER_OASIS_PRO_2025`
3. Register using provided key
4. Access capster dashboard

**Admin:**
1. Contact owner for admin key
2. Receive: `ADMIN_OASIS_MASTER_2025`
3. Use key during registration
4. Manage platform

---

## ✅ Benefits

1. **🛡️ Security**
   - Prevents unauthorized signups
   - Protects user data
   - Controls platform access

2. **📊 Tracking**
   - Know who registered when
   - Track conversion rates
   - Analyze referral sources

3. **🎯 Exclusivity**
   - Platform feels premium
   - Members feel special
   - Builds brand loyalty

4. **💰 Business Value**
   - Reduces spam accounts
   - Increases data quality
   - Enables targeted marketing

---

## 📝 Implementation Checklist

- [ ] Create `access_keys` table in Supabase
- [ ] Create `validate_access_key()` function
- [ ] Update Customer registration form
- [ ] Update Capster registration form
- [ ] Update Admin registration/login
- [ ] Create Admin dashboard for key management
- [ ] Insert initial keys
- [ ] Test all registration flows
- [ ] Document keys in secure location
- [ ] Train admin on key management
- [ ] Setup monitoring alerts
- [ ] Plan key rotation schedule

---

**Status:** 📝 **CONCEPT READY** - Ready for implementation
**Priority:** 🔴 **HIGH** - Implement before public launch
**Estimated Time:** ⏱️ **4-6 hours** total implementation

---

**Created:** December 24, 2024
**Version:** 1.0
**Author:** AI Assistant
