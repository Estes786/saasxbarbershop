# 🏢 MULTI-LOCATION SUPPORT IMPLEMENTATION PLAN
# BALIK.LAGI SYSTEM - CRITICAL FEATURE #5

**Date Created**: 01 Januari 2026  
**Priority**: 🔴 **CRITICAL** - Essential for scalability  
**Estimated Time**: 15-20 hours  
**Status**: 📋 **PLANNING**

---

## 📊 EXECUTIVE SUMMARY

### **Current State Analysis** ✅ **COMPLETE**

Berdasarkan analisis mendalam terhadap database Supabase:

**✅ Tables yang sudah ada:**
- `user_profiles` - User accounts (3 roles)
- `barbershop_profiles` - Barbershop info (SINGLE LOCATION)
- `barbershop_customers` - Customer data
- `capsters` - Barber profiles (punya field `barbershop_id` tapi NULL)
- `service_catalog` - Services (punya field `barbershop_id` tapi NULL)
- `bookings` - Customer bookings
- `barbershop_transactions` - Transaction history
- `access_keys` - Registration keys

**⚠️ Current Limitations:**
- ❌ System dirancang untuk SINGLE location only
- ❌ `barbershop_profiles` hanya 1 record per owner
- ❌ `capsters.barbershop_id` dan `service_catalog.barbershop_id` belum digunakan
- ❌ Customer tidak bisa pilih branch saat booking
- ❌ Admin tidak bisa compare performance antar branch

**✅ Good News:**
- Field `barbershop_id` sudah ada di `capsters` dan `service_catalog` (siap digunakan!)
- Architecture sudah support multi-location (tinggal activate)

---

## 🎯 WHAT WE'RE BUILDING

### **Feature Goals**

**1. Branch Management (Admin)** 🏪
```
✅ Create multiple branches/locations
✅ Each branch has:
   - Name (e.g., "BALIK.LAGI Purwokerto", "BALIK.LAGI Jakarta")
   - Full address
   - Phone number
   - Operating hours
   - Manager/PIC
   - Active/inactive status
   
✅ Edit branch details
✅ Activate/deactivate branches
✅ Delete branches (with safety checks)
```

**2. Customer Experience** 👤
```
✅ View all active branches
✅ Select branch when creating booking
✅ See branch details (address, phone, hours)
✅ View booking history across all branches
✅ Unified loyalty points across branches (4 visits = 1 free)
✅ Filter bookings by branch
```

**3. Capster Assignment** 👨‍💼
```
✅ Admin assigns capsters to specific branches
✅ Capster can work at ONE branch at a time
✅ Capster sees queue only for their branch
✅ Transfer capster between branches (admin only)
```

**4. Service Catalog per Branch** ✂️
```
✅ Each branch can have different services
✅ Each branch can have different pricing (optional)
✅ Admin manages service availability per branch
✅ Customers see only services available at selected branch
```

**5. Admin Analytics** 📊
```
✅ Compare performance across branches:
   - Total bookings per branch
   - Revenue per branch
   - Active customers per branch
   - Top performing capsters per branch
   
✅ Filter analytics by branch
✅ See all-branches overview
```

---

## 🗄️ DATABASE SCHEMA DESIGN

### **New Table: `branches`**

```sql
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershop_profiles(id) ON DELETE CASCADE,
  
  -- Branch Details
  branch_name VARCHAR(100) NOT NULL,
  branch_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "PWK01", "JKT01"
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(100),
  
  -- Operating Hours
  open_time TIME DEFAULT '09:00:00',
  close_time TIME DEFAULT '21:00:00',
  days_open TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  
  -- Management
  manager_name VARCHAR(100),
  manager_phone VARCHAR(20),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_flagship BOOLEAN DEFAULT false, -- Main/flagship store
  max_capacity_per_day INTEGER DEFAULT 50,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT branch_name_not_empty CHECK (LENGTH(TRIM(branch_name)) > 0),
  CONSTRAINT valid_hours CHECK (open_time < close_time)
);

-- Indexes for performance
CREATE INDEX idx_branches_barbershop_id ON branches(barbershop_id);
CREATE INDEX idx_branches_active ON branches(is_active) WHERE is_active = true;
CREATE INDEX idx_branches_branch_code ON branches(branch_code);
```

