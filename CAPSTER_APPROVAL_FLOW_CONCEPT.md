# 🔐 Capster Approval Flow: Konsep & Implementasi

## 🎯 **Problem Statement**

**Pertanyaan Anda**: *"Apakah capster perlu izin admin dulu untuk bisa login? Atau bisa langsung login setelah registrasi?"*

**Current State**: Auto-approve (capster langsung bisa login setelah registrasi)
**Issue**: Loading loop saat redirect ke dashboard setelah registrasi/login

---

## 💡 **DUA OPSI APPROVAL FLOW**

### **OPTION A: AUTO-APPROVE (Current - Recommended untuk MVP)**

#### **Flow Diagram**:
```
Capster Registrasi
    ↓
Buat account di auth.users ✅
    ↓
Buat record di user_profiles ✅
    ↓
Buat record di capsters ✅
    ↓
Login LANGSUNG ✅ (No admin approval needed)
    ↓
Redirect ke /dashboard/capster
    ↓
Can start using app immediately
```

#### **Pros** ✅:
- ✅ **Fast onboarding**: Capster langsung bisa login
- ✅ **Less friction**: Tidak perlu menunggu admin approval
- ✅ **Simpler implementation**: No pending state management
- ✅ **Better UX**: Instant gratification, reduce drop-off rate
- ✅ **Suitable untuk barbershop kecil**: Owner trust karyawan mereka

#### **Cons** ❌:
- ⚠️ **No verification**: Siapa saja bisa register sebagai capster
- ⚠️ **Security risk**: Fake/malicious capster registration
- ⚠️ **Data access**: Capster langsung bisa lihat customer data

#### **When to Use**:
- 🏪 **Barbershop kecil/menengah** (1-5 capster)
- 🤝 **Trusted environment**: Owner kenal semua capster
- 🚀 **MVP/Prototype phase**: Quick validation
- 📱 **Internal tool only**: Bukan public SaaS

#### **Security Measures** (untuk mitigasi cons):
```typescript
// 1. Email verification REQUIRED
options: {
  emailRedirectTo: `${window.location.origin}/auth/callback?role=capster`,
}

// 2. Admin can deactivate capster
UPDATE capsters SET is_available = false WHERE user_id = 'xxx';

// 3. Admin dashboard: Monitor all capster activities
SELECT * FROM capsters ORDER BY created_at DESC;

// 4. RLS Policy: Admin can delete capster
CREATE POLICY "admin_delete_capster" ON capsters
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND role = 'admin'
));
```

---

### **OPTION B: ADMIN APPROVAL REQUIRED (Recommended untuk Production)**

#### **Flow Diagram**:
```
Capster Registrasi
    ↓
Buat account di auth.users ✅
    ↓
Buat record di user_profiles (role='capster', status='pending_approval') ⏳
    ↓
Buat record di capsters (is_approved=false) ⏳
    ↓
Redirect ke /approval-pending page ⏳
    ↓
Email notification ke Admin 📧
    ↓
Admin review & approve di Admin Dashboard ✅
    ↓
UPDATE user_profiles SET status='active' ✅
    ↓
UPDATE capsters SET is_approved=true ✅
    ↓
Email notification ke Capster: "Account approved!" 📧
    ↓
Capster dapat Login ✅
    ↓
Redirect ke /dashboard/capster
```

#### **Pros** ✅:
- ✅ **Security**: Only authorized capster can access
- ✅ **Verification**: Admin validate capster identity
- ✅ **Control**: Owner has full control over who can access
- ✅ **Audit trail**: Track who approved which capster
- ✅ **Professional**: More suitable untuk public SaaS

#### **Cons** ❌:
- ⚠️ **Slower onboarding**: Capster harus menunggu approval
- ⚠️ **Admin overhead**: Admin perlu regularly check pending approvals
- ⚠️ **Complex implementation**: Need status management, notifications
- ⚠️ **Drop-off risk**: Capster might lose interest while waiting

