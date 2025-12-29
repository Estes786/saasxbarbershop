# 🎯 RE-BRANDING IMPLEMENTATION PLAN - WEEK 1

**Project**: BALIK.LAGI System (formerly BALIK.LAGI)  
**Date**: 29 Desember 2025  
**Goal**: Complete re-branding dari BALIK.LAGI → BALIK.LAGI  
**Duration**: Week 1 (29 Des - 4 Jan 2026)

---

## 📊 CURRENT STATE ANALYSIS

### **✅ Already Updated to BALIK.LAGI**
1. ✅ `package.json` - name: "balik-lagi-system"
2. ✅ `README.md` - Complete re-branding with BALIK.LAGI identity
3. ✅ `app/page.tsx` - Line 89: Logo & brand name
4. ✅ Git initialized with comprehensive .gitignore

### **⚠️ Still Using BALIK.LAGI (15 references)**
Total files to update: **11 files**

#### **Authentication Pages (5 files)**
1. `app/(auth)/login/capster/page.tsx` - Line 80
2. `app/(auth)/login/customer/page.tsx` - Line 80
3. `app/(auth)/login/page.tsx` - Line 22, 37
4. `app/(auth)/register/capster/page.tsx` - Line 150
5. `app/(auth)/register/page.tsx` - Line 171, 215

#### **Dashboard Pages (4 files)**
6. `app/dashboard/admin/page.tsx` - Line 34, 88
7. `app/dashboard/barbershop/page.tsx` - Line 72, 109
8. `app/dashboard/capster/page.tsx` - Line 194
9. `app/dashboard/customer/page.tsx` - Line 160

#### **Landing Page (1 file)**
10. `app/page.tsx` - Line 307 (footer)

#### **Library Files (1 file)**
11. `lib/analytics/customerPrediction.ts` - Line 3 (comment)

---

## 🎨 BRAND REPLACEMENT STRATEGY

### **Core Brand Name Changes**

| Old Brand | New Brand | Context |
|-----------|-----------|---------|
| `BALIK.LAGI` | `BALIK.LAGI` | Main brand name |
| `BALIK.LAGI x Barbershop` | `BALIK.LAGI x Barbershop` | Full brand + context |
| `Portal Customer BALIK.LAGI` | `Portal Customer BALIK.LAGI` | Auth portals |
| `Powered by BALIK.LAGI` | `Powered by BALIK.LAGI` | Footer credits |
| `OASIS Barbershop` | `BALIK.LAGI Barbershop` | References to barbershop |

### **Access Key Updates (Already Correct)**
✅ Access keys sudah menggunakan naming yang generic:
- `CUSTOMER_OASIS_2025` → Keep (or change to `CUSTOMER_BALIK_2025`)
- `CAPSTER_B0ZD_ACCESS_1` → Keep (specific to BOZQ barbershop)
- `ADMIN_B0ZD_ACCESS_1` → Keep (specific to BOZQ barbershop)

**Decision**: Keep current access keys untuk backward compatibility. New keys bisa menggunakan BALIK prefix.

---

## 📋 DETAILED FILE-BY-FILE PLAN

### **GROUP 1: Authentication Pages** 🔐

#### **File 1: `app/(auth)/login/page.tsx`**
**Changes:**
- Line 22: `BALIK.LAGI` → `BALIK.LAGI`
- Line 37: `Pelanggan BALIK.LAGI` → `Pelanggan BALIK.LAGI`

**Impact**: Login landing page

---

#### **File 2: `app/(auth)/login/customer/page.tsx`**
**Changes:**
- Line 80: `Portal Customer BALIK.LAGI` → `Portal Customer BALIK.LAGI`

**Impact**: Customer login form

---

#### **File 3: `app/(auth)/login/capster/page.tsx`**
**Changes:**
- Line 80: `Portal Capster BALIK.LAGI` → `Portal Capster BALIK.LAGI`

**Impact**: Capster login form

---

#### **File 4: `app/(auth)/register/page.tsx`**
**Changes:**
- Line 171: `BALIK.LAGI` → `BALIK.LAGI`
- Line 215: `staff OASIS Barbershop` → `staff BALIK.LAGI Barbershop`

**Impact**: Customer registration page

---

#### **File 5: `app/(auth)/register/capster/page.tsx`**
**Changes:**
- Line 150: `BALIK.LAGI Barbershop` → `BALIK.LAGI Barbershop`

**Impact**: Capster registration page

---

### **GROUP 2: Dashboard Pages** 📊

#### **File 6: `app/dashboard/customer/page.tsx`**
**Changes:**
- Line 160: `Powered by BALIK.LAGI` → `Powered by BALIK.LAGI`

**Impact**: Customer dashboard footer

---

#### **File 7: `app/dashboard/capster/page.tsx`**
**Changes:**
- Line 194: `Powered by BALIK.LAGI` → `Powered by BALIK.LAGI`

**Impact**: Capster dashboard footer

---

#### **File 8: `app/dashboard/barbershop/page.tsx`**
**Changes:**
- Line 72: `BALIK.LAGI x Barbershop Kedungrandu` → `BALIK.LAGI x Barbershop Kedungrandu`
- Line 109: `© 2025 BALIK.LAGI x Barbershop Kedungrandu` → `© 2025 BALIK.LAGI x Barbershop Kedungrandu`

