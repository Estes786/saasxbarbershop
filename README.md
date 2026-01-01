# 🚀 BALIK.LAGI SYSTEM - Barbershop SaaS Platform

**Tagline**: "Sekali Cocok, Pengen Balik Lagi"  
**Status**: ✅ **Release 0.1** - Menjaga Aliran Dasar  
**Philosophy**: "Ketenangan di atas kecanggihan"  
**URL**: https://saasxbarbershop.vercel.app (migrating to baliklagi.id)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Estes786/saasxbarbershop)
[![Database](https://img.shields.io/badge/database-supabase-success)](https://supabase.com)
[![Framework](https://img.shields.io/badge/framework-next.js-black)](https://nextjs.org)

---

## 🎯 TENTANG BALIK.LAGI

**Balik.Lagi** adalah platform SaaS untuk manajemen barbershop yang fokus pada **ketenangan & ritme kerja**.

### **Release 0.1 Philosophy**
> **"Dashboard bukan tempat memantau angka.  
> Tapi tempat memastikan hari berjalan dengan rapi."**

**Dirancang untuk:**
1. **Customer** - Booking mudah, datang sesuai waktu, tidak saling menunggu
2. **Capster** - Kerja lebih tenang, antrian jelas, fokus satu per satu  
3. **Owner** - Lihat kondisi hari ini: booking, selesai, batal. Sederhana & jelas.

### **Yang TIDAK ada di R0.1 (by design)**
❌ Analytics mendalam  
❌ Revenue tracking  
❌ Performance metrics  
❌ Ranking atau perbandingan  
❌ Target & tekanan  

**Why?** Karena sistem yang menenangkan, bertahan lama.

---

## ✨ FITUR UTAMA

### **✂️ Untuk Customer**
- ✅ **Online Booking** - Pilih capster & layanan favorit
- ✅ **Loyalty Tracker** - 4 kunjungan = 1 gratis
- ✅ **Booking History** - Lihat riwayat dengan status real-time
- ✅ **Personalized Dashboard** - Data pribadi yang aman & terisolasi

### **👨‍💼 Untuk Capster (Barber)**
- ✅ **Real-time Queue Display** - Lihat antrian hari ini
- ✅ **Queue Management** - Update status (pending → confirmed → in-progress → completed)
- ✅ **Performance Metrics** - Total service, rating, revenue
- ✅ **Customer History** - Preferensi & pola kunjungan pelanggan

### **📊 Untuk Owner (R0.1 - Simplified)**
- ✅ **Booking Monitor** - Lihat booking hari ini dengan status jelas
- ✅ **Transactions Manager** - Riwayat transaksi sederhana
- ✅ **Queue Overview** - Status antrian real-time
- 🏢 **Multi-Location Support** - Manage multiple branches (Phase 1 Complete)
- ℹ️ **Advanced Analytics** - Coming in R0.2 (setelah aliran stabil)

---

## 🏗️ TECH STACK

### **Frontend**
```
Next.js: 15.1.0 (App Router)
React: 19.0.0
TypeScript: 5.3.3
TailwindCSS: 3.4.0
Lucide React: 0.460.0 (Icons)
Recharts: 2.10.3 (Charts)
```

### **Backend & Database**
```
Supabase: 2.89.0
PostgreSQL: Latest (via Supabase Cloud)
Supabase Auth: Email/Password + Google OAuth
Row Level Security (RLS): Enabled
Realtime: Active
```

### **Hosting & Deployment**
```
Frontend: Vercel (https://saasxbarbershop.vercel.app)
Database: Supabase Cloud
Version Control: GitHub
```

---

## 🚀 QUICK START

### **Prerequisites**
- Node.js 18+
- npm atau yarn
- Supabase account

### **Installation**
```bash
# 1. Clone repository
git clone https://github.com/Estes786/saasxbarbershop.git
cd saasxbarbershop

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials Anda

# 4. Build project
npm run build

# 5. Start development server
npm run dev
# Atau gunakan PM2: pm2 start ecosystem.config.cjs
```

### **Access the App**
```
Local: http://localhost:3000
Production: https://saasxbarbershop.vercel.app
```

---

## 🔑 ACCESS KEYS (untuk Registrasi)

### **Customer Access Key**
```
CUSTOMER_OASIS_2025
```
Diberikan kepada customer saat pertama kali datang ke barbershop

### **Capster Access Key**
```
CAPSTER_B0ZD_ACCESS_1
```
Untuk barber/capster yang bekerja di BALIK.LAGI

### **Admin Access Key**
```
ADMIN_B0ZD_ACCESS_1
```
Untuk owner/admin barbershop (founder only)

---

## 📚 DOKUMENTASI LENGKAP

📁 **Complete documentation tersedia di** `/docs/` **directory**:

### **Documentation Structure**
```
docs/
├── 00_INDEX.md                        # Master index & navigation
├── 01_personal_journey/               # Founder's story & motivation
├── 02_spiritual_foundation/           # Spiritual principles & philosophy
├── 03_business_concept/               # Business strategy & monetization
├── 04_technical_analysis/             # Architecture, database, APIs
└── 05_implementation_plans/           # Week-by-week roadmap
```

### **Quick Links**
- 📖 **[Master Index](./docs/00_INDEX.md)** - Start here for navigation
- 🎨 **[Re-branding Plan](./docs/03_business_concept/01_rebranding_plan.md)** - Why BALIK.LAGI?
- 🏗️ **[Current State Analysis](./docs/04_technical_analysis/01_current_state_analysis.md)** - Tech stack & metrics
- 📅 **[Week 1 Plan](./docs/05_implementation_plans/02_week_1_rebranding.md)** - Implementation guide

---

## 🗄️ DATABASE SCHEMA (Simplified)

### **Core Tables**
```sql
user_profiles              # User accounts (3 roles: customer, capster, admin)
barbershop_profiles        # Barbershop information
branches                   # 🆕 Multiple locations/branches support
barbershop_customers       # Customer data with loyalty tracking
barbershop_transactions    # Transaction history (with branch tracking)
capsters                   # Barber profiles (assigned to branches)
service_catalog            # Available services (per branch)
bookings                   # Customer bookings & queue (branch-aware)
access_keys                # Registration access control
```

### **Row Level Security (RLS)**
✅ **1 USER = 1 DASHBOARD** - Data isolation per user  
✅ **Public read** for capsters & services (booking system)  
✅ **Role-based permissions** for bookings & analytics  
✅ **Admin full access** to all data  

---

## 🎨 BRAND IDENTITY

### **Brand Philosophy**
> **"Hangat, humble, tahan lama"**

**BALIK.LAGI** bukan sekadar nama. Ini adalah **promise**:
- **Customer Layer**: Sekali cocok, pengen balik lagi
- **Business Layer**: Rezeki balik lagi (recurring revenue)
- **Spiritual Layer**: Pulang ke niat awal yang ikhlas

### **Visual Identity**
```
Colors: Warm Brown, Beige, Deep Red
Fonts: Playfair Display (headings), Inter (body)
Tone: Friendly, story-driven, non-corporate
```

---

## 📊 PROJECT METRICS

### **Current Status** (30 Desember 2025)
```
✅ RELEASE 0.1: MENJAGA ALIRAN DASAR
   ✅ Landing page dengan philosophy R0.1
   ✅ Dashboard simplified (fokus pada ketenangan)
   ✅ Booking & antrian real-time
   ✅ 3-Role system: Customer, Capster, Owner
   ✅ Advanced analytics disembunyikan (by design)
   ✅ Tone manusiawi, tidak menjanjikan angka
   ✅ Master Implementation Plan documented
   
🏢 MULTI-LOCATION SUPPORT: PHASE 1 COMPLETE (01 Jan 2026)
   ✅ Database schema designed (branches table + 4 table updates)
   ✅ Migration script created (16KB, idempotent, with rollback)
   ✅ Analysis & testing scripts (4 Node.js scripts)
   ✅ Comprehensive documentation (30+ pages)
   ✅ Build verification passed (no breaking changes)
   ✅ Pushed to GitHub (commits: b36bf87, df72125)
   ⏳ Ready for user to apply migration
   ⏳ Phase 2-5: Backend APIs & Frontend (38-50 hours)
   
⏳ RELEASE 0.2: MEMBUKA YANG PERLU (Future)
   ⏳ Analytics (dengan syarat ketat)
   ⏳ Monetization planning
   ⏳ Premium features
```

### **Codebase Stats**
```
📊 Total Files: 197 TypeScript/JavaScript files
📦 Components: 30+ React components
🔌 API Routes: 9 REST endpoints
📄 Pages: 21 Next.js pages
⚡ Build Time: ~44 seconds
✅ Build Status: Passing
```

---

## 🎯 ROADMAP

### **FASE 1: Foundation** ✅ **COMPLETE**
- [x] Authentication system (3 roles)
- [x] ACCESS KEY system
- [x] Basic dashboards untuk 3 roles
- [x] Database schema & RLS policies
- [x] 1 USER = 1 DASHBOARD isolation

### **FASE 2: Re-branding** 🔄 **IN PROGRESS**
- [x] Documentation modularization
- [x] Core files update (package.json, layout, README)
- [ ] Landing page redesign
- [ ] Dashboard headers update
- [ ] Visual identity finalization

### **FASE 2.5: Multi-Location Support** 🔄 **PHASE 1 COMPLETE**
- [x] Database schema design (branches table + updates)
- [x] Migration script (idempotent, with rollback)
- [x] Analysis & testing scripts
- [x] Comprehensive documentation (30+ pages)
- [ ] Apply migration to production (USER ACTION)
- [ ] Backend APIs for branch management
- [ ] Frontend components (admin & customer)
- [ ] Testing & deployment

### **FASE 3: Launch Preparation** ⏳ **PLANNED**
- [ ] Double-booking prevention
- [ ] Real-time updates for customers
- [ ] Domain migration (baliklagi.id)
- [ ] Onboard 3-5 pilot customers

### **FASE 4: Scale & Growth** 🚀 **FUTURE**
- [ ] WhatsApp integration
- [x] Multi-location support (Phase 1 - Database ready)
- [ ] Multi-location support (Phase 2-5 - UI & APIs)
- [ ] Predictive analytics
- [ ] Mobile app (React Native)

---

## 🐛 KNOWN ISSUES & FIXES

### **Recently Fixed** ✅
- ✅ **Multi-Location Support Phase 1** (Completed 01 Jan 2026)
  - Database schema designed
  - Migration script created & tested
  - Comprehensive documentation (30+ pages)
  - Ready for production deployment
  
- ✅ **Booking System "Loading capsters..." Forever** (Fixed 27 Des 2025)
  - Root cause: RLS policies blocking customer access
  - Solution: Updated RLS for public read on capsters & services
  
- ✅ **Dashboard Shared Data** (Fixed 26 Des 2025)
  - Root cause: Missing user_id isolation
  - Solution: Added user_id FK + RLS policies

### **In Progress** 🔄
- 🔄 **Multi-Location Support Phase 2-5** (Backend APIs & Frontend)
- 🔄 **Re-branding BALIK.LAGI → BALIK.LAGI** (Week 1, 29 Des - 4 Jan)
- 🔄 **Documentation modularization** (Ongoing)

### **Planned Improvements** ⏳
- ⏳ Double-booking prevention
- ⏳ Real-time booking updates for customers
- ⏳ Improved error handling
- ⏳ Performance monitoring

---

## 🧪 TESTING

### **Test Flow: Customer**
1. Register dengan email & ACCESS KEY (`CUSTOMER_OASIS_2025`)
2. Login dan verify dashboard shows fresh data (0 visits)
3. Booking layanan dengan capster pilihan
4. Check loyalty tracker (visits/4 progress)
5. Verify booking history shows status updates

### **Test Flow: Capster**
1. Register dengan email & ACCESS KEY (`CAPSTER_B0ZD_ACCESS_1`)
2. Login dan view queue display
3. Update booking status (pending → confirmed → in-progress → completed)
4. Check performance metrics

### **Test Flow: Admin**
1. Login dengan admin credentials
2. View KHL tracking & revenue analytics
3. Check actionable leads
4. Monitor all bookings across capsters

---

## 📞 CONTACT & SUPPORT

- **GitHub Repository**: https://github.com/Estes786/saasxbarbershop
- **Email**: hyydarr1@gmail.com
- **Production URL**: https://saasxbarbershop.vercel.app
- **Future Domain**: https://baliklagi.id (coming soon)

---

## 📄 LICENSE

Proprietary - © 2025 BALIK.LAGI System

---

## 🙏 ACKNOWLEDGMENTS

> **"Proyek ini bukan sekadar kode atau teknologi.  
> Proyek ini adalah manifestasi dari perjalanan spiritual,  
> dari santri yang kehilangan arah, menjadi developer yang menemukan purpose."**

Terima kasih kepada:
- **Allah SWT** - Pemberi hidayah dan petunjuk
- **BOZQ Barbershop** - Pilot partner & learning lab
- **Supabase Team** - Amazing platform for rapid development
- **Next.js Team** - Best React framework
- **Open Source Community** - Standing on the shoulders of giants

---

## 🌟 FILOSOFI BALIK.LAGI

> **"Kita tidak sedang membangun startup yang harus cepat viral.  
> Kita sedang membangun aset digital yang tahan lama,  
> seperti pohon yang baik: akarnya kuat, cabangnya ke langit, berbuahnya setiap waktu."**

**Bismillah. Mari kita bangun sesuatu yang bermakna. 🌱**

---

**Last Updated**: 01 Januari 2026  
**Version**: 2.1.0 - Multi-Location Support Phase 1 Complete  
**Status**: 🚀 Production Ready - Actively Maintained

---

## 🏢 MULTI-LOCATION SUPPORT (NEW!)

**Status**: ✅ Phase 1 Complete - Ready for Deployment

BALIK.LAGI sekarang support multiple locations/branches! Barbershop owner dapat mengelola beberapa lokasi dari satu akun.

### **What's Ready**
- ✅ Complete database schema design
- ✅ Production-ready migration script (tested & safe)
- ✅ Comprehensive documentation (30+ pages)
- ✅ Testing & verification scripts

### **Quick Links**
- 📖 [Implementation Plan](./docs/MULTI_LOCATION_SUPPORT_IMPLEMENTATION_PLAN.md) - Complete blueprint
- 🚀 [Migration Guide](./docs/MIGRATION_GUIDE_MULTI_LOCATION.md) - Step-by-step instructions
- 📊 [Phase 1 Report](./docs/MISSION_ACCOMPLISHED_MULTI_LOCATION_PHASE_1.md) - What was delivered

### **Next Steps for User**
1. **Apply Migration** (5-10 minutes)
   - Open Supabase SQL Editor
   - Run `migrations/01_multi_location_support.sql`
   - Verify with provided queries

2. **Continue Development** (Optional)
   - Phase 2: Backend APIs (15-20 hours)
   - Phase 3: Frontend Components (15-20 hours)
   - Phase 4: Testing & Deployment (8-10 hours)

See complete documentation in `/docs` folder for detailed instructions.

---

**Last Updated**: 01 Januari 2026  
**Version**: 2.1.0 - Multi-Location Support Phase 1 Complete  
**Status**: 🚀 Production Ready - Actively Maintained
