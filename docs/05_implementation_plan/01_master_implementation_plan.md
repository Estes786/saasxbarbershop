# 🎯 MASTER IMPLEMENTATION PLAN: BALIK.LAGI SYSTEM

**Project**: Balik.Lagi (Re-branding dari BALIK.LAGI)  
**Timeline**: 4 Minggu (28 Desember 2025 - 25 Januari 2026)  
**Goal**: Complete re-branding + critical features + ready for first 5 paying customers

---

## 📊 OVERVIEW

### **Strategic Objectives**
1. **Re-brand** dari BALIK.LAGI ke BALIK.LAGI (brand identity + technical implementation)
2. **Fix Critical Gaps** (double-booking prevention, real-time features)
3. **Complete Booking System** (full customer-to-capster workflow)
4. **Launch MVP** (ready untuk pilot customers)
5. **Prepare for Scale** (documentation, testing, monitoring)

### **Success Metrics**
```
Week 1: ✅ All references updated to BALIK.LAGI
Week 2: ✅ Booking system 100% functional (no double-booking)
Week 3: ✅ 3-5 pilot customers onboarded & using platform
Week 4: ✅ First paying customer (Rp 500K/month subscription)
```

---

## 🗓️ WEEK-BY-WEEK BREAKDOWN

---

## 📅 WEEK 1: RE-BRANDING EXECUTION (28 Des - 3 Jan 2026)

**Theme**: "From BALIK.LAGI to BALIK.LAGI - Complete Brand Transformation"

### **DAY 1-2: Brand Identity & Documentation** (Sabtu-Minggu)

#### **Visual Identity Creation**
- [ ] **Logo Design** (Canva atau Figma)
  - Simple icon: Scissors + Return Arrow
  - Wordmark: "BALIK.LAGI" dengan dot/period
  - Monogram: "B.L" untuk app icon
  - Export formats: SVG, PNG (multiple sizes)
  
- [ ] **Color Palette Finalization**
  ```css
  --primary-brown: #8B4513;
  --secondary-beige: #F5E6D3;
  --accent-red: #8B0000;
  --text-dark: #2C1810;
  --text-light: #F5F5F5;
  ```

- [ ] **Typography Setup**
  - Heading: Playfair Display (or similar serif)
  - Body: Inter / Open Sans
  - Update `globals.css` dengan custom fonts

#### **Documentation Completion**
- [x] ✅ Personal Journey documentation
- [x] ✅ Re-branding plan documentation
- [x] ✅ Current state analysis documentation
- [ ] **Spiritual Reflection** documentation
- [ ] **Business Concept** documentation (detail monetization)
- [ ] **Secret Keys** documentation (credentials management)

**Deliverables**: Logo files, brand guidelines, complete documentation

---

### **DAY 3-4: Technical Re-branding (Core Files)** (Senin-Selasa)

#### **A. Repository & Package Updates**
```bash
# 1. Update package.json
{
  "name": "balik-lagi-system",
  "version": "2.0.0",
  "description": "SaaS Platform untuk Barbershop Management - Bikin Pelanggan Balik Lagi"
}

# 2. Update README.md
- Ganti semua "BALIK.LAGI" → "BALIK.LAGI"
- Update tagline, description, features
- Update screenshots (jika ada)

# 3. Git commit & push
git add .
git commit -m "Re-branding: BALIK.LAGI → BALIK.LAGI (Phase 1)"
git push origin main
```

#### **B. Environment Variables (optional rename)**
```bash
# .env.example updates (opsional, bisa tetap OASIS internal)
# Frontend variables tetap NEXT_PUBLIC_SUPABASE_*
# No breaking changes untuk database/API
```

#### **C. Metadata & SEO Updates**
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'BALIK.LAGI - Sistem Barbershop Management',
  description: 'Platform SaaS untuk membuat pelanggan barbershop Anda balik lagi. Booking online, loyalty tracking, dan business intelligence.',
  keywords: ['barbershop', 'booking system', 'loyalty program', 'saas', 'indonesia'],
  openGraph: {
    title: 'BALIK.LAGI - Sekali Cocok, Pengen Balik Lagi',
    description: 'Ekosistem barber & sistem yang bikin pelanggan pengen balik lagi',
    images: ['/og-image.png'] // Need to create
  }
}
```

**Deliverables**: Updated package.json, README, metadata, git history

---

### **DAY 5-6: UI/UX Re-branding** (Rabu-Kamis)

#### **A. Landing Page Redesign** (`app/page.tsx`)

**Current**: BALIK.LAGI branding, technical focus  
**Target**: BALIK.LAGI branding, emotional storytelling

```typescript
// Key sections to update:
1. Hero Section
   - New headline: "BALIK.LAGI - Sekali Cocok, Pengen Balik Lagi"
   - Subheadline: "Ekosistem Barber & Sistem yang Bikin Pelanggan Pengen Balik Lagi"
   - CTA: "Mulai Gratis" (bukan "Get Started")

