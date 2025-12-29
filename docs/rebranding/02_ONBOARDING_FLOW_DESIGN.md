# 🌟 ONBOARDING FLOW DESIGN: BALIK.LAGI

**Inspired by**: Fresha Partner Onboarding  
**Philosophy**: "Bikin mudah, bukan bikin bingung"  
**Target**: First-time user dapat setup barbershop dalam < 10 menit  
**Date**: 29 Desember 2025

---

## 🎯 PHILOSOPHY & PRINCIPLES

### **Core Principles**
```
1. PROGRESSIVE DISCLOSURE
   - Show one step at a time
   - Don't overwhelm with all features upfront
   
2. CONTEXT-AWARE GUIDANCE
   - Explain WHY setiap step penting
   - Show benefit, bukan sekadar instruksi
   
3. ESCAPE HATCHES
   - User bisa skip atau come back later
   - No dead ends
   
4. CELEBRATION OF PROGRESS
   - Show progress bar
   - Celebrate milestones
   - Make user feel accomplished
   
5. WARM & FRIENDLY TONE
   - "Mari kita setup bersama" bukan "Complete the form"
   - Use emojis (tidak berlebihan)
   - Indonesian natural language
```

---

## 🏪 BARBERSHOP OWNER ONBOARDING

### **Overview**
```
Flow: 5 Steps, ~8-10 minutes
Completion Rate Target: >80%
Drop-off Prevention: Save progress, allow skip
```

### **STEP 1: WELCOME & ROLE SELECTION** 👋

**Goal**: Sambut hangat + confirm role

```tsx
<WelcomeScreen>
  <Logo src="/logo-balik-lagi.svg" />
  
  <Headline>
    Selamat Datang di BALIK.LAGI! 🎉
  </Headline>
  
  <Subheading>
    Mari kita setup barbershop Anda dalam beberapa langkah mudah.
    Siap? Let's go!
  </Subheading>
  
  <RoleConfirmation>
    <p>Anda mendaftar sebagai: <strong>Barbershop Owner</strong></p>
    <p className="text-sm text-muted">
      (Capster atau Customer? <Link>Klik di sini</Link>)
    </p>
  </RoleConfirmation>
  
  <ProgressIndicator current={1} total={5} />
  
  <CTAButton>Mulai Setup →</CTAButton>
  
  <SkipLink>Nanti saja, masuk ke dashboard</SkipLink>
</WelcomeScreen>
```

**Key Features**:
- ✅ Warm welcome message
- ✅ Clear role confirmation
- ✅ Progress indicator (5 steps shown)
- ✅ Escape hatch (skip untuk nanti)
- ✅ Estimated time: "~8 menit"

---

### **STEP 2: BUSINESS INFORMATION** 🏪

**Goal**: Collect basic barbershop info

```tsx
<BusinessInfoStep>
  <StepHeader>
    <Title>Ceritakan Tentang Barbershop Anda</Title>
    <Subtitle>
      Informasi ini akan membantu kami personalisasi pengalaman Anda
    </Subtitle>
  </StepHeader>
  
  <Form>
    <FormField required>
      <Label>Nama Barbershop</Label>
      <Input 
        placeholder="Contoh: BOZQ Barbershop" 
        autoFocus
      />
      <Helper>Ini akan ditampilkan ke customer Anda</Helper>
    </FormField>
    
    <FormField required>
      <Label>Jumlah Capster/Barber</Label>
      <Select>
        <Option>1-2 capster</Option>
        <Option>3-5 capster</Option>
        <Option>6-10 capster</Option>
        <Option>10+ capster</Option>
      </Select>
      <Helper>Kami akan adjust sistem sesuai skala barbershop Anda</Helper>
    </FormField>
    
    <FormField required>
      <Label>Lokasi</Label>
      <Input 
        type="text"
        placeholder="Kota, Kecamatan"
      />
      <Helper>Customer akan lebih mudah menemukan Anda</Helper>
    </FormField>
    
    <FormField>
      <Label>Nomor WhatsApp (opsional)</Label>
      <Input 
        type="tel"
        placeholder="08123456789"
      />
      <Helper>Untuk notifikasi booking via WhatsApp</Helper>
    </FormField>
  </Form>
  
  <ProgressIndicator current={2} total={5} />
  
  <Actions>
    <ButtonSecondary>← Kembali</ButtonSecondary>
    <ButtonPrimary>Lanjut →</ButtonPrimary>
  </Actions>
</BusinessInfoStep>
```