### **Update Existing Tables**

#### **1. Update `capsters` table**
```sql
-- Make barbershop_id NOT NULL (after data migration)
-- Add branch_id
ALTER TABLE capsters 
  ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Capster must belong to a branch
CREATE INDEX idx_capsters_branch_id ON capsters(branch_id);

-- Updated constraint: capster must have barbershop_id
ALTER TABLE capsters 
  ADD CONSTRAINT capsters_must_have_barbershop 
  CHECK (barbershop_id IS NOT NULL);
```

#### **2. Update `service_catalog` table**
```sql
-- Make barbershop_id NOT NULL (after data migration)
ALTER TABLE service_catalog 
  ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- If branch_id is NULL, service is available at ALL branches
-- If branch_id is set, service is available only at that branch

CREATE INDEX idx_service_catalog_branch_id ON service_catalog(branch_id);
```

#### **3. Update `bookings` table**
```sql
-- Add branch_id to track which branch the booking is for
ALTER TABLE bookings 
  ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT;

-- Booking must have a branch
ALTER TABLE bookings 
  ADD CONSTRAINT bookings_must_have_branch 
  CHECK (branch_id IS NOT NULL);

CREATE INDEX idx_bookings_branch_id ON bookings(branch_id);
CREATE INDEX idx_bookings_branch_date ON bookings(branch_id, booking_date);
```

#### **4. Update `barbershop_transactions` table**
```sql
-- Add branch_id for transaction tracking
ALTER TABLE barbershop_transactions 
  ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_branch_id ON barbershop_transactions(branch_id);
```

### **Migration Strategy** 🔄

**Phase 1: Create default branch for existing data**
```sql
-- For each existing barbershop_profiles, create a "Main Branch"
INSERT INTO branches (
  barbershop_id, 
  branch_name, 
  branch_code,
  address,
  phone,
  open_time,
  close_time,
  days_open,
  is_flagship
)
SELECT 
  id,
  name || ' - Main Branch' as branch_name,
  'MAIN01' as branch_code,
  address,
  phone,
  open_time,
  close_time,
  days_open,
  true
FROM barbershop_profiles;
```

**Phase 2: Update existing data with branch references**
```sql
-- Update capsters with default branch
UPDATE capsters c
SET branch_id = b.id
FROM branches b
WHERE c.barbershop_id = b.barbershop_id 
  AND b.is_flagship = true;

-- Update bookings with branch from capster
UPDATE bookings bk
SET branch_id = c.branch_id
FROM capsters c
WHERE bk.capster_id = c.id;
```

---

## 🔒 ROW LEVEL SECURITY (RLS) POLICIES

### **Branches Table**

```sql
-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Admin: Full access to their barbershop's branches
CREATE POLICY "Admin full access to branches"
ON branches FOR ALL
TO authenticated
USING (
  barbershop_id IN (
    SELECT id FROM barbershop_profiles 
    WHERE owner_id = auth.uid()
  )
);

-- Capsters: Can view their assigned branch
CREATE POLICY "Capsters can view their branch"
ON branches FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT branch_id FROM capsters 
    WHERE user_id = auth.uid()
  )
);

-- Customers: Can view all active branches
CREATE POLICY "Customers can view active branches"
ON branches FOR SELECT
TO authenticated
USING (is_active = true);

-- Public: Can view active branches (for booking without login)
CREATE POLICY "Public can view active branches"
ON branches FOR SELECT
TO anon
USING (is_active = true);
```

---

## 🎨 FRONTEND COMPONENTS

### **1. Branch Management Dashboard (Admin)**

