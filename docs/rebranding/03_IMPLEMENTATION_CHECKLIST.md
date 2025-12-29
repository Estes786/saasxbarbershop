# ✅ IMPLEMENTATION CHECKLIST: BALIK.LAGI RE-BRANDING

**Project**: BALIK.LAGI System  
**Phase**: Week 1-4 Implementation  
**Created**: 29 Desember 2025  
**Status**: Ready to Execute

---

## 📋 OVERVIEW

Dokumen ini adalah **action checklist** untuk execute re-branding. Setiap item dapat di-check off setelah selesai.

**Philosophy**: "Pelan tapi pasti - better done than perfect"

---

## 🎨 WEEK 1: FOUNDATION & VISUAL IDENTITY

### **DAY 1-2: Foundation** ✅ **COMPLETED**

- [x] Clone repository dari GitHub
- [x] Analyze codebase structure
- [x] Read semua existing documentation
- [x] Research Fresha onboarding flow
- [x] Create master plan documentation
- [x] Create onboarding flow design
- [x] Create implementation checklist (this file)

### **DAY 3-4: Visual Identity Creation**

#### **Logo Design** 🎨
- [ ] Create logo concept di Canva/Figma
  - [ ] Icon: Scissors + Return Arrow design
  - [ ] Wordmark: "BALIK.LAGI" typography
  - [ ] Monogram: "B.L" for favicon
- [ ] Export logo files:
  - [ ] logo.svg (vector, scalable)
  - [ ] logo-light.svg (for dark backgrounds)
  - [ ] logo-dark.svg (for light backgrounds)
  - [ ] favicon.ico (16x16, 32x32, 48x48)
  - [ ] apple-touch-icon.png (180x180)
  - [ ] og-image.png (1200x630 for social sharing)

**Location**: `/public/branding/`

#### **Color Palette Implementation** 🎨
- [ ] Update `app/globals.css` with brand colors:
```css
:root {
  /* Primary - Warm Brown */
  --primary-brown: #8B4513;
  --primary-brown-light: #A0522D;
  --primary-brown-dark: #654321;
  
  /* Secondary - Soft Beige */
  --secondary-beige: #F5E6D3;
  --secondary-beige-light: #FAF0E6;
  --secondary-beige-dark: #E8D4B8;
  
  /* Accent - Deep Red */
  --accent-red: #8B0000;
  --accent-red-light: #A52A2A;
  --accent-red-dark: #660000;
  
  /* Text */
  --text-dark: #2C1810;
  --text-light: #F5F5F5;
  --text-muted: #6B5B4D;
}
```

#### **Typography Setup** ✍️
- [ ] Add Google Fonts to `app/layout.tsx`:
  - [ ] Playfair Display (headings)
  - [ ] Inter (body text)
- [ ] Update typography classes in `globals.css`:
```css
.font-heading {
  font-family: 'Playfair Display', serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}
```

#### **Brand Guidelines Document** 📄
- [ ] Create `BRAND_GUIDELINES.md` in `/docs/`
  - [ ] Logo usage rules
  - [ ] Color palette with hex codes
  - [ ] Typography specifications
  - [ ] Tone of voice examples
  - [ ] Do's and Don'ts

---

### **DAY 5-7: Landing Page Redesign** 🌟

#### **File**: `app/page.tsx`

**Current State**: BALIK.LAGI branding  
**Target**: Complete BALIK.LAGI transformation

**Sections to Implement**:

- [ ] **Hero Section**
  ```tsx
  <Hero>
    - [ ] Headline: "Sekali Cocok, Pengen Balik Lagi"
    - [ ] Subheadline: Story-driven description
    - [ ] Primary CTA: "Mulai Gratis"
    - [ ] Secondary CTA: "Lihat Demo"
    - [ ] Hero image/illustration
  </Hero>
  ```

- [ ] **Problem Statement**
  ```tsx
  <ProblemSection>
    - [ ] Headline: Pain point yang relatable
    - [ ] 3 common problems barbershop face
    - [ ] Each with icon + short description
  </ProblemSection>
  ```

- [ ] **Solution Overview**
  ```tsx
  <SolutionSection>
    - [ ] Headline: "BALIK.LAGI = Lebih dari Booking App"
    - [ ] 3 Pillars: Retention, Analytics, Automation
    - [ ] Visual comparison (Before/After)
  </SolutionSection>
  ```

- [ ] **Features by Role**
  ```tsx
  <FeaturesSection>
    - [ ] Tab/Accordion: Customer, Capster, Owner
    - [ ] For each role: 3-4 key features
    - [ ] Visual icons + descriptions
    - [ ] Screenshots/mockups
  </FeaturesSection>
  ```