**Validation**:
- Nama barbershop: Required, min 3 chars
- Jumlah capster: Required (affects pricing tier later)
- Lokasi: Required untuk discovery
- WhatsApp: Optional (untuk future WA integration)

**Why This Works**:
- Only ask essentials (4 fields, 3 required)
- Every field has "why it matters" explanation
- Auto-save draft (no data loss if user leaves)

---

### **STEP 3: SERVICES SETUP** ✂️

**Goal**: Define services catalog

```tsx
<ServicesSetupStep>
  <StepHeader>
    <Title>Layanan Apa yang Anda Tawarkan?</Title>
    <Subtitle>
      Pilih dari template atau tambahkan custom service
    </Subtitle>
  </StepHeader>
  
  <ServiceTemplates>
    <TemplateCard selected>
      <Icon>✂️</Icon>
      <Name>Cukur Rambut</Name>
      <Price>Rp 25.000</Price>
      <Duration>30 menit</Duration>
      <Badge>Popular</Badge>
    </TemplateCard>
    
    <TemplateCard>
      <Icon>🪒</Icon>
      <Name>Shaving</Name>
      <Price>Rp 15.000</Price>
      <Duration>15 menit</Duration>
    </TemplateCard>
    
    <TemplateCard>
      <Icon>💆</Icon>
      <Name>Facial</Name>
      <Price>Rp 50.000</Price>
      <Duration>45 menit</Duration>
    </TemplateCard>
    
    <TemplateCard>
      <Icon>🎨</Icon>
      <Name>Hair Coloring</Name>
      <Price>Rp 100.000</Price>
      <Duration>60 menit</Duration>
    </TemplateCard>
  </ServiceTemplates>
  
  <CustomService>
    <ButtonOutline>+ Tambah Custom Service</ButtonOutline>
  </CustomService>
  
  <SelectedServices>
    <h4>Layanan Terpilih (2):</h4>
    <ServiceList>
      <ServiceItem>
        ✂️ Cukur Rambut - Rp 25.000
        <EditButton size="sm" />
      </ServiceItem>
      <ServiceItem>
        🪒 Shaving - Rp 15.000
        <EditButton size="sm" />
      </ServiceItem>
    </ServiceList>
  </SelectedServices>
  
  <Helper>
    💡 Tip: Mulai dengan 2-3 layanan utama. 
    Anda bisa tambah layanan lain kapan saja.
  </Helper>
  
  <ProgressIndicator current={3} total={5} />
  
  <Actions>
    <ButtonSecondary>← Kembali</ButtonSecondary>
    <ButtonPrimary disabled={selectedServices.length === 0}>
      Lanjut →
    </ButtonPrimary>
  </Actions>
</ServicesSetupStep>
```

**Features**:
- ✅ Pre-filled templates (faster setup)
- ✅ Editable prices (sesuaikan dengan lokasi)
- ✅ Visual icons (easier to scan)
- ✅ Custom service option (flexibility)
- ✅ Minimum 1 service required

**Smart Defaults**:
- Auto-select "Cukur Rambut" (most common)
- Price suggestions based on location (future)
- Duration estimates (can be edited)

---

### **STEP 4: INVITE YOUR TEAM** 👥

**Goal**: Setup capster accounts