**Location**: `/app/admin/branches/page.tsx`

**Features**:
- List all branches with status badges
- Add new branch button
- Edit branch details
- Toggle active/inactive status
- View branch statistics (capsters, bookings, revenue)

**UI Design**:
```tsx
<BranchList>
  <BranchCard>
    <BranchHeader>
      <BranchName>BALIK.LAGI Purwokerto</BranchName>
      <StatusBadge active={true} />
    </BranchHeader>
    
    <BranchStats>
      <Stat label="Capsters" value={5} />
      <Stat label="Bookings Today" value={12} />
      <Stat label="Revenue This Month" value="Rp 5.4jt" />
    </BranchStats>
    
    <BranchActions>
      <Button>Edit</Button>
      <Button>Manage Capsters</Button>
      <Button>View Analytics</Button>
    </BranchActions>
  </BranchCard>
</BranchList>
```

### **2. Branch Selector (Customer Booking)**

**Location**: `/app/customer/booking/page.tsx`

**Features**:
- Dropdown or card-based branch selector
- Show branch details on hover
- Filter by city/area
- Show distance (if location permission granted)

**UI Design**:
```tsx
<BranchSelector>
  <Label>Pilih Lokasi Barbershop</Label>
  
  <BranchOptions>
    {branches.map(branch => (
      <BranchOption 
        key={branch.id}
        selected={selectedBranch?.id === branch.id}
        onClick={() => setSelectedBranch(branch)}
      >
        <BranchInfo>
          <BranchName>{branch.branch_name}</BranchName>
          <BranchAddress>{branch.address}</BranchAddress>
          <BranchPhone>{branch.phone}</BranchPhone>
        </BranchInfo>
        
        {branch.distance && (
          <Distance>{branch.distance} km</Distance>
        )}
      </BranchOption>
    ))}
  </BranchOptions>
</BranchSelector>
```

### **3. Branch Analytics (Admin)**

**Location**: `/app/admin/analytics/branches/page.tsx`

**Features**:
- Branch comparison table
- Branch filter dropdown
- Performance charts per branch
- Export branch reports

**Metrics**:
- Total bookings
- Total revenue
- Active capsters
- Customer satisfaction
- Average waiting time

---

## 🔌 API ROUTES

### **Branch Management APIs**

#### **GET /api/admin/branches**
```typescript
// Get all branches for current barbershop
export async function GET(request: Request) {
  const { data: branches } = await supabase
    .from('branches')
    .select(`
      *,
      _count_capsters:capsters(count),
      _count_bookings_today:bookings!inner(count)
    `)
    .eq('barbershop_id', barbershopId)
    .order('created_at', { ascending: false });
  
  return Response.json({ branches });
}
```

#### **POST /api/admin/branches**
```typescript
// Create new branch
export async function POST(request: Request) {
  const body = await request.json();
  
  const { data: branch } = await supabase
    .from('branches')
    .insert({
      barbershop_id: barbershopId,
      branch_name: body.branch_name,
      branch_code: body.branch_code,
      address: body.address,
      // ... other fields
    })
    .select()
    .single();
  
  return Response.json({ branch });
}
```

#### **PATCH /api/admin/branches/[id]**
```typescript
// Update branch
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  const { data: branch } = await supabase
    .from('branches')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();
  
  return Response.json({ branch });
}
```

#### **DELETE /api/admin/branches/[id]**
```typescript
// Delete branch (with safety checks)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check if branch has active capsters
  const { count: capstersCount } = await supabase
    .from('capsters')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', params.id);
  
  if (capstersCount > 0) {
    return Response.json({ 
      error: 'Cannot delete branch with active capsters' 
    }, { status: 400 });
  }
  
  await supabase
    .from('branches')
    .delete()
    .eq('id', params.id);
  
  return Response.json({ success: true });
}
```

### **Customer APIs**

