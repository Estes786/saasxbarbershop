# 🌟 ONBOARDING FLOW IMPLEMENTATION GUIDE - BALIK.LAGI

**Date**: 30 Desember 2025  
**Status**: ✅ **DATABASE SCHEMA FIXED & READY**  
**Project**: BALIK.LAGI (Barbershop SaaS Platform)

---

## 📋 OVERVIEW

Implementasi **5-Step Onboarding Wizard** untuk membimbing barbershop owner baru dalam setup barbershop mereka pertama kali. Terinspirasi dari **Fresha Partner Onboarding** dengan filosofi "Bikin mudah, bukan bikin bingung".

---

## 🎯 OBJECTIVES

### **User Experience Goals**
- ✅ Setup barbershop dalam **< 10 menit**
- ✅ **80%+ completion rate** (minimize drop-offs)
- ✅ **Zero technical knowledge** required
- ✅ Friendly, guided, warm experience

### **Business Goals**
- ✅ Reduce manual setup requests
- ✅ Faster time-to-value for new users
- ✅ Increased activation rate
- ✅ Better data quality from the start

---

## 📐 ARCHITECTURE

### **Database Schema (✅ FIXED)**

File: `supabase/migrations/20251230_onboarding_enhancement_fixed.sql`

#### **New Tables Created:**

```sql
1. barbershop_profiles      # Master barbershop data (1 per owner)
2. capsters                 # Barbers working at barbershop
3. service_catalog          # Services offered
4. access_keys              # Customer/Capster access keys
5. onboarding_progress      # Track onboarding wizard progress
```

#### **Key Improvements from Original:**
- ✅ **Fixed**: No more "column barbershop_id does not exist" error
- ✅ **Idempotent**: Can be run multiple times safely
- ✅ **Complete RLS**: Row-level security properly configured
- ✅ **Helper Functions**: `complete_onboarding()`, `get_onboarding_status()`, `generate_access_key()`
- ✅ **Constraints**: Proper checks for data integrity
- ✅ **Indexes**: Optimized for performance

---

## 🚀 ONBOARDING FLOW (5 STEPS)

### **Step 1: Barbershop Profile** 🏪
**Time**: ~2 minutes

**Fields:**
- Barbershop Name (required)
- Address (required)
- Phone Number (required)
- Operating Hours (default: 09:00-21:00)
- Days Open (default: Mon-Sat)
- Instagram Handle (optional)
- WhatsApp Business (optional)

**UX Notes:**
- Auto-format phone number
- Map selector for address
- Smart defaults reduce friction

---

### **Step 2: Add Capsters** ✂️
**Time**: ~2 minutes

**Fields per Capster:**
- Name (required)
- Specialization (default: "Classic Haircut")
- Phone (optional)

**UX Notes:**
- "Add Another Capster" button
- Can skip if solo owner-barber
- Minimum 1 capster required

---

### **Step 3: Service Catalog** 💰
**Time**: ~3 minutes

**Pre-populated Templates:**
```
- Potong Rambut Basic (Rp 20,000 - 30 min)
- Potong Rambut Premium (Rp 40,000 - 45 min)
- Potong Rambut Mastery (Rp 60,000 - 60 min)
- Cukur Kumis & Jenggot (Rp 15,000 - 15 min)
- Hair Tonic (Rp 10,000 - 10 min)
```

**Actions:**
- ✅ Use templates as-is
- ✏️ Edit prices/durations
- ➕ Add custom services
- 🗑️ Remove unwanted services

**Minimum**: 1 service required

---

### **Step 4: Generate Access Keys** 🔑
**Time**: ~1 minute

**Auto-generated:**
- **Customer Key**: `CUST-XXXXXXXX` (for customers to book)
- **Capster Key**: `CAPS-XXXXXXXX` (for barbers to join)

**Display:**
- Large, copyable text
- QR codes for easy sharing
- WhatsApp share buttons
- Save to cloud (auto)

**Notes:**
- Keys are unique, random
- Can be regenerated later in dashboard
- No expiration by default

---

### **Step 5: Test Booking (Optional)** 🎉
**Time**: ~2 minutes

**Demo Booking:**
- Walk through customer booking flow
- Select service, capster, time
- See confirmation screen
- "Got it!" to complete

**Celebration:**
- 🎉 Confetti animation
- "Selamat! Barbershop Anda siap beroperasi!"
- CTA: "Mulai Terima Booking"

---

## 💾 DATABASE FUNCTIONS