2. Value Proposition
   - Feature 1: "Booking Online yang Mudah"
   - Feature 2: "Pelanggan Balik Lagi Otomatis"
   - Feature 3: "Loyalty Program Terintegrasi"

3. Social Proof
   - Testimonial dari BOZQ Barber (pilot customer)
   - "Digunakan oleh barbershop terbaik di Indonesia"

4. Pricing Section (optional untuk MVP)
   - Freemium: Rp 0/bulan (50 bookings)
   - Pro: Rp 500K/bulan (unlimited)
   - Enterprise: Custom pricing
```

#### **B. Dashboard Headers Update**

```typescript
// components/shared/DashboardHeader.tsx (create if not exists)
// Update all dashboard headers dengan:
- Logo baru (top-left)
- "BALIK.LAGI SYSTEM" branding
- Tagline: "Bikin Pelanggan Balik Lagi"

// Files to update:
- app/dashboard/customer/page.tsx
- app/dashboard/capster/page.tsx
- app/dashboard/admin/page.tsx
- app/dashboard/barbershop/page.tsx
```

#### **C. Navigation & Buttons**

```typescript
// Update all CTAs & navigation labels:
"Sign Up" → "Daftar Sekarang"
"Log In" → "Masuk"
"Dashboard" → "Dashboard Saya"
"Book Now" → "Booking Sekarang"
"View History" → "Riwayat Booking"
```

**Deliverables**: Redesigned landing page, updated dashboards, new branding everywhere

---

### **DAY 7: Testing & Launch** (Jumat)

#### **Re-branding Verification Checklist**
- [ ] All pages display "BALIK.LAGI" (not "BALIK.LAGI")
- [ ] New logo visible on all pages
- [ ] Tagline consistent everywhere
- [ ] Meta tags updated (check source code)
- [ ] Favicon changed (browser tab icon)
- [ ] Email templates updated (if any)
- [ ] Error pages updated
- [ ] 404 page branded

#### **User Acceptance Testing**
- [ ] Test all login flows (customer, capster, admin)
- [ ] Test all dashboards render correctly
- [ ] Test booking flow (create, view, cancel)
- [ ] Test mobile responsiveness
- [ ] Check cross-browser compatibility (Chrome, Safari, Firefox)

#### **Deployment**
```bash
# Build & Deploy
npm run build
# Vercel auto-deploys on push to main

# Verify production
curl https://saasxbarbershop.vercel.app
# Should show BALIK.LAGI branding
```

**Deliverables**: Re-branded production site, verification report

---

## 📅 WEEK 2: CRITICAL FEATURES (4-10 Jan 2026)

**Theme**: "Zero Double-Bookings & Real-time Experience"

### **DAY 8-9: Booking Slots System** (Sabtu-Minggu)

#### **A. Database Schema**
```sql
-- Create booking_slots table
CREATE TABLE booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capster_id UUID REFERENCES capsters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time, capster_id)
);

-- Indexes for performance
CREATE INDEX idx_booking_slots_date ON booking_slots(date);
CREATE INDEX idx_booking_slots_capster_id ON booking_slots(capster_id);
CREATE INDEX idx_booking_slots_status ON booking_slots(status);

-- RLS Policies
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read available slots
CREATE POLICY "public_read_available_slots" ON booking_slots
  FOR SELECT USING (status = 'available');

-- Policy: Capster & Admin can manage their slots
CREATE POLICY "capster_manage_own_slots" ON booking_slots
  FOR ALL USING (
    capster_id IN (
      SELECT id FROM capsters WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'barbershop')
    )
  );