```tsx
<TeamInviteStep>
  <StepHeader>
    <Title>Undang Capster/Barber Anda</Title>
    <Subtitle>
      Setiap capster akan mendapat akun sendiri untuk kelola booking
    </Subtitle>
  </StepHeader>
  
  <InviteOptions>
    <OptionCard active>
      <Radio checked />
      <Icon>🔑</Icon>
      <Title>Generate Access Key</Title>
      <Description>
        Capster daftar sendiri dengan access key
      </Description>
      <Badge>Recommended</Badge>
    </OptionCard>
    
    <OptionCard>
      <Radio />
      <Icon>📧</Icon>
      <Title>Email Invitation</Title>
      <Description>
        Kirim undangan langsung ke email capster
      </Description>
      <Badge>Coming Soon</Badge>
    </OptionCard>
  </InviteOptions>
  
  <AccessKeyGeneration>
    <h4>Generate Access Key untuk Capster</h4>
    
    <KeyPreview>
      <Code>CAPSTER_B0ZD_ACCESS_1</Code>
      <CopyButton>Copy</CopyButton>
    </KeyPreview>
    
    <Instructions>
      <p><strong>Cara mengundang capster:</strong></p>
      <ol>
        <li>Copy access key di atas</li>
        <li>Share via WhatsApp ke capster Anda</li>
        <li>Minta mereka register di <Link>baliklagi.id/register/capster</Link></li>
        <li>Paste access key saat registrasi</li>
      </ol>
    </Instructions>
    
    <WhatsAppTemplate>
      <h5>Template WhatsApp Message:</h5>
      <TextArea readOnly value={`
Halo! 👋

Kita sekarang pakai sistem baru untuk kelola booking: BALIK.LAGI

Tolong register ya di link ini:
https://baliklagi.id/register/capster

Access Key: CAPSTER_B0ZD_ACCESS_1

Nanti kamu bisa lihat queue customer, update status booking, dan tracking performa kamu.

Thanks! 🙏
      `} />
      <CopyButton>Copy Template</CopyButton>
    </WhatsAppTemplate>
  </AccessKeyGeneration>
  
  <Helper>
    💡 Anda bisa skip step ini dulu dan invite capster nanti dari dashboard
  </Helper>
  
  <ProgressIndicator current={4} total={5} />
  
  <Actions>
    <ButtonSecondary>← Kembali</ButtonSecondary>
    <ButtonPrimary>Lanjut →</ButtonPrimary>
    <LinkButton>Skip, invite nanti</LinkButton>
  </Actions>
</TeamInviteStep>
```

**Why This Works**:
- Simple access key method (no email verification needed yet)
- WhatsApp-first (Indonesia market fit)
- Ready-to-use template (copy-paste)
- Clear step-by-step instructions
- Allow skip (not blocking)

---

### **STEP 5: SUCCESS & FIRST BOOKING** 🎉

**Goal**: Celebrate + guide to first booking