**Impact**: Barbershop overview dashboard

---

#### **File 9: `app/dashboard/admin/page.tsx`**
**Changes:**
- Line 34: `BALIK.LAGI x Barbershop Kedungrandu` → `BALIK.LAGI x Barbershop Kedungrandu`
- Line 88: `© 2025 BALIK.LAGI x Barbershop Kedungrandu` → `© 2025 BALIK.LAGI x Barbershop Kedungrandu`

**Impact**: Admin dashboard

---

### **GROUP 3: Landing Page & Library** 🏠

#### **File 10: `app/page.tsx`**
**Changes:**
- Line 307: `© 2025 BALIK.LAGI x Barbershop Kedungrandu` → `© 2025 BALIK.LAGI x Barbershop Kedungrandu`

**Impact**: Homepage footer

---

#### **File 11: `lib/analytics/customerPrediction.ts`**
**Changes:**
- Line 3: `Core differentiator for BALIK.LAGI x Barbershop` → `Core differentiator for BALIK.LAGI x Barbershop`

**Impact**: Code comment (documentation)

---

## 🔧 IMPLEMENTATION STEPS

### **STEP 1: Setup Environment** ✅
- [x] Clone repository
- [x] Install dependencies
- [x] Analyze current state

### **STEP 2: Execute Re-branding** ⏳
- [ ] Update all 11 files with brand changes
- [ ] Verify no broken references
- [ ] Update access key comments if needed

### **STEP 3: Configuration** ⏳
- [ ] Create `.env.local` with Supabase credentials
- [ ] Test Supabase connection
- [ ] Verify database schema

### **STEP 4: Build & Test** ⏳
- [ ] Run `npm run build`
- [ ] Fix any build errors
- [ ] Test all pages load correctly
- [ ] Verify brand consistency

### **STEP 5: Git Commit** ⏳
- [ ] Stage all changes: `git add .`
- [ ] Commit: `git commit -m "Week 1: Complete re-branding BALIK.LAGI → BALIK.LAGI"`
- [ ] Verify commit success

### **STEP 6: GitHub Push** ⏳
- [ ] Setup GitHub authentication (`setup_github_environment`)
- [ ] Push to main branch: `git push origin main`
- [ ] Verify on GitHub

---

## 🎯 SUCCESS CRITERIA

### **Week 1 Complete When:**
1. ✅ All 15 "BALIK.LAGI" references replaced with "BALIK.LAGI"
2. ✅ Build passes without errors
3. ✅ All pages accessible and functional
4. ✅ Brand consistency across all UI
5. ✅ Changes committed to Git
6. ✅ Changes pushed to GitHub
7. ✅ Documentation updated

---

## 📊 METRICS

### **Code Changes**
```
Total Files Modified: 11 files
Total Lines Changed: ~15-20 lines
Impact: Frontend only (no database changes)
Risk Level: LOW (simple text replacement)
```

### **Time Estimate**
```
File Updates: 30 minutes
Testing: 15 minutes
Documentation: 15 minutes
Git & Push: 10 minutes
---
Total: ~1 hour
```

---

## ⚠️ IMPORTANT NOTES

### **What NOT to Change**
- ❌ Do NOT change database table names
- ❌ Do NOT change API endpoint URLs
- ❌ Do NOT change Supabase project name
- ❌ Do NOT change existing access key values (backward compatibility)

### **What to Keep**
- ✅ Keep all technical infrastructure as-is
- ✅ Keep database schema unchanged
- ✅ Keep API logic unchanged
- ✅ Keep authentication flow unchanged

### **What Changes**
- ✅ UI text & branding only
- ✅ Comments & documentation
- ✅ User-facing content

---

## 🚀 NEXT STEPS (After Week 1)

### **Week 2: Visual Identity**
- [ ] Update color scheme (warm browns, beige, deep red)
- [ ] New logo design
- [ ] Landing page redesign
- [ ] Dashboard header improvements

### **Week 3: Documentation**
- [ ] Complete modular documentation
- [ ] API documentation
- [ ] User guides
- [ ] Onboarding flow

### **Week 4: Launch Prep**
- [ ] Domain migration (baliklagi.id)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Pilot customer onboarding

---

## 📝 CHECKLIST SUMMARY

### **Pre-Implementation**
- [x] ✅ Repository cloned
- [x] ✅ Dependencies installed
- [x] ✅ Current state analyzed
- [x] ✅ Implementation plan created

### **Implementation**
- [ ] ⏳ Execute file updates (11 files)
- [ ] ⏳ Configure environment variables
- [ ] ⏳ Build & test
- [ ] ⏳ Git commit
- [ ] ⏳ GitHub push

### **Post-Implementation**
- [ ] ⏳ Verify deployment
- [ ] ⏳ Update project documentation
- [ ] ⏳ Share progress with team

---

## 🎉 READY TO EXECUTE!

**All planning complete. Ready untuk eksekusi Week 1 re-branding!**

**Bismillah, mari kita mulai! 🚀**

---

**Created**: 29 Desember 2025  
**Status**: Ready for Implementation  
**Risk Level**: LOW  
**Estimated Time**: ~1 hour  
**Impact**: HIGH (brand transformation)