### **1. Complete Onboarding**
```sql
SELECT complete_onboarding(
  '{"name":"Bozq Barbershop","address":"Jl. Sudirman 123","phone":"081234567890"}', 
  ARRAY[
    '{"name":"Andi","specialization":"Classic Cut"}'::jsonb,
    '{"name":"Budi","specialization":"Modern Style"}'::jsonb
  ],
  ARRAY[
    '{"service_name":"Potong Rambut Basic","category":"haircut","price":"20000","duration_minutes":"30"}'::jsonb
  ],
  '{"customer":"CUST-ABC12345","capster":"CAPS-XYZ67890"}'
);
```

**Returns:**
```json
{
  "success": true,
  "barbershop_id": "uuid-here",
  "message": "Onboarding completed successfully"
}
```

---

### **2. Check Onboarding Status**
```sql
SELECT get_onboarding_status();
```

**Returns (Not Started):**
```json
{
  "authenticated": true,
  "onboarding_started": false,
  "onboarding_completed": false,
  "current_step": 0
}
```

**Returns (In Progress):**
```json
{
  "authenticated": true,
  "onboarding_started": true,
  "onboarding_completed": false,
  "current_step": 3,
  "barbershop_id": "uuid-here"
}
```

---

### **3. Generate Access Key**
```sql
SELECT generate_access_key('CUST-');
-- Returns: 'CUST-A7B9C2D4'
```

---

## 🎨 FRONTEND IMPLEMENTATION

### **Tech Stack:**
- **Next.js 15** (App Router)
- **React 19** (Client Components for wizard)
- **TailwindCSS** (Styling)
- **Lucide React** (Icons)
- **Supabase** (Backend)

---

### **File Structure:**
```
/home/user/webapp/
├── app/
│   ├── onboarding/
│   │   ├── page.tsx              # Main wizard orchestrator
│   │   ├── step-1-profile.tsx    # Barbershop profile form
│   │   ├── step-2-capsters.tsx   # Add capsters
│   │   ├── step-3-services.tsx   # Service catalog
│   │   ├── step-4-keys.tsx       # Generate access keys
│   │   └── step-5-celebration.tsx # Completion screen
│   └── dashboard/
│       └── onboarding-check.tsx  # Redirect if not completed
├── components/
│   └── onboarding/
│       ├── progress-bar.tsx      # Visual progress indicator
│       ├── step-wrapper.tsx      # Consistent layout
│       └── skip-button.tsx       # Optional skip option
└── lib/
    └── supabase/
        └── onboarding.ts         # API functions
```

---

### **Key Components:**

#### **1. Progress Bar**
```tsx
<ProgressBar currentStep={2} totalSteps={5} />
// Visual: ████████░░░░░░ 40%
```

#### **2. Step Wrapper**
```tsx
<StepWrapper
  stepNumber={1}
  title="Profile Barbershop"
  subtitle="Mari kita kenalan dengan barbershop Anda"
>
  {children}
</StepWrapper>
```

#### **3. Navigation Buttons**
```tsx
<div className="flex justify-between mt-8">
  <Button variant="ghost" onClick={handleBack}>← Kembali</Button>
  <Button onClick={handleNext}>Lanjut →</Button>
</div>
```

---

## 🔐 SECURITY & PERMISSIONS

### **Row Level Security (RLS)**
All tables have RLS enabled with policies:
- ✅ Users can only see/edit their own barbershop
- ✅ Public can view active barbershops/services (for booking)
- ✅ Access keys validated before use
- ✅ Service role has full access (for Edge Functions)

### **Data Validation**
- Phone numbers validated (10-15 digits)
- Prices must be >= 0
- Durations must be > 0
- Rating must be 0-5
- Access keys are unique

---

## 📊 ANALYTICS & TRACKING

### **Metrics to Track:**
```typescript
// Track with PostHog or similar
analytics.track('onboarding_started', { user_id });
analytics.track('onboarding_step_completed', { user_id, step: 1 });
analytics.track('onboarding_completed', { user_id, duration_minutes });
analytics.track('onboarding_abandoned', { user_id, last_step: 3 });
```

### **Success Metrics:**
- **Completion Rate**: Target > 80%
- **Time to Complete**: Target < 10 minutes
- **Drop-off Points**: Monitor each step
- **First Booking Time**: After onboarding completion

---

## 🧪 TESTING CHECKLIST

### **Database Testing:**
```bash
# 1. Apply migration
cd /home/user/webapp
psql -h qwqmhvwqeynnyxaecqzw.supabase.co -U postgres -d postgres < supabase/migrations/20251230_onboarding_enhancement_fixed.sql

# 2. Test onboarding function
SELECT get_onboarding_status();

# 3. Test complete onboarding (replace with real data)
SELECT complete_onboarding(...)
```