- [ ] **How It Works**
  ```tsx
  <HowItWorksSection>
    - [ ] Step 1: Daftar (2 menit)
    - [ ] Step 2: Setup (8 menit)
    - [ ] Step 3: Mulai Terima Booking
    - [ ] Interactive timeline/stepper UI
  </HowItWorksSection>
  ```

- [ ] **Social Proof**
  ```tsx
  <SocialProofSection>
    - [ ] Testimonial: BOZQ Barbershop (pilot partner)
    - [ ] Metrics: "97% customer retention"
    - [ ] Logo: "Powered by OASIS BI Engine" (subtle)
  </SocialProofSection>
  ```

- [ ] **Pricing Preview** (Optional for MVP)
  ```tsx
  <PricingSection>
    - [ ] "Mulai Gratis, Bayar Saat Berkembang"
    - [ ] Simple tiered pricing
    - [ ] CTA: "Lihat Harga Lengkap"
  </PricingSection>
  ```

- [ ] **Final CTA**
  ```tsx
  <FinalCTA>
    - [ ] Headline: "Siap Bikin Pelanggan Balik Lagi?"
    - [ ] Email capture form
    - [ ] Primary button: "Mulai Sekarang"
    - [ ] Trust badges: "No Credit Card Required"
  </FinalCTA>
  ```

- [ ] **Footer**
  ```tsx
  <Footer>
    - [ ] Logo + tagline
    - [ ] Navigation links
    - [ ] Social media icons
    - [ ] Contact info
    - [ ] Copyright notice
  </Footer>
  ```

**Technical Checklist**:
- [ ] Mobile responsive (test on 375px, 768px, 1024px)
- [ ] Smooth scroll between sections
- [ ] Lazy loading for images
- [ ] SEO meta tags updated
- [ ] Open Graph tags for social sharing

---

## 🎯 WEEK 2: DASHBOARD & COMPONENTS

### **Core Layout Updates**

#### **File**: `app/layout.tsx`
- [ ] Update `<title>`: "BALIK.LAGI - Bikin Pelanggan Balik Lagi"
- [ ] Update `<meta name="description">`: Brand-aligned description
- [ ] Update favicon link: `/branding/favicon.ico`
- [ ] Add Open Graph meta tags:
  ```tsx
  <meta property="og:title" content="BALIK.LAGI" />
  <meta property="og:description" content="..." />
  <meta property="og:image" content="/branding/og-image.png" />
  ```

#### **File**: `app/globals.css`
- [ ] Update global styles dengan brand colors
- [ ] Update button styles (primary, secondary, outline)
- [ ] Update card styles (rounded corners, shadows)
- [ ] Update form input styles
- [ ] Update heading styles (font-family)

---

### **Dashboard Updates**

#### **Customer Dashboard**: `app/dashboard/customer/page.tsx`
- [ ] Update page title: "Dashboard Saya"
- [ ] Update greeting: "Selamat Datang, [Name]! 👋"
- [ ] Update navigation breadcrumb
- [ ] Update component headers:
  - [ ] BookingForm → "Booking Sekarang"
  - [ ] BookingHistory → "Riwayat Booking Saya"
  - [ ] LoyaltyTracker → "Progress Loyalty"
- [ ] Test data isolation (verify user-specific data)

#### **Capster Dashboard**: `app/dashboard/capster/page.tsx`
- [ ] Update page title: "Queue Hari Ini"
- [ ] Update greeting: "Selamat Bekerja, [Name]! 💈"
- [ ] Update component headers:
  - [ ] QueueDisplay → "Antrian Hari Ini"
  - [ ] QueueManagement → "Kelola Booking"
  - [ ] Performance metrics → "Performa Saya"