#### **When to Use**:
- 🏢 **Barbershop besar/chain** (5+ locations, 10+ capster)
- 🌐 **Public SaaS**: Platform dijual ke multiple barbershop
- 🔒 **High security requirement**: Protect sensitive customer data
- 💼 **Professional/Enterprise**: Formal business processes

#### **Implementation Requirements**:

1. **Database Schema Changes**:
```sql
-- Add approval status to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN status TEXT DEFAULT 'active' 
CHECK (status IN ('pending_approval', 'active', 'suspended', 'deactivated'));

-- Add approval fields to capsters
ALTER TABLE capsters 
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN rejection_reason TEXT;

-- Add capster_invitations table (optional - for invitation-based registration)
CREATE TABLE capster_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES user_profiles(id),
  invitation_token UUID DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Approval Pending Page**:
```tsx
// app/(auth)/approval-pending/page.tsx
export default function ApprovalPending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Menunggu Persetujuan Admin
        </h1>
        <p className="text-gray-600 mb-6">
          Akun Anda sedang dalam proses review oleh admin. 
          Anda akan menerima email konfirmasi setelah akun disetujui.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 Biasanya proses approval memakan waktu 1-24 jam. 
            Silakan cek email Anda secara berkala.
          </p>
        </div>
        <Link href="/login/capster" className="text-green-600 hover:underline">
          ← Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