### **Frontend Testing:**
- [ ] Can access `/onboarding` route
- [ ] Progress bar updates correctly
- [ ] Can navigate back/forward
- [ ] Form validation works
- [ ] Can add multiple capsters
- [ ] Can edit service templates
- [ ] Access keys generated correctly
- [ ] QR codes displayed
- [ ] WhatsApp share works
- [ ] Completion celebration shows
- [ ] Redirects to dashboard after completion
- [ ] Cannot access onboarding again if completed

---

## 🚨 ERROR HANDLING

### **Common Errors & Solutions:**

#### **Error: "column barbershop_id does not exist"**
**Solution**: Use the FIXED script (`20251230_onboarding_enhancement_fixed.sql`)

#### **Error: "Not authenticated"**
**Solution**: Ensure user is logged in before accessing onboarding

#### **Error: "Access key already exists"**
**Solution**: Call `generate_access_key()` again for new unique key

#### **Error: "RLS policy violation"**
**Solution**: Check user is authenticated and owns the barbershop

---

## 🎁 SAMPLE DATA (FOR TESTING)

```sql
-- Insert test barbershop profile
INSERT INTO barbershop_profiles (owner_id, name, address, phone)
VALUES (auth.uid(), 'Test Barbershop', 'Jl. Test 123', '081234567890');

-- Insert test capster
INSERT INTO capsters (barbershop_id, name, specialization)
SELECT id, 'Test Capster', 'Classic Haircut'
FROM barbershop_profiles WHERE owner_id = auth.uid();

-- Insert test service
INSERT INTO service_catalog (barbershop_id, service_name, base_price, duration_minutes)
SELECT id, 'Test Service', 20000, 30
FROM barbershop_profiles WHERE owner_id = auth.uid();

-- Generate test access keys
INSERT INTO access_keys (barbershop_id, key_type, key_value)
SELECT id, 'customer', generate_access_key('CUST-')
FROM barbershop_profiles WHERE owner_id = auth.uid();
```

---

## 📝 DEPLOYMENT STEPS

### **1. Apply Database Migration**
```bash
# Via Supabase Dashboard SQL Editor
# Copy-paste contents of: supabase/migrations/20251230_onboarding_enhancement_fixed.sql
# Click "Run"
```

### **2. Verify Migration Success**
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('barbershop_profiles', 'capsters', 'service_catalog', 'access_keys', 'onboarding_progress');

-- Check functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('complete_onboarding', 'get_onboarding_status', 'generate_access_key');
```

### **3. Build & Deploy Frontend**
```bash
cd /home/user/webapp
npm install
npm run build
npm run deploy
```

### **4. Test End-to-End**
- Create new account
- Access `/onboarding`
- Complete all 5 steps
- Verify data in database
- Test booking with generated key

---

## 🔮 FUTURE ENHANCEMENTS

### **Phase 2:**
- [ ] Video tutorial embedded in wizard
- [ ] Live chat support during onboarding
- [ ] Save progress (resume later)
- [ ] Multi-location support (for chains)
- [ ] Import data from Google Sheets

### **Phase 3:**
- [ ] AI-powered service pricing recommendations
- [ ] Photo upload for barbershop/capsters
- [ ] Calendar integration
- [ ] Payment gateway setup
- [ ] Email/SMS template customization

---

## 📞 SUPPORT & TROUBLESHOOTING

### **Common Questions:**

**Q: Can I skip onboarding?**  
A: No, onboarding is required to set up barbershop profile.

**Q: Can I edit data after onboarding?**  
A: Yes! Go to Dashboard → Settings to edit everything.

**Q: What if I make a mistake?**  
A: You can go back and edit, or contact support.

**Q: Can I regenerate access keys?**  
A: Yes! Dashboard → Access Keys → Generate New.

---

## ✅ CHECKLIST FOR COMPLETION

- [x] Database schema designed
- [x] Migration script created & tested
- [x] RLS policies configured
- [x] Helper functions implemented
- [ ] Frontend components built
- [ ] Progress bar implemented
- [ ] Form validation added
- [ ] QR code generation
- [ ] WhatsApp integration
- [ ] Analytics tracking
- [ ] Error handling
- [ ] Testing completed
- [ ] Deployment ready

---

## 🎉 SUCCESS METRICS

**Target KPIs:**
- ✅ 80%+ onboarding completion rate
- ✅ < 10 minutes average completion time
- ✅ < 5% drop-off at Step 1
- ✅ 90%+ barbershops create at least 1 service
- ✅ 70%+ barbershops add at least 1 capster

---

**Document Created By**: AI Assistant  
**For Project**: BALIK.LAGI (SaaS x Barbershop)  
**Owner**: Bozq (Estes786)  
**Last Updated**: 30 Desember 2025