- [ ] Add quick stats cards (Today's bookings, Completed, Rating)

#### **Admin Dashboard**: `app/dashboard/admin/page.tsx`
- [ ] Update page title: "Barbershop Analytics"
- [ ] Update greeting: "Overview {businessName}"
- [ ] Update component headers:
  - [ ] BookingMonitor → "Monitoring Booking Real-time"
  - [ ] Revenue analytics → "Analisis Pendapatan"
- [ ] Add KHL tracker prominent display

#### **Barbershop Owner Dashboard**: `app/dashboard/barbershop/page.tsx`
- [ ] Update page title: "Business Intelligence"
- [ ] Update component headers:
  - [ ] KHLTracker → "Target Harian (KHL)"
  - [ ] ActionableLeads → "Customer yang Perlu Perhatian"
  - [ ] RevenueAnalytics → "Analisis Revenue"
  - [ ] TransactionsManager → "Transaksi"
- [ ] Add quick action buttons

---

### **Authentication Pages**

#### **Login Page**: `app/(auth)/login/page.tsx`
- [ ] Update page title: "Masuk ke BALIK.LAGI"
- [ ] Update heading: "Selamat Datang Kembali! 👋"
- [ ] Update subheading: "Masuk untuk melanjutkan"
- [ ] Update form labels:
  - [ ] "Email" (keep simple)
  - [ ] "Password"
- [ ] Update button text: "Masuk"
- [ ] Update footer link: "Belum punya akun? Daftar di sini"

#### **Register Page**: `app/(auth)/register/page.tsx`
- [ ] Update page title: "Daftar BALIK.LAGI"
- [ ] Update heading: "Mulai Perjalanan Anda 🚀"
- [ ] Update subheading: "Pilih role Anda untuk memulai"
- [ ] Update role cards:
  - [ ] Customer: "Saya ingin booking barbershop"
  - [ ] Capster: "Saya seorang barber/capster"
  - [ ] Owner: "Saya owner barbershop"
- [ ] Update form labels (warm, friendly tone)

#### **Role-Specific Register Pages**:
- [ ] `app/(auth)/register/customer/page.tsx`
  - [ ] Update heading: "Daftar sebagai Customer"
  - [ ] Update form copy (friendly tone)
- [ ] `app/(auth)/register/capster/page.tsx`
  - [ ] Update heading: "Daftar sebagai Capster"
  - [ ] Add specialty field
- [ ] `app/(auth)/register/admin/page.tsx`
  - [ ] Update heading: "Daftar sebagai Barbershop Owner"
  - [ ] Add business name field

#### **Role-Specific Login Pages**:
- [ ] `app/(auth)/login/customer/page.tsx`
- [ ] `app/(auth)/login/capster/page.tsx`
- [ ] `app/(auth)/login/admin/page.tsx`

---

### **Component Updates**

#### **Customer Components**

**File**: `components/customer/BookingForm.tsx`
- [ ] Update component title: "Booking Sekarang"
- [ ] Update field labels (Indonesian, friendly)
- [ ] Update button text: "Konfirmasi Booking"
- [ ] Update success message: "Booking berhasil! 🎉"

**File**: `components/customer/BookingHistory.tsx`
- [ ] Update component title: "Riwayat Booking Saya"
- [ ] Update empty state message
- [ ] Update status badges (Bahasa Indonesia)

**File**: `components/customer/LoyaltyTracker.tsx`
- [ ] Update component title: "Progress Loyalty"
- [ ] Update milestone message: "3 lagi dapat gratis! 🎁"
- [ ] Update reward unlock message

---

#### **Capster Components**

**File**: `components/capster/QueueDisplay.tsx`
- [ ] Update component title: "Antrian Hari Ini"
- [ ] Update empty state: "Belum ada booking hari ini"
- [ ] Update booking card design (brand colors)

**File**: `components/capster/QueueManagement.tsx`
- [ ] Update status update buttons
- [ ] Update confirmation modals
- [ ] Update success toasts

**File**: `components/capster/CustomerPredictionsPanel.tsx`
- [ ] Update component title
- [ ] Update insights copy

---

#### **Barbershop Components**

**File**: `components/barbershop/KHLTracker.tsx`
- [ ] Update component title: "Target Harian (KHL)"
- [ ] Update progress indicator design
- [ ] Update insights text

**File**: `components/barbershop/ActionableLeads.tsx`
- [ ] Update component title: "Customer yang Perlu Perhatian"
- [ ] Update lead categories
- [ ] Update action buttons

**File**: `components/barbershop/RevenueAnalytics.tsx`
- [ ] Update component title: "Analisis Revenue"
- [ ] Update chart labels
- [ ] Update insights text

**File**: `components/barbershop/TransactionsManager.tsx`
- [ ] Update component title: "Transaksi"
- [ ] Update table headers
- [ ] Update filter options

---

#### **Admin Components**

**File**: `components/admin/BookingMonitor.tsx`
- [ ] Update component title: "Monitoring Booking Real-time"
- [ ] Update filters UI
- [ ] Update booking card design

---

## 🚀 WEEK 3: ONBOARDING & POLISH

### **Onboarding Implementation**

- [ ] Create new folder: `app/(onboarding)/`
- [ ] Create shared layout: `app/(onboarding)/layout.tsx`
  - [ ] Progress indicator component
  - [ ] Navigation (Back/Next) component
  - [ ] Skip option component

#### **Barbershop Owner Onboarding**
- [ ] `app/(onboarding)/owner/welcome/page.tsx`
  - [ ] Welcome screen (Step 1)
- [ ] `app/(onboarding)/owner/business-info/page.tsx`
  - [ ] Business information form (Step 2)
- [ ] `app/(onboarding)/owner/services/page.tsx`
  - [ ] Services setup (Step 3)
- [ ] `app/(onboarding)/owner/team/page.tsx`
  - [ ] Team invite (Step 4)
- [ ] `app/(onboarding)/owner/success/page.tsx`
  - [ ] Success & next steps (Step 5)

#### **Customer Onboarding**
- [ ] `app/(onboarding)/customer/welcome/page.tsx`
- [ ] `app/(onboarding)/customer/first-booking/page.tsx`
- [ ] `app/(onboarding)/customer/success/page.tsx`

#### **Capster Onboarding**
- [ ] `app/(onboarding)/capster/welcome/page.tsx`
- [ ] `app/(onboarding)/capster/profile/page.tsx`
- [ ] `app/(onboarding)/capster/tutorial/page.tsx`

---

### **UI Polish**

- [ ] Review all pages untuk consistency
- [ ] Update loading states (spinners, skeletons)
- [ ] Update error states (friendly messages)
- [ ] Update empty states (helpful illustrations)
- [ ] Add toast notifications for actions
- [ ] Add smooth transitions between pages
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

---

## 🧪 WEEK 4: TESTING & DEPLOYMENT

### **Testing Checklist**

#### **Functional Testing**
- [ ] Register flow (3 roles)
- [ ] Login flow (3 roles)
- [ ] Booking flow (end-to-end)
- [ ] Queue management (capster)
- [ ] Analytics viewing (owner/admin)
- [ ] Loyalty tracking (customer)

#### **Browser Testing**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### **Responsive Testing**
- [ ] Mobile portrait (375px)
- [ ] Mobile landscape (667px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px)
- [ ] Large desktop (1440px+)

#### **Performance Testing**
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No console errors
- [ ] No broken links

---

### **Documentation Updates**

- [ ] Update README.md
  - [ ] New screenshots
  - [ ] Updated features list
  - [ ] Updated URLs
- [ ] Update API documentation (if any)
- [ ] Update deployment guide
- [ ] Update troubleshooting guide
- [ ] Create user guide (basic usage)

---

### **Deployment Preparation**

#### **Environment Setup**
- [ ] Verify Supabase credentials in `.env.local`
- [ ] Verify Vercel project settings
- [ ] Setup custom domain (baliklagi.id) - if ready
- [ ] Setup SSL certificate
- [ ] Setup redirect rules (OASIS → BALIK.LAGI)

#### **Pre-Deployment Checks**
- [ ] Run `npm run build` locally (no errors)
- [ ] Test production build locally
- [ ] Verify all environment variables
- [ ] Verify database connection
- [ ] Verify authentication flows

#### **Deployment**
- [ ] Deploy to Vercel (main branch)
- [ ] Verify production URL works
- [ ] Test live site (all features)
- [ ] Monitor error logs (first 24 hours)

#### **Post-Deployment**
- [ ] Update GitHub repository description
- [ ] Update social media links
- [ ] Announce to pilot partner (BOZQ)
- [ ] Create demo account credentials
- [ ] Share with 3-5 early testers

---

## 🎯 PRIORITY LEVELS

### **🔴 CRITICAL (Must Have Week 1)**
- Logo design
- Landing page redesign
- globals.css update
- layout.tsx meta tags

### **🟡 HIGH (Week 2)**
- All dashboard headers
- Authentication pages
- Main component updates

### **🟢 MEDIUM (Week 3)**
- Onboarding flows
- UI polish
- Empty states

### **🔵 LOW (Week 4 / Nice to Have)**
- Custom domain
- Marketing materials
- Blog setup

---

## 📊 PROGRESS TRACKING

### **Completion Status**
```
✅ Week 1 Day 1-2: COMPLETED (29 Dec 2025)
🔄 Week 1 Day 3-4: IN PROGRESS
⏳ Week 1 Day 5-7: PENDING
⏳ Week 2: PENDING
⏳ Week 3: PENDING
⏳ Week 4: PENDING
```

### **Estimated Hours**
```
Week 1: 20-25 hours
Week 2: 25-30 hours
Week 3: 20-25 hours
Week 4: 15-20 hours

Total: 80-100 hours (~2-3 weeks full-time)
```

---

## 🎉 DEFINITION OF DONE

**Re-branding is considered COMPLETE when**:
✅ All user-facing text updated to BALIK.LAGI  
✅ New logo visible on all pages  
✅ Brand colors applied consistently  
✅ Landing page redesigned  
✅ All dashboards updated  
✅ Onboarding flows implemented  
✅ Zero critical bugs  
✅ Performance score > 90  
✅ Mobile responsive  
✅ Deployed to production  

---

## 📞 NEED HELP?

**Stuck on something?**
- Check `/docs/rebranding/` for detailed guides
- Review existing components for patterns
- Test frequently (don't wait until the end)
- Commit often (easy to revert if needed)

**Remember**: "Pelan tapi pasti" - Progress over perfection! 💪

---

**Checklist Created**: 29 Desember 2025  
**Last Updated**: 29 Desember 2025  
**Status**: Ready for execution  
**Next Review**: Setiap Minggu untuk update progress

---

**LET'S EXECUTE! 🚀 BISMILLAH!**
