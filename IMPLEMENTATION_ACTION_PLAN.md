# 🚀 BALIK.LAGI - IMPLEMENTATION ACTION PLAN
**Tanggal**: 30 Desember 2025  
**Status**: 🎯 Ready to Execute  
**Approach**: Pelan tapi pasti, modular, production-ready

---

## 📋 EXECUTIVE SUMMARY

### **Tujuan Rebranding**
Mentransformasi "OASIS BI PRO" (technical SaaS) menjadi **"BALIK.LAGI"** (warm, story-driven ecosystem) yang terinspirasi dari Fresha, dengan fokus pada:

1. **User Experience yang Hangat** - Bukan aplikasi korporat, tapi teman barber & customer
2. **Visual Identity Konsisten** - Warm brown palette, Playfair Display + Inter fonts
3. **Functionality yang Solid** - Booking flow smooth, real-time updates, loyalty gamification
4. **Scalability untuk Future** - Modular architecture, well-documented, maintainable

### **Key Constraints**
- ✅ **No Breaking Changes** - Existing users tidak terganggu
- ✅ **Database Migration Safe** - Backward compatible
- ✅ **Zero Downtime** - Gradual rollout, not big bang
- ✅ **Budget Conscious** - Use existing infrastructure (Supabase, Vercel)

---

## 🎯 FASE 1: FOUNDATION & DESIGN SYSTEM (Week 1-2)

### **Day 1-2: Design System Setup**

#### **Task 1.1: Font Setup**
```typescript
// app/layout.tsx - Add Google Fonts
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

// Update <html> tag
<html lang="id" className={`${playfair.variable} ${inter.variable}`}>
```

#### **Task 1.2: TailwindCSS Theme Extension**
```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF8F0',
          100: '#FFEEDD',
          500: '#D4A574',
          700: '#8B6F47',
          900: '#4A3621',
        },
        accent: {
          red: '#B8463F',
          green: '#2D6A4F',
          blue: '#264653',
        },
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
};
```

#### **Task 1.3: Global CSS Variables**
```css
/* app/globals.css - Add after Tailwind directives */
:root {
  /* Colors */
  --color-primary-50: #FFF8F0;
  --color-primary-100: #FFEEDD;
  --color-primary-500: #D4A574;
  --color-primary-700: #8B6F47;
  --color-primary-900: #4A3621;
  
  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #4A3621 0%, #8B6F47 50%, #D4A574 100%);
  --gradient-card: linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 100%);
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
}
```

---

### **Day 3-5: UI Component Library**