```tsx
<SuccessStep>
  <Confetti />
  
  <SuccessIcon>✅</SuccessIcon>
  
  <Headline>
    Setup Selesai! Barbershop Anda Siap Beroperasi 🎉
  </Headline>
  
  <Subheading>
    Selamat! {businessName} sekarang sudah terdaftar di BALIK.LAGI
  </Subheading>
  
  <SetupSummary>
    <SummaryCard>
      <Icon>🏪</Icon>
      <Label>Barbershop</Label>
      <Value>{businessName}</Value>
    </SummaryCard>
    
    <SummaryCard>
      <Icon>✂️</Icon>
      <Label>Layanan</Label>
      <Value>{servicesCount} layanan</Value>
    </SummaryCard>
    
    <SummaryCard>
      <Icon>👥</Icon>
      <Label>Capster</Label>
      <Value>{capstersCount || 'Belum ada'}</Value>
    </SummaryCard>
  </SetupSummary>
  
  <NextSteps>
    <h3>Apa Selanjutnya?</h3>
    
    <StepCard>
      <Number>1</Number>
      <Content>
        <Title>Tambahkan Capster (jika belum)</Title>
        <Description>
          Share access key ke tim Anda
        </Description>
        <Link>Invite Capster →</Link>
      </Content>
    </StepCard>
    
    <StepCard>
      <Number>2</Number>
      <Content>
        <Title>Test Booking Pertama</Title>
        <Description>
          Coba buat booking untuk testing
        </Description>
        <Link>Buat Test Booking →</Link>
      </Content>
    </StepCard>
    
    <StepCard>
      <Number>3</Number>
      <Content>
        <Title>Lihat Dashboard</Title>
        <Description>
          Explore fitur analytics & reports
        </Description>
        <Link>Buka Dashboard →</Link>
      </Content>
    </StepCard>
  </NextSteps>
  
  <VideoTutorial>
    <h4>📺 Tutorial 3 Menit: Cara Pakai BALIK.LAGI</h4>
    <VideoEmbed src="..." />
  </VideoTutorial>
  
  <CTAButton size="lg">
    Masuk ke Dashboard →
  </CTAButton>
  
  <SupportLink>
    Butuh bantuan? <Link>Chat dengan kami</Link>
  </SupportLink>
</SuccessStep>
```

**Key Features**:
- ✅ Celebration moment (confetti animation)
- ✅ Summary of what was setup
- ✅ Clear next steps (1, 2, 3)
- ✅ Video tutorial option
- ✅ Support access

---

## 👤 CUSTOMER ONBOARDING

### **Overview**
```
Flow: 3 Steps, ~3-5 minutes
Focus: Quick booking experience
Goal: First booking within 5 minutes
```

### **STEP 1: WELCOME & QUICK INTRO** 👋

```tsx
<CustomerWelcome>
  <Logo />
  
  <Headline>
    Selamat Datang! 🎉
  </Headline>
  
  <Subheading>
    Booking barbershop jadi lebih mudah dengan BALIK.LAGI
  </Subheading>
  
  <Benefits>
    <BenefitItem>
      <Icon>📅</Icon>
      <Text>Booking online, no antri</Text>
    </BenefitItem>
    
    <BenefitItem>
      <Icon>🎁</Icon>
      <Text>Loyalty rewards setiap kunjungan</Text>
    </BenefitItem>
    
    <BenefitItem>
      <Icon>📊</Icon>
      <Text>Tracking history & preferensi</Text>
    </BenefitItem>
  </Benefits>
  
  <CTAButton>Mulai Booking →</CTAButton>
</CustomerWelcome>
```

---

### **STEP 2: FIRST BOOKING EXPERIENCE** ✂️