```

#### **B. Slot Generation Logic**
```typescript
// lib/booking/generateSlots.ts
export async function generateSlotsForCapster(
  capsterId: string,
  date: Date,
  workingHours: { start: string; end: string },
  slotDuration: number = 30 // minutes
) {
  const slots = [];
  const startTime = parseTime(workingHours.start); // e.g., "09:00"
  const endTime = parseTime(workingHours.end);     // e.g., "17:00"
  
  let currentTime = startTime;
  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    slots.push({
      date,
      start_time: formatTime(currentTime),
      end_time: formatTime(slotEnd),
      capster_id: capsterId,
      status: 'available'
    });
    currentTime = slotEnd;
  }
  
  // Bulk insert to Supabase
  const { error } = await supabase
    .from('booking_slots')
    .insert(slots);
  
  if (error) throw error;
  return slots.length;
}
```

#### **C. Auto-generate Slots (Daily Cron)**
```typescript
// app/api/cron/generate-slots/route.ts
// Called by Vercel Cron (or manual trigger)
export async function GET(request: Request) {
  // Generate slots for next 7 days
  const capsters = await getActiveCapsters();
  const startDate = new Date();
  const endDate = addDays(startDate, 7);
  
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    for (const capster of capsters) {
      await generateSlotsForCapster(
        capster.id,
        date,
        capster.working_hours
      );
    }
  }
  
  return Response.json({ success: true, message: '7 days slots generated' });
}
```

**Deliverables**: Booking slots table, generation logic, cron job

---

### **DAY 10-11: Double-Booking Prevention** (Senin-Selasa)

#### **A. Availability Checker API**
```typescript
// app/api/bookings/check-availability/route.ts
export async function POST(request: Request) {
  const { date, time, capster_id, service_duration } = await request.json();
  
  // 1. Get all slots within the service duration
  const requiredSlots = calculateRequiredSlots(time, service_duration);
  
  // 2. Check if all slots are available
  const { data: slots } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('date', date)
    .eq('capster_id', capster_id)
    .in('start_time', requiredSlots)
    .eq('status', 'available');
  
  // 3. Return availability
  const isAvailable = slots.length === requiredSlots.length;
  
  return Response.json({
    available: isAvailable,
    available_slots: slots,
    reason: !isAvailable ? 'Some slots already booked' : null
  });
}
```

#### **B. Atomic Booking Creation**
```typescript
// app/api/bookings/create/route.ts
export async function POST(request: Request) {
  const { customer_id, capster_id, date, time, service_id } = await request.json();
  
  // Transaction: Book slots + Create booking (atomic)
  const { data, error } = await supabase.rpc('create_booking_atomic', {
    p_customer_id: customer_id,
    p_capster_id: capster_id,
    p_date: date,
    p_time: time,
    p_service_id: service_id
  });
  
  if (error) {
    return Response.json({ error: 'Booking failed' }, { status: 409 });
  }
  
  // Send confirmation (email/WhatsApp)
  await sendBookingConfirmation(data.booking_id);
  
  return Response.json({ booking: data }, { status: 201 });
}
```

#### **C. Database Function (Atomic Transaction)**
```sql
-- PostgreSQL Function for atomic booking
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_customer_id UUID,
  p_capster_id UUID,
  p_date DATE,
  p_time TIME,
  p_service_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_booking_id UUID;
  v_service_duration INT;
  v_required_slots TIME[];
BEGIN
  -- 1. Get service duration
  SELECT duration_minutes INTO v_service_duration
  FROM service_catalog WHERE id = p_service_id;
  
  -- 2. Calculate required slots
  v_required_slots := calculate_time_slots(p_time, v_service_duration);
  
  -- 3. Lock and check availability (FOR UPDATE)
  PERFORM * FROM booking_slots
  WHERE date = p_date
    AND capster_id = p_capster_id
    AND start_time = ANY(v_required_slots)
    AND status = 'available'
  FOR UPDATE;
  
  -- 4. If not enough slots, abort
  IF (SELECT COUNT(*) FROM booking_slots
      WHERE date = p_date AND capster_id = p_capster_id
        AND start_time = ANY(v_required_slots) AND status = 'available'
     ) < array_length(v_required_slots, 1)
  THEN
    RAISE EXCEPTION 'Slots not available';
  END IF;
  
  -- 5. Create booking
  INSERT INTO bookings (customer_id, capster_id, booking_date, booking_time, service_id, status)
  VALUES (p_customer_id, p_capster_id, p_date, p_time, p_service_id, 'pending')
  RETURNING id INTO v_booking_id;
  
  -- 6. Mark slots as booked
  UPDATE booking_slots
  SET status = 'booked', booking_id = v_booking_id, updated_at = NOW()
  WHERE date = p_date
    AND capster_id = p_capster_id
    AND start_time = ANY(v_required_slots);
  
  -- 7. Return booking ID
  RETURN jsonb_build_object('booking_id', v_booking_id);