#### **Task 2.1: Button Components**
```typescript
// components/ui/Button/Primary.tsx
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  variant = 'solid',
  size = 'md',
  ...props
}) => {
  const baseClasses = "font-body font-semibold rounded-lg transition-all duration-300";
  
  const variantClasses = {
    solid: "bg-accent-red text-white hover:bg-accent-red/90 hover:shadow-lg",
    outline: "border-2 border-primary-500 text-primary-700 hover:bg-primary-50",
    ghost: "text-primary-700 hover:bg-primary-50"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        props.fullWidth && "w-full",
        props.disabled && "opacity-50 cursor-not-allowed"
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### **Task 2.2: Card Components**
```typescript
// components/ui/Card/Base.tsx
interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'featured' | 'stats';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'base',
  padding = 'md',
  className
}) => {
  const baseClasses = "rounded-xl shadow-sm transition-all duration-300";
  
  const variantClasses = {
    base: "bg-white border border-gray-200 hover:shadow-md",
    featured: "bg-gradient-to-br from-white to-primary-50 border-2 border-primary-500",
    stats: "bg-primary-50 border border-primary-200"
  };
  
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };
  
  return (
    <div className={clsx(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};
```

#### **Task 2.3: Badge Components**
```typescript
// components/ui/Badge/Status.tsx
interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Dikonfirmasi' },
    'in-progress': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sedang Dikerjakan' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' }
  };
  
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full font-medium',
      config.bg,
      config.text,
      sizeClass
    )}>
      {config.label}
    </span>
  );
};
```

---

### **Day 6-8: Landing Page Redesign**

#### **Task 3.1: Hero Section**
```typescript
// app/(marketing)/page.tsx
import { Scissors, TrendingUp, Users, Sparkles } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/Button/Primary';

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--gradient-hero)] text-white py-20 px-6">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-96 h-96 -top-48 -left-48 bg-white rounded-full blur-3xl"></div>
          <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-white rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto max-w-6xl text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
            Sekali Cocok, <br />
            <span className="text-primary-100">Pengen Balik Lagi</span>
          </h1>
          
          <p className="font-body text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Platform SaaS untuk barbershop yang bikin pelanggan loyal dan capster produktif
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <PrimaryButton size="lg" variant="solid">
              <Users className="inline mr-2" size={20} />
              Register sebagai Customer
            </PrimaryButton>
            <PrimaryButton size="lg" variant="outline">
              <Scissors className="inline mr-2" size={20} />
              Register sebagai Capster
            </PrimaryButton>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-primary-100">
            <div className="flex items-center space-x-2">
              <Users size={24} />
              <span className="font-semibold">1,234+ Customers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Scissors size={24} />
              <span className="font-semibold">45+ Capsters</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp size={24} />
              <span className="font-semibold">98% Retention Rate</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section - TBD */}
      {/* How It Works Section - TBD */}
      {/* Testimonials Section - TBD */}
    </div>
  );
}
```

#### **Task 3.2: Features Section**
```typescript
// Add after Hero Section
<section className="py-20 px-6 bg-white">
  <div className="container mx-auto max-w-6xl">
    <h2 className="font-heading text-4xl font-bold text-center text-gray-900 mb-12">
      Kenapa Memilih <span className="text-primary-700">BALIK.LAGI</span>?
    </h2>
    
    <div className="grid md:grid-cols-3 gap-8">
      {/* Feature 1 - Customer */}
      <Card variant="base" padding="lg">
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
          <Users className="text-primary-700" size={24} />
        </div>
        <h3 className="font-heading text-xl font-semibold text-gray-900 mb-3">
          Untuk Customer
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li>✅ Booking online mudah & cepat</li>
          <li>✅ Loyalty rewards (4 visits = 1 free)</li>
          <li>✅ History & favorit tersimpan</li>
          <li>✅ Real-time status updates</li>
        </ul>
      </Card>
      
      {/* Feature 2 - Capster */}
      <Card variant="base" padding="lg">
        <div className="w-12 h-12 bg-accent-blue/10 rounded-lg flex items-center justify-center mb-4">
          <Scissors className="text-accent-blue" size={24} />
        </div>
        <h3 className="font-heading text-xl font-semibold text-gray-900 mb-3">
          Untuk Capster
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li>✅ Queue management real-time</li>
          <li>✅ Performance tracking</li>
          <li>✅ Customer insights & preferences</li>
          <li>✅ Earning reports</li>
        </ul>
      </Card>
      
      {/* Feature 3 - Owner */}
      <Card variant="base" padding="lg">
        <div className="w-12 h-12 bg-accent-green/10 rounded-lg flex items-center justify-center mb-4">
          <TrendingUp className="text-accent-green" size={24} />
        </div>
        <h3 className="font-heading text-xl font-semibold text-gray-900 mb-3">
          Untuk Owner
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li>✅ Business intelligence dashboard</li>
          <li>✅ Revenue tracking & forecasting</li>
          <li>✅ Actionable customer insights</li>
          <li>✅ Multi-capster monitoring</li>
        </ul>
      </Card>
    </div>
  </div>
</section>
```

---

### **Day 9-10: Dashboard Headers Update**

#### **Task 4.1: Personalized Greeting**
```typescript
// lib/utils/greeting.ts
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