```tsx
<BookingFlow>
  <ProgressSteps>
    <Step active>1. Pilih Barbershop</Step>
    <Step>2. Pilih Capster</Step>
    <Step>3. Konfirmasi</Step>
  </ProgressSteps>
  
  {/* Step 1: Select Barbershop */}
  <BarbershopSelection>
    <SearchBar placeholder="Cari barbershop terdekat..." />
    
    <BarbershopCard featured>
      <Badge>Pilot Partner</Badge>
      <Image src="/bozq-logo.jpg" />
      <Name>BOZQ Barbershop</Name>
      <Location>📍 Jakarta Selatan</Location>
      <Rating>⭐ 4.9 (127 reviews)</Rating>
      <Services>Cukur Rambut, Shaving, Facial</Services>
      <CTAButton>Pilih →</CTAButton>
    </BarbershopCard>
  </BarbershopSelection>
  
  {/* Step 2: Select Capster & Service */}
  <CapsterSelection>
    <ServiceFilter>
      <Chip active>Semua</Chip>
      <Chip>Cukur Rambut</Chip>
      <Chip>Shaving</Chip>
      <Chip>Facial</Chip>
    </ServiceFilter>
    
    <CapsterCard>
      <Avatar src="/capster-1.jpg" />
      <Name>Mas Agus</Name>
      <Specialty>Specialist: Fade Haircut</Specialty>
      <Rating>⭐ 4.9</Rating>
      <NextAvailable>Next: Hari ini, 14:00</NextAvailable>
      <SelectButton>Pilih Mas Agus</SelectButton>
    </CapsterCard>
  </CapsterSelection>
  
  {/* Step 3: Confirmation */}
  <BookingConfirmation>
    <Summary>
      <Item>
        <Label>Barbershop</Label>
        <Value>BOZQ Barbershop</Value>
      </Item>
      <Item>
        <Label>Capster</Label>
        <Value>Mas Agus</Value>
      </Item>
      <Item>
        <Label>Layanan</Label>
        <Value>Cukur Rambut</Value>
      </Item>
      <Item>
        <Label>Waktu</Label>
        <Value>Hari ini, 14:00</Value>
      </Item>
      <Item>
        <Label>Harga</Label>
        <Value>Rp 25.000</Value>
      </Item>
    </Summary>
    
    <Notes>
      <Label>Catatan (opsional)</Label>
      <TextArea placeholder="Ada request khusus? Tulis di sini..." />
    </Notes>
    
    <CTAButton size="lg">
      Konfirmasi Booking →
    </CTAButton>
  </BookingConfirmation>
</BookingFlow>
```

---

### **STEP 3: BOOKING SUCCESS & NEXT STEPS** ✅

```tsx
<BookingSuccess>
  <SuccessIcon>✅</SuccessIcon>
  
  <Headline>
    Booking Berhasil! 🎉
  </Headline>
  
  <BookingSummary>
    <QRCode value={bookingId} />
    <BookingNumber>#{bookingId}</BookingNumber>
    <Details>
      <p><strong>BOZQ Barbershop</strong></p>
      <p>Mas Agus - Cukur Rambut</p>
      <p>Hari ini, 14:00</p>
    </Details>
  </BookingSummary>
  
  <Actions>
    <AddToCalendar>
      📅 Tambah ke Kalender
    </AddToCalendar>
    
    <ShareButton>
      📤 Share ke WhatsApp
    </ShareButton>
  </Actions>
  
  <LoyaltyProgress>
    <Title>Progress Loyalty Anda</Title>
    <ProgressBar value={1} max={4} />
    <Text>1/4 kunjungan - 3 lagi dapat gratis! 🎁</Text>
  </LoyaltyProgress>
  
  <NextSteps>
    <h4>Yang Perlu Anda Tahu:</h4>
    <ul>
      <li>Datang 5-10 menit sebelum waktu booking</li>
      <li>Tunjukkan QR code atau nomor booking</li>
      <li>Reschedule? Bisa diubah sampai 2 jam sebelumnya</li>
    </ul>
  </NextSteps>
  
  <CTAButton>Lihat Dashboard Saya →</CTAButton>
</BookingSuccess>
```

---

## 💈 CAPSTER ONBOARDING

### **Quick Onboarding** (Simplified)

```tsx
<CapsterOnboarding>
  <Step1>
    <Welcome>
      Selamat Datang, Capster! 👋
    </Welcome>
    
    <Intro>
      BALIK.LAGI akan membantu Anda:
      - Kelola queue booking dengan mudah
      - Tracking performa Anda
      - Insight customer preferences
    </Intro>
    
    <ProfileSetup>
      <Upload type="photo">Upload Foto Profil</Upload>
      <Input name="specialty">Specialty Anda?</Input>
      <Input name="experience">Pengalaman (tahun)</Input>
    </ProfileSetup>
  </Step1>
  
  <Step2>
    <Tutorial>
      <h3>Tutorial Singkat:</h3>
      
      <TutorialCard>
        <Icon>📋</Icon>
        <Title>Lihat Queue Hari Ini</Title>
        <Description>Dashboard menampilkan semua booking Anda</Description>
      </TutorialCard>
      
      <TutorialCard>
        <Icon>✅</Icon>
        <Title>Update Status Booking</Title>
        <Description>Pending → Confirmed → In Progress → Completed</Description>
      </TutorialCard>
      
      <TutorialCard>
        <Icon>📊</Icon>
        <Title>Tracking Performa</Title>
        <Description>Lihat revenue, rating, dan jumlah customer</Description>
      </TutorialCard>
    </Tutorial>
  </Step2>
  
  <Step3>
    <Success>
      Setup Selesai! 🎉
      <CTAButton>Mulai Kerja →</CTAButton>
    </Success>
  </Step3>
</CapsterOnboarding>
```