END;
$$ LANGUAGE plpgsql;
```

**Deliverables**: Availability API, atomic booking function, zero double-booking guarantee

---

### **DAY 12-13: Real-time Features** (Rabu-Kamis)

#### **A. Supabase Realtime Subscriptions**
```typescript
// lib/hooks/useRealtimeBookings.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeBookings(capsterId?: string) {
  const [bookings, setBookings] = useState([]);
  const supabase = createClient();
  
  useEffect(() => {
    // Initial fetch
    fetchBookings();
    
    // Subscribe to changes
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: capsterId ? `capster_id=eq.${capsterId}` : undefined
        },
        (payload) => {
          console.log('Booking update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [capsterId]);
  
  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setBookings(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setBookings(prev =>
        prev.map(b => b.id === payload.new.id ? payload.new : b)
      );
    } else if (payload.eventType === 'DELETE') {
      setBookings(prev => prev.filter(b => b.id !== payload.old.id));
    }
  };
  
  return { bookings, refresh: fetchBookings };
}
```

#### **B. Update Components to Use Realtime**
```typescript
// components/capster/QueueDisplay.tsx
import { useRealtimeBookings } from '@/lib/hooks/useRealtimeBookings';

export function QueueDisplay({ capsterId }: Props) {
  const { bookings } = useRealtimeBookings(capsterId);
  
  // Filter today's bookings
  const todayBookings = bookings.filter(b =>
    isToday(new Date(b.booking_date))
  ).sort((a, b) => compareAsc(a.booking_time, b.booking_time));
  
  return (
    <div>
      {todayBookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
```

**Deliverables**: Real-time hooks, live queue updates, instant status changes

---

### **DAY 14: Testing & Bug Fixes** (Jumat)

#### **Test Scenarios**
1. **Double-Booking Prevention**
   - [ ] Test: 2 customers book same capster, same time → 1 succeeds, 1 fails
   - [ ] Test: Booking spans multiple slots (60min service) → all slots locked
   - [ ] Test: Concurrent booking requests → handled atomically

2. **Real-time Updates**
   - [ ] Test: Capster dashboard shows new booking instantly (no refresh)
   - [ ] Test: Status change reflects immediately across all dashboards
   - [ ] Test: Cancellation frees up slots instantly

3. **Edge Cases**
   - [ ] Test: Booking at exact closing time
   - [ ] Test: Booking with capster on leave/unavailable
   - [ ] Test: Network interruption during booking

**Deliverables**: Test report, bug fixes, production-ready booking system

---

## 📅 WEEK 3: PILOT ONBOARDING (11-17 Jan 2026)

**Theme**: "Get First Customers Using the Platform"

### **DAY 15-16: Pilot Customer Setup** (Sabtu-Minggu)

#### **A. BOZQ Barber Onboarding**
```
1. Create Admin Account for BOZQ Owner
   - Email: [owner email]
   - Role: admin
   - Access key: ADMIN_BOZQ_ACCESS_1

2. Create Capster Accounts (for all barbers at BOZQ)
   - Import existing capsters list
   - Auto-approve via access key
   - Setup working hours & specializations

3. Migrate Existing Customer Data (if any)
   - Export from previous system (if exists)
   - Import to barbershop_customers table
   - Link to user_profiles (optional)

4. Training Session (1-2 hours)
   - How to use admin dashboard
   - How to manage bookings
   - How to read analytics
   - How to handle customer queries
```

#### **B. Documentation for End Users**
```markdown
# BALIK.LAGI User Guide

## Untuk Customer:
1. Cara daftar akun
2. Cara booking layanan
3. Cara lihat riwayat booking
4. Cara cancel/reschedule
5. Cara redeem loyalty points

## Untuk Capster:
1. Cara login & lihat jadwal hari ini
2. Cara update status booking
3. Cara lihat customer predictions
4. Cara tracking earnings

## Untuk Admin/Owner:
1. Cara monitor semua booking
2. Cara baca KHL analytics
3. Cara export reports
4. Cara manage access keys
```

**Deliverables**: BOZQ fully onboarded, user guides created

---

### **DAY 17-19: Feedback Collection & Iteration** (Senin-Rabu)

#### **User Feedback Loop**
```
Day 17 (Monday):
- Morning: Check BOZQ usage (how many bookings created?)
- Afternoon: Call/WhatsApp check-in dengan owner
- Evening: Collect pain points & feature requests

Day 18 (Tuesday):
- Prioritize fixes based on feedback
- Fix critical bugs (if any)
- Improve UX based on confusion points
- Deploy hotfixes

Day 19 (Wednesday):
- Re-test with BOZQ team
- Verify all feedback addressed
- Document lessons learned
- Prepare for next pilot customer
```

#### **Metrics to Track**
```
Week 3 Success Metrics:
- [ ] 10+ bookings created via platform
- [ ] 0 double-bookings occurred
- [ ] <5% booking cancellation rate
- [ ] >80% user satisfaction (quick survey)
- [ ] <30 seconds average booking time
```

**Deliverables**: Feedback report, bug fixes, improved UX

---

### **DAY 20-21: Scaling to 2nd & 3rd Pilot** (Kamis-Jumat)

#### **Outreach to 2 More Barbershops**
```
Target Profile:
- Small-medium barbershop (1-3 locations)
- 2-5 capsters
- Active customer base (50+ regulars)
- Tech-savvy owner (or willing to learn)
- Located in same city (easy support)

Pitch:
"Kami dari BALIK.LAGI, platform baru yang membantu barbershop
mengelola booking dan bikin pelanggan balik lagi. BOZQ Barber
sudah pakai dan terbantu. Mau coba gratis 1 bulan?"

Offer:
- Gratis 1 bulan (normally Rp 500K/bulan)
- Personal onboarding & training
- Priority support via WhatsApp
- Feature requests considered
```

#### **Onboarding Process (per barbershop)**
```
1. Discovery Call (30 mins)
   - Understand their current system
   - Explain BALIK.LAGI value proposition
   - Show live demo

2. Setup Session (1 hour)
   - Create admin account
   - Add capsters
   - Import customer data (if any)
   - Configure settings

3. Training Session (1 hour)
   - Walk through each dashboard
   - Practice booking flow
   - Q&A session

4. Follow-up (Day 3, 7, 14)
   - Check usage & issues
   - Collect feedback
   - Offer additional training if needed
```

**Deliverables**: 2-3 additional pilot customers, onboarding playbook

---

## 📅 WEEK 4: MONETIZATION & SCALE PREP (18-25 Jan 2026)

**Theme**: "From Free Pilot to First Paid Customer"

### **DAY 22-23: Subscription System** (Sabtu-Minggu)

#### **A. Pricing Tiers Setup**
```typescript
// lib/billing/plans.ts
export const PLANS = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    duration: 30, // days
    limits: {
      bookings: 50,
      capsters: 3,
      locations: 1,
      analytics: 'basic',
      support: 'email'
    }
  },
  PRO: {
    name: 'Pro',
    price: 500000, // Rp 500K
    duration: 30,
    limits: {
      bookings: Infinity,
      capsters: Infinity,
      locations: 3,
      analytics: 'advanced',
      support: 'whatsapp'
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 2000000, // Rp 2M
    duration: 30,
    limits: {
      bookings: Infinity,
      capsters: Infinity,
      locations: Infinity,
      analytics: 'premium',
      support: 'dedicated'
    }
  }
};
```

#### **B. Usage Tracking & Limits**
```sql
-- Add to barbershop_customers or create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES user_profiles(id),
  plan TEXT DEFAULT 'FREE', -- FREE/PRO/ENTERPRISE
  status TEXT DEFAULT 'active', -- active/cancelled/expired
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  bookings_count INT DEFAULT 0,
  bookings_limit INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check if can create booking
CREATE OR REPLACE FUNCTION can_create_booking(p_barbershop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE barbershop_id = p_barbershop_id
    AND status = 'active'
    AND current_period_end >= CURRENT_DATE
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RETURN FALSE; -- No active subscription
  END IF;
  
  IF v_subscription.bookings_count >= v_subscription.bookings_limit
     AND v_subscription.bookings_limit != -1 -- -1 = unlimited
  THEN
    RETURN FALSE; -- Limit reached
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### **C. Upgrade Prompt UI**
```typescript
// components/billing/UpgradePrompt.tsx
export function UpgradePrompt({ currentPlan, usage }: Props) {
  if (currentPlan === 'FREE' && usage.bookings >= 40) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Limit Soon</AlertTitle>
        <AlertDescription>
          Anda sudah menggunakan {usage.bookings}/50 bookings.
          Upgrade ke Pro untuk unlimited bookings!
          <Button variant="outline" className="mt-2">
            Upgrade Sekarang (Rp 500K/bulan)
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
```

**Deliverables**: Subscription system, usage tracking, upgrade flow

---

### **DAY 24-25: Payment Integration** (Senin-Selasa)

#### **A. Midtrans Integration (Indonesia)**
```typescript
// lib/payment/midtrans.ts
import Midtrans from 'midtrans-client';

const snap = new Midtrans.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function createPaymentToken(params: {
  order_id: string;
  amount: number;
  customer_email: string;
}) {
  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: params.order_id,
      gross_amount: params.amount
    },
    customer_details: {
      email: params.customer_email
    },
    credit_card: {
      secure: true
    }
  });
  
  return transaction.token;
}
```

#### **B. Payment Flow**
```typescript
// app/api/payments/create-transaction/route.ts
export async function POST(request: Request) {
  const { plan, barbershop_id } = await request.json();
  
  // 1. Create order
  const order_id = `ORDER-${Date.now()}-${barbershop_id}`;
  const amount = PLANS[plan].price;
  
  // 2. Get payment token
  const token = await createPaymentToken({
    order_id,
    amount,
    customer_email: user.email
  });
  
  // 3. Save pending payment
  await supabase.from('payments').insert({
    order_id,
    barbershop_id,
    plan,
    amount,
    status: 'pending',
    payment_token: token
  });
  
  // 4. Return token untuk frontend
  return Response.json({ token });
}
```

#### **C. Webhook Handler (Payment Notification)**
```typescript
// app/api/payments/webhook/route.ts
export async function POST(request: Request) {
  const notification = await request.json();
  
  // Verify signature (Midtrans security)
  const isValid = verifySignature(notification);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const { order_id, transaction_status } = notification;
  
  if (transaction_status === 'settlement') {
    // Payment success!
    await supabase.from('payments')
      .update({ status: 'paid' })
      .eq('order_id', order_id);
    
    // Activate subscription
    await activateSubscription(order_id);
    
    // Send confirmation email
    await sendPaymentConfirmation(order_id);
  }
  
  return Response.json({ success: true });
}
```

**Deliverables**: Payment integration, subscription activation, webhook handler

---

### **DAY 26-27: First Paid Customer** (Rabu-Kamis)

#### **Conversion Strategy**
```
Target: BOZQ Barber (pilot yang sudah puas)

Approach:
1. Week 3 feedback call:
   "Bagaimana pengalaman pakai BALIK.LAGI selama 2 minggu?"
   
2. Value reminder:
   "Anda sudah create 25+ bookings, 0 double-booking, customer happy"
   
3. Soft pitch:
   "Minggu depan trial berakhir. Kami tawarkan harga khusus early adopter:
    Rp 500K/bulan (normally Rp 750K) + gratis 1 bulan pertama"
   
4. Close:
   "Kalau cocok, kami setup payment sekarang. Kalau ada concern, kami dengar dulu."
```

#### **Success Scenario**
```
IF BOZQ agrees:
- Setup Midtrans account for them (or guide self-setup)
- Create first payment transaction
- Activate Pro subscription
- Celebrate first paid customer! 🎉

IF BOZQ hesitates:
- Ask: "Apa yang kurang?"
- Offer: "Extend trial 1 minggu lagi?"
- Note: Feature requests for improvement
- Follow up Day 28
```

**Deliverables**: First paying customer (goal: Rp 500K MRR)

---

### **DAY 28: Documentation & Handoff** (Jumat)

#### **Final Documentation**
```
1. Technical Documentation
   - API documentation (endpoints, payloads)
   - Database schema documentation
   - Deployment guide
   - Troubleshooting guide

2. Business Documentation
   - Onboarding playbook
   - Customer success guide
   - Pricing justification
   - Sales pitch templates

3. Legal & Compliance
   - Terms of Service
   - Privacy Policy
   - Data Processing Agreement
   - Refund Policy
```

#### **Handoff Preparation (if needed)**
```
If planning to hire team or delegate:
- Code walkthrough documentation
- Access credentials (in secure vault)
- Customer list & contact info
- Support ticket system setup
```

**Deliverables**: Complete documentation, ready for scale

---

## 🎯 POST-4-WEEK GOALS

### **Month 2 Objectives** (Feb 2026)
1. **10 Paying Customers** (Rp 5M MRR)
2. **Advanced Features**:
   - WhatsApp integration (booking confirmations)
   - Loyalty rewards redemption
   - Review system (post-service rating)
3. **Marketing Launch**:
   - Landing page SEO optimization
   - Social media presence (Instagram, TikTok)
   - First 3 case studies published

### **Month 3 Objectives** (Mar 2026)
1. **25 Paying Customers** (Rp 12.5M MRR)
2. **Product Expansion**:
   - Mobile app (PWA)
   - Multi-location support
   - API for integrations
3. **Fundraising Prep**:
   - Pitch deck creation
   - Financial model validation
   - Investor outreach (if needed)

---

## 📊 SUCCESS METRICS (4-Week Dashboard)

### **Week 1: Re-branding**
```
✅ All "BALIK.LAGI" → "BALIK.LAGI" (100%)
✅ New logo & visual identity live
✅ Landing page redesigned
✅ Documentation complete
```

### **Week 2: Features**
```
✅ Booking slots table implemented
✅ Double-booking prevention working (0 errors)
✅ Real-time updates functional
✅ All tests passing
```

### **Week 3: Pilots**
```
✅ 3 pilot customers onboarded
✅ 30+ bookings created via platform
✅ 85%+ user satisfaction
✅ <3 critical bugs reported
```

### **Week 4: Monetization**
```
✅ Subscription system live
✅ Payment integration working
✅ 1+ paying customer (Rp 500K+ MRR)
✅ Documentation complete
```

---

## 🚨 RISK MITIGATION

### **Risk 1: Re-branding Breaks Features**
**Mitigation**: 
- Update UI incrementally, not all-at-once
- Keep backend/database names stable (internal "oasis" OK)
- Test after each major change

### **Risk 2: Double-Booking Despite Prevention**
**Mitigation**:
- Use database-level constraints (UNIQUE indexes)
- Test with concurrent requests (load testing)
- Have rollback plan (manual booking management)

### **Risk 3: Pilot Customers Don't Convert**
**Mitigation**:
- Set clear expectations (trial period = 30 days)
- Collect feedback early & iterate fast
- Offer extended trial if close to converting
- Have backup plan (find more pilots)

### **Risk 4: Payment Integration Issues**
**Mitigation**:
- Test in Midtrans sandbox first
- Have manual payment alternative (bank transfer)
- Delay monetization if needed (focus on product first)

---

## 🎓 KEY PRINCIPLES

### **1. Done is Better Than Perfect**
- Ship MVP features, iterate based on feedback
- Don't over-engineer early (YAGNI principle)
- Focus on what customers actually need

### **2. Talk to Customers Daily**
- Don't build in isolation
- Every feature should solve real pain point
- Feedback loop < 24 hours

### **3. Stay Humble & Adaptive**
- Be ready to pivot if something not working
- Admit mistakes fast, fix faster
- Customer success > being "right"

---

## 🚀 LET'S EXECUTE!

**This is not just a plan. This is a commitment.**

**4 minggu dari sekarang (25 Januari 2026):**
- ✅ BALIK.LAGI brand fully launched
- ✅ Booking system 100% reliable
- ✅ 3+ pilot customers using daily
- ✅ 1+ paying customer (Rp 500K MRR)
- ✅ Foundation untuk scale ke 100+ customers

**Mari kita buktikan bahwa "aset digital abadi" bukan mimpi.**

---

**Created**: 28 Desember 2025  
**Status**: Ready for Execution  
**Next Review**: 3 Januari 2026 (end of Week 1)

---

**FROM PLAN TO ACTION - LET'S BUILD! 🔥**