export const getContextualMessage = (userName: string, role: string) => {
  const greeting = getGreeting();
  
  const messages = {
    customer: [
      `${greeting}, ${userName}! Sudah waktunya potong lagi?`,
      `Halo ${userName}! Ada jadwal untuk hari ini?`,
      `Selamat datang kembali, ${userName}! Mau booking kapan?`
    ],
    capster: [
      `${greeting}, ${userName}! Siap melayani hari ini?`,
      `Halo ${userName}! Mari kita mulai hari dengan semangat!`,
      `Semangat ${userName}! Ada ${Math.floor(Math.random() * 5) + 1} booking hari ini.`
    ],
    admin: [
      `${greeting}, ${userName}! Dashboard business intelligence Anda siap.`,
      `Halo ${userName}! Lihat performa barbershop Anda hari ini.`
    ]
  };
  
  const roleMessages = messages[role] || messages.customer;
  return roleMessages[Math.floor(Math.random() * roleMessages.length)];
};
```

#### **Task 4.2: Customer Dashboard Header**
```typescript
// app/dashboard/customer/page.tsx - Update header
import { getGreeting, getContextualMessage } from '@/lib/utils/greeting';

export default function CustomerDashboard() {
  const { user, profile } = useAuth(); // Assuming you have auth context
  const userName = profile?.full_name?.split(' ')[0] || 'Sobat';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* New Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="container mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-semibold text-gray-900 mb-2">
            {getGreeting()}, {userName} 👋
          </h1>
          <p className="font-body text-gray-600">
            {getContextualMessage(userName, 'customer')}
          </p>
        </div>
      </div>
      
      {/* Rest of dashboard content */}
      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Dashboard sections */}
      </div>
    </div>
  );
}
```

---

## 🎯 FASE 2: BOOKING FLOW REDESIGN (Week 3-4)

### **Day 11-14: Multi-Step Booking Component**

#### **Task 5.1: Booking Flow State Management**
```typescript
// lib/hooks/useBookingFlow.ts
import { useState } from 'react';

interface BookingState {
  step: number;
  service: Service | null;
  capster: Capster | null;
  dateTime: Date | null;
  notes: string;
}