---

## 🎨 DESIGN PATTERNS

### **Fresha-Inspired but BALIK.LAGI Personality**

#### **Common Elements**:
```tsx
// Progress Indicator
<ProgressBar>
  <Step completed>1</Step>
  <Step active>2</Step>
  <Step>3</Step>
  <Step>4</Step>
  <Step>5</Step>
</ProgressBar>

// Step Header Pattern
<StepHeader>
  <Title>Clear, Action-Oriented Title</Title>
  <Subtitle>Why this step matters explanation</Subtitle>
</StepHeader>

// Navigation Pattern
<StepNavigation>
  <BackButton secondary>← Kembali</BackButton>
  <NextButton primary disabled={!isValid}>
    Lanjut →
  </NextButton>
  <SkipLink>Skip untuk nanti</SkipLink>
</StepNavigation>
```

#### **Colors & Spacing**:
```css
/* Step Container */
.onboarding-step {
  max-width: 600px;
  margin: 0 auto;
  padding: 3rem 2rem;
  min-height: 100vh;
}

/* Card Style */
.onboarding-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Warm Colors */
.primary-action {
  background: var(--primary-brown);
  color: white;
}

.secondary-action {
  background: var(--secondary-beige);
  color: var(--text-dark);
}
```

---

## 📱 MOBILE OPTIMIZATION

### **Mobile-First Considerations**:
```
✅ Touch-friendly buttons (min 44px)
✅ Large form inputs (easy to tap)
✅ Swipe gestures for navigation
✅ Bottom-sheet modals (easier reach)
✅ Sticky CTA buttons (always visible)
✅ Auto-focus on first input
✅ Number keyboards for phone/price inputs
```

---

## 🧪 TESTING & VALIDATION

### **Completion Rate Metrics**:
```
Target: >80% completion
Drop-off checkpoints:
  - Step 1 → 2: Expect 90%+
  - Step 2 → 3: Expect 85%+
  - Step 3 → 4: Expect 80%+
  - Step 4 → 5: Expect 90%+
```

### **A/B Testing Ideas**:
```
1. Short vs Long form (2 steps vs 5 steps)
2. Pre-filled suggestions vs Empty fields
3. Video tutorial vs Text instructions
4. Gamification vs Straightforward
```

---

## 🚀 IMPLEMENTATION PRIORITY

### **Phase 1 (MVP)**:
- [x] Barbershop Owner basic flow (no skip options yet)
- [ ] Customer quick booking flow
- [ ] Capster simple onboarding

### **Phase 2 (Enhanced)**:
- [ ] Add skip options & progressive profiling
- [ ] Video tutorials
- [ ] WhatsApp deep links
- [ ] Email invitations

### **Phase 3 (Advanced)**:
- [ ] Smart defaults based on location
- [ ] AI-suggested services & pricing
- [ ] Gamification elements
- [ ] Social proof integration

---

**Documentation Created**: 29 Desember 2025  
**Status**: Design Specification Ready  
**Next Action**: Implement in React components  
**Review Date**: Post-MVP launch feedback

---

**Let's build an onboarding yang bikin user bilang: "Wah, gampang banget!" 🚀**