#### **GET /api/branches/public**
```typescript
// Get all active branches for customer booking
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  
  let query = supabase
    .from('branches')
    .select(`
      *,
      barbershop_profiles!inner(*)
    `)
    .eq('is_active', true);
  
  if (city) {
    query = query.eq('city', city);
  }
  
  const { data: branches } = await query;
  
  return Response.json({ branches });
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Phase 1: Database Schema** (2-3 hours)

- [ ] Create `branches` table dengan complete schema
- [ ] Add `branch_id` to `capsters`, `service_catalog`, `bookings`, `barbershop_transactions`
- [ ] Create indexes untuk performance
- [ ] Setup RLS policies untuk `branches` table
- [ ] Create migration script untuk existing data
- [ ] Test migration on development database

### **Phase 2: Backend APIs** (3-4 hours)

- [ ] Create `/api/admin/branches` - GET all branches
- [ ] Create `/api/admin/branches` - POST create branch
- [ ] Create `/api/admin/branches/[id]` - PATCH update branch
- [ ] Create `/api/admin/branches/[id]` - DELETE branch
- [ ] Create `/api/branches/public` - GET active branches for customers
- [ ] Create `/api/admin/capsters/[id]/assign-branch` - Assign capster to branch
- [ ] Add branch validation in booking API

### **Phase 3: Admin Frontend** (4-5 hours)

- [ ] Create `/app/admin/branches/page.tsx` - Branch list page
- [ ] Create `/app/admin/branches/new/page.tsx` - Add new branch form
- [ ] Create `/app/admin/branches/[id]/edit/page.tsx` - Edit branch form
- [ ] Create branch card component
- [ ] Create branch form component
- [ ] Add branch selector to capster management
- [ ] Update admin analytics with branch filter

### **Phase 4: Customer Frontend** (3-4 hours)

- [ ] Add branch selector to booking flow
- [ ] Show branch details in booking confirmation
- [ ] Add branch info to booking history
- [ ] Filter services by selected branch
- [ ] Update loyalty tracker (unified across branches)

### **Phase 5: Testing** (2-3 hours)

- [ ] Test branch CRUD operations
- [ ] Test capster assignment to branches
- [ ] Test booking flow with branch selection
- [ ] Test analytics filtering by branch
- [ ] Test RLS policies
- [ ] Test migration script dengan data asli
- [ ] Load testing untuk multiple branches

---

## 🚀 ROLLOUT STRATEGY

### **Week 1: Development**
- Day 1-2: Database schema + migration
- Day 3-4: Backend APIs
- Day 5: Admin frontend (branch management)

### **Week 2: Customer Experience + Testing**
- Day 1-2: Customer booking dengan branch selection
- Day 3: Analytics update
- Day 4-5: Comprehensive testing + bug fixes

### **Week 3: Deployment**
- Apply migration to production database
- Deploy new features
- Monitor for issues
- Collect feedback from pilot users

---

## 📊 SUCCESS METRICS

**Technical**:
- ✅ All branches can be managed independently
- ✅ No booking conflicts across branches
- ✅ RLS policies enforced correctly
- ✅ Query performance < 500ms for branch operations

**Business**:
- ✅ Owner can open 2nd location smoothly
- ✅ Customers can easily find & book at nearest branch
- ✅ Capsters see only their branch's queue
- ✅ Analytics clearly show per-branch performance

---

## 🎯 NEXT STEPS AFTER COMPLETION

1. **Mobile App**: Branch selector di mobile app
2. **WhatsApp Integration**: Branch-specific WhatsApp numbers
3. **Inter-branch Transfer**: Transfer customer booking antar branch
4. **Branch-specific Promotions**: Different promo per branch
5. **Franchise Mode**: Support untuk franchise model

---

**Last Updated**: 01 Januari 2026  
**Status**: 📋 **READY FOR IMPLEMENTATION**  
**Estimated Completion**: 15-20 hours (2-3 weeks part-time)

---

**🌟 Bismillah. Mari kita bangun Multi-Location Support yang solid!**