export const useBookingFlow = () => {
  const [state, setState] = useState<BookingState>({
    step: 1,
    service: null,
    capster: null,
    dateTime: null,
    notes: ''
  });
  
  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setState(prev => ({ ...prev, step: prev.step - 1 }));
  const setService = (service: Service) => setState(prev => ({ ...prev, service }));
  const setCapster = (capster: Capster) => setState(prev => ({ ...prev, capster }));
  const setDateTime = (dateTime: Date) => setState(prev => ({ ...prev, dateTime }));
  const setNotes = (notes: string) => setState(prev => ({ ...prev, notes }));
  
  const canProceed = () => {
    switch (state.step) {
      case 1: return state.service !== null;
      case 2: return state.capster !== null;
      case 3: return state.dateTime !== null;
      default: return false;
    }
  };
  
  return {
    state,
    nextStep,
    prevStep,
    setService,
    setCapster,
    setDateTime,
    setNotes,
    canProceed
  };
};
```

#### **Task 5.2: Service Selector Component**
```typescript
// components/booking/ServiceSelector.tsx
import { Card } from '@/components/ui/Card/Base';
import { Badge } from '@/components/ui/Badge/Status';

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onSelectService
}) => {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-semibold text-gray-900">
        Pilih Layanan
      </h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            variant={selectedService?.id === service.id ? 'featured' : 'base'}
            padding="md"
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onSelectService(service)}
          >
            {/* Service Tier Badge */}
            {service.tier && (
              <Badge 
                tier={service.tier}
                size="sm"
                className="mb-3"
              />
            )}
            
            {/* Service Icon/Image */}
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Scissors className="text-primary-700" size={32} />
            </div>
            
            {/* Service Details */}
            <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">
              {service.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {service.description}
            </p>
            
            {/* Price & Duration */}
            <div className="flex justify-between items-center">
              <span className="font-body font-bold text-primary-700 text-lg">
                Rp {service.price.toLocaleString('id-ID')}
              </span>
              <span className="text-sm text-gray-500">
                {service.duration_minutes} menit
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

---

## 🛠️ TECHNICAL TASKS CHECKLIST

### **Week 1: Foundation**
- [ ] **Day 1**: Setup fonts (Playfair Display, Inter)
- [ ] **Day 1**: Configure TailwindCSS theme
- [ ] **Day 1**: Add global CSS variables
- [ ] **Day 2**: Build Button components (Primary, Secondary, Ghost)
- [ ] **Day 2**: Build Card components (Base, Featured, Stats)
- [ ] **Day 2**: Build Badge components (Status, Loyalty, Role)
- [ ] **Day 3**: Create marketing landing page structure
- [ ] **Day 3**: Implement Hero section with gradient
- [ ] **Day 4**: Implement Features section (3-column grid)
- [ ] **Day 4**: Implement How It Works section
- [ ] **Day 5**: Update Customer dashboard header
- [ ] **Day 5**: Update Capster dashboard header
- [ ] **Day 5**: Update Admin dashboard header
- [ ] **Day 6**: Add personalized greeting logic
- [ ] **Day 7**: Testing & bug fixes

### **Week 2: Booking Flow**
- [ ] **Day 8**: Create booking flow state management
- [ ] **Day 9**: Build ServiceSelector component
- [ ] **Day 10**: Build CapsterSelector component
- [ ] **Day 11**: Build DateTimePicker component
- [ ] **Day 12**: Build BookingSummary component
- [ ] **Day 13**: Integrate booking flow with API
- [ ] **Day 14**: Testing booking flow end-to-end

### **Week 3: Enhancements & Testing**
- [ ] **Day 15**: Setup Supabase Realtime subscriptions
- [ ] **Day 16**: Implement real-time booking updates
- [ ] **Day 17**: Build loyalty tracker component
- [ ] **Day 18**: Add toast notifications
- [ ] **Day 19**: Cross-browser testing
- [ ] **Day 20**: Mobile responsiveness testing
- [ ] **Day 21**: Performance optimization

---

## 📊 PROGRESS TRACKING

### **Milestones**
```yaml
Week 1 Complete:
  - ✅ Design system setup
  - ✅ UI component library
  - ✅ Landing page redesign
  - ✅ Dashboard headers update

Week 2 Complete:
  - ✅ Booking flow redesign
  - ✅ Real-time updates
  - ✅ Loyalty enhancement

Week 3 Complete:
  - ✅ Testing & bug fixes
  - ✅ Documentation update
  - ✅ Production deployment
```

### **Success Criteria**
- ✅ Build passes without errors
- ✅ All features work as expected
- ✅ Mobile responsive (100%)
- ✅ Lighthouse score > 85
- ✅ User feedback > 4/5

---

## 🚀 DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [ ] Run `npm run build` locally (successful)
- [ ] Test all features on localhost:3000
- [ ] Check mobile responsiveness
- [ ] Verify environment variables

### **Deployment Steps**
```bash
# 1. Commit changes
git add .
git commit -m "feat: Phase 1 rebranding - Design system & landing page"

# 2. Push to GitHub (using PAT)
git push origin main

# 3. Vercel auto-deploys from GitHub
# Or manual deploy: vercel --prod

# 4. Verify production URL
# https://saasxbarbershop.vercel.app
```

### **Post-Deployment**
- [ ] Test production URL
- [ ] Check Supabase connection
- [ ] Verify all features work
- [ ] Monitor error logs
- [ ] Update documentation

---

## 📝 NOTES & CONSIDERATIONS

### **Best Practices**
1. **Commit Often**: Setiap fitur selesai = commit
2. **Test Before Push**: Selalu test locally sebelum push
3. **Document Changes**: Update README.md setiap milestone
4. **Backup Database**: Supabase auto-backup, tapi selalu verify

### **Risk Mitigation**
1. **Breaking Changes**: Always test on staging first
2. **Database Migration**: Use transactions, rollback ready
3. **User Impact**: Gradual rollout, monitor feedback
4. **Performance**: Use Lighthouse, optimize assets

---

**Action Plan Created**: 30 Desember 2025  
**Status**: 🎯 Ready for Execution  
**Next Step**: Begin Week 1 - Day 1 implementation 🚀