```

3. **Admin Dashboard - Approval Interface**:
```tsx
// app/dashboard/admin/capster-approvals/page.tsx
export default function CapsterApprovals() {
  const [pendingCapsters, setPendingCapsters] = useState([]);
  
  async function loadPendingCapsters() {
    const { data } = await supabase
      .from('capsters')
      .select(`
        *,
        user:user_profiles(email, customer_name, created_at)
      `)
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    setPendingCapsters(data || []);
  }
  
  async function approveCapster(capsterId: string, userId: string) {
    // 1. Update capsters table
    await supabase
      .from('capsters')
      .update({
        is_approved: true,
        approved_by: currentAdminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', capsterId);
    
    // 2. Update user_profiles status
    await supabase
      .from('user_profiles')
      .update({ status: 'active' })
      .eq('id', userId);
    
    // 3. Send approval email (via Edge Function or external service)
    await fetch('/api/send-approval-email', {
      method: 'POST',
      body: JSON.stringify({ userId, capsterId })
    });
    
    // 4. Reload list
    loadPendingCapsters();
    toast.success('Capster approved successfully!');
  }
  
  async function rejectCapster(capsterId: string, reason: string) {
    await supabase
      .from('capsters')
      .update({ 
        rejection_reason: reason 
      })
      .eq('id', capsterId);
    
    // Optionally: Delete account or suspend
    
    toast.success('Capster rejected');
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pending Capster Approvals</h2>
      
      {pendingCapsters.length === 0 ? (
        <p className="text-gray-500">No pending approvals</p>
      ) : (
        <div className="space-y-4">
          {pendingCapsters.map((capster) => (
            <div key={capster.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{capster.capster_name}</h3>
                  <p className="text-gray-600">{capster.user.email}</p>
                  <p className="text-sm text-gray-500">
                    Registered: {formatDate(capster.created_at)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Phone: {capster.phone || 'Not provided'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => approveCapster(capster.id, capster.user_id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) rejectCapster(capster.id, reason);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

4. **Modified AuthContext - Check Approval Status**:
```typescript
async function signIn(email: string, password: string, expectedRole?: UserRole) {
  // ... existing code ...
  
  // CRITICAL: Check approval status for capster
  if (userRole === 'capster') {
    const { data: capsterData } = await supabase
      .from('capsters')
      .select('is_approved')
      .eq('user_id', data.user.id)
      .single();
    
    if (capsterData && !capsterData.is_approved) {
      await supabase.auth.signOut();
      router.push('/approval-pending');
      return { error: new Error('Your account is pending admin approval') };
    }
  }
  
  // ... rest of code ...
}
```

5. **Email Notification Template** (via Edge Function):
```typescript
// supabase/functions/send-approval-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { userId, capsterId } = await req.json()
  
  // Get capster email
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email, customer_name')
    .eq('id', userId)
    .single()
  
  // Send email via SendGrid/Resend/etc
  await sendEmail({
    to: profile.email,
    subject: '✅ Your Capster Account has been Approved!',
    html: `
      <h2>Congratulations, ${profile.customer_name}!</h2>
      <p>Your capster account has been approved by the administrator.</p>
      <p>You can now login and access your dashboard:</p>
      <a href="https://your-app.com/login/capster">Login Now</a>
    `
  })
  
  return new Response('Email sent', { status: 200 })
})
```

---

## 🎯 **RECOMMENDATION FOR YOUR PROJECT**

### **For Current Stage (MVP/Development)**:
**USE OPTION A: AUTO-APPROVE** ✅

**Reasons**:
1. 🚀 **Faster development**: Focus on fixing bugs first
2. 🧪 **Testing phase**: Easy to test with multiple capster accounts
3. 🏪 **Internal tool**: Barbershop owner trusts karyawan
4. ✅ **Already implemented**: No major code changes needed

**Just fix the current bugs**:
- ✅ Fix loading loop issue
- ✅ Fix undefined role error
- ✅ Ensure capster record created properly
- ✅ Proper redirect after registration/login

### **For Future (Production/SaaS)**:
**UPGRADE TO OPTION B: ADMIN APPROVAL** 🔄

**When to upgrade**:
- 📈 When expanding to multiple barbershops
- 💼 When treating as serious SaaS business
- 🔒 When security becomes critical
- 💰 When have paying customers

**Migration path**:
```sql
-- Add new columns (backward compatible)
ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE capsters ADD COLUMN is_approved BOOLEAN DEFAULT TRUE; -- TRUE for existing capsters

-- New capsters will need approval, existing ones remain active
-- Then update signup logic to set is_approved=false for new registrations
```

---

## 📋 **DECISION MATRIX**

| Criteria | Auto-Approve | Admin Approval | Winner |
|----------|--------------|----------------|--------|
| **Development Speed** | ⚡ Fast | 🐌 Slow | ✅ Auto-Approve |
| **Security** | ⚠️ Medium | 🔒 High | ✅ Admin Approval |
| **User Experience** | 😊 Excellent | 😐 OK | ✅ Auto-Approve |
| **Scalability** | 🏪 Small scale | 🏢 Large scale | ✅ Admin Approval |
| **Maintenance** | ✅ Simple | ⚙️ Complex | ✅ Auto-Approve |
| **Trust Required** | 🤝 High | 🔍 Low | ✅ Admin Approval |

**For YOUR case (Barbershop tempat kerja)**:
- Current: **Auto-Approve** ✅ (Best for MVP & internal use)
- Future: **Admin Approval** (When scaling to multiple locations)

---

## ✅ **ACTION PLAN**

### **Phase 1: Fix Current Issues (This Week)** 🔧
1. ✅ Keep auto-approve flow (Option A)
2. ✅ Fix loading loop bug
3. ✅ Fix undefined role error
4. ✅ Ensure proper capster record creation
5. ✅ Add email verification
6. ✅ Add admin ability to deactivate capster

### **Phase 2: Add Security Layers (Next Sprint)** 🔒
1. ✅ Email verification REQUIRED
2. ✅ Admin monitoring dashboard
3. ✅ Capster activity logging
4. ✅ Ability for admin to suspend capster

### **Phase 3: Upgrade to Admin Approval (Future)** 🚀
1. ⏳ Add approval flow (when needed)
2. ⏳ Build approval interface for admin
3. ⏳ Email notification system
4. ⏳ Pending state management

---

**Last Updated**: 23 Desember 2025  
**Recommended Approach**: Start with **Option A (Auto-Approve)** for MVP, upgrade to **Option B (Admin Approval)** when scaling

---

**Next Steps**: Let's fix the bugs first, then decide if approval flow is needed! 🚀
