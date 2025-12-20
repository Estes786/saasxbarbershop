# 🎯 IMPLEMENTATION GUIDE: BOOKING SYSTEM (KILLER FEATURE)

**Target**: Launch booking system dalam 2 minggu  
**Prioritas**: CRITICAL - Ini adalah "Digital Moat" untuk kompetisi di Kedungrandu  
**Status**: ⏳ IN PROGRESS

---

## 📋 CHECKLIST IMPLEMENTASI

### **FASE 1: DATABASE SCHEMA (Hari 1-2)**

#### **1.1. Tambah Missing Tables**

Jalankan SQL script ini di Supabase SQL Editor:

```sql
-- ===========================
-- 1. SERVICE CATALOG
-- ===========================
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_category TEXT CHECK (service_category IN ('haircut', 'grooming', 'coloring', 'package', 'other')),
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO service_catalog (service_name, service_category, base_price, duration_minutes, description, display_order) VALUES
('Potong Rambut Regular', 'haircut', 30000, 30, 'Potong rambut standar dengan gunting dan clipper', 1),
('Potong Rambut Premium', 'haircut', 50000, 45, 'Potong rambut dengan konsultasi styling', 2),
('Cukur Jenggot', 'grooming', 20000, 20, 'Cukur jenggot bersih dengan pisau cukur', 3),
('Grooming Lengkap', 'grooming', 70000, 60, 'Potong rambut + cukur jenggot + facial', 4),
('Keramas', 'grooming', 15000, 15, 'Keramas dengan shampoo premium', 5),
('Coloring', 'coloring', 150000, 90, 'Pewarnaan rambut full', 6),
('Paket Hemat', 'package', 100000, 75, 'Potong rambut + grooming + keramas', 7);

-- ===========================
-- 2. CAPSTER MANAGEMENT
-- ===========================
CREATE TABLE IF NOT EXISTS capsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  capster_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT, -- 'haircut', 'grooming', 'coloring', 'all'
  rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_customers_served INTEGER DEFAULT 0,
  total_revenue_generated NUMERIC(12,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "20:00"}, "tuesday": {"start": "09:00", "end": "20:00"}, "wednesday": {"start": "09:00", "end": "20:00"}, "thursday": {"start": "09:00", "end": "20:00"}, "friday": {"start": "09:00", "end": "20:00"}, "saturday": {"start": "09:00", "end": "21:00"}, "sunday": {"start": "09:00", "end": "21:00"}}'::jsonb,
  profile_image_url TEXT,
  bio TEXT,
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data (sesuaikan dengan capster aktual di barbershop Anda)
INSERT INTO capsters (capster_name, phone, specialization, rating, years_of_experience, bio) VALUES
('Budi Santoso', '08123456789', 'all', 4.8, 5, 'Capster berpengalaman dengan spesialisasi modern haircut'),
('Agus Priyanto', '08123456790', 'haircut', 4.5, 3, 'Ahli dalam classic & modern hairstyles'),
('Dedi Wijaya', '08123456791', 'coloring', 4.9, 7, 'Spesialis pewarnaan rambut & highlight');

-- ===========================
-- 3. BOOKING SLOTS (untuk pre-generated slots)
-- ===========================
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capster_id UUID REFERENCES capsters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'completed')),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time, capster_id)
);

-- Index untuk performance
CREATE INDEX idx_booking_slots_date_capster ON booking_slots(date, capster_id);
CREATE INDEX idx_booking_slots_status ON booking_slots(status);

-- ===========================
-- 4. UPDATE BOOKINGS TABLE (tambah kolom baru)
-- ===========================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS capster_id UUID REFERENCES capsters(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES service_catalog(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Update constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));

-- ===========================
-- 5. CUSTOMER LOYALTY PROGRAM
-- ===========================
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES barbershop_customers(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  last_transaction_date DATE,
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- Tier upgrade rules:
-- Bronze: 0-499 points
-- Silver: 500-1999 points
-- Gold: 2000-4999 points
-- Platinum: 5000+ points

-- ===========================
-- 6. CUSTOMER REVIEWS
-- ===========================
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES barbershop_customers(id) ON DELETE CASCADE,
  capster_id UUID REFERENCES capsters(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES barbershop_transactions(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title TEXT,
  review_text TEXT,
  response_text TEXT, -- Owner response
  response_date TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performance
CREATE INDEX idx_customer_reviews_capster ON customer_reviews(capster_id);
CREATE INDEX idx_customer_reviews_rating ON customer_reviews(rating);
CREATE INDEX idx_customer_reviews_is_public ON customer_reviews(is_public);

-- ===========================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ===========================

-- Service Catalog: Public read, Admin write
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON service_catalog FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Only admin can manage services"
  ON service_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Capsters: Public read, Admin write
ALTER TABLE capsters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available capsters"
  ON capsters FOR SELECT
  USING (is_available = TRUE);

CREATE POLICY "Only admin can manage capsters"
  ON capsters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'barbershop')
    )
  );

-- Booking Slots: Public read (for availability), Admin write
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available slots"
  ON booking_slots FOR SELECT
  USING (status = 'available' AND date >= CURRENT_DATE);

CREATE POLICY "Admin can manage all slots"
  ON booking_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'barbershop')
    )
  );

-- Bookings: Users can view own bookings, Admin can view all
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM barbershop_customers
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'barbershop')
    )
  );

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM barbershop_customers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM barbershop_customers
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'barbershop')
    )
  );

-- Customer Loyalty: Users can view own loyalty, Admin can manage
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty"
  ON customer_loyalty FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM barbershop_customers
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'barbershop')
    )
  );

-- Reviews: Public read (if is_public), Users can create own reviews
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public reviews"
  ON customer_reviews FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can create own reviews"
  ON customer_reviews FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM barbershop_customers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can respond to reviews"
  ON customer_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'barbershop')
    )
  );

-- ===========================
-- 8. DATABASE FUNCTIONS & TRIGGERS
-- ===========================

-- Function: Auto-generate booking slots for next 30 days
CREATE OR REPLACE FUNCTION generate_booking_slots_for_capster(
  p_capster_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_current_date DATE;
  v_slot_start TIME;
  v_slot_end TIME;
  v_working_hours JSONB;
  v_day_of_week TEXT;
  v_slots_created INTEGER := 0;
BEGIN
  -- Get capster working hours
  SELECT working_hours INTO v_working_hours
  FROM capsters
  WHERE id = p_capster_id;

  -- Loop through each day
  FOR v_current_date IN 
    SELECT generate_series(p_start_date, p_start_date + p_days - 1, '1 day'::interval)::DATE
  LOOP
    -- Get day of week (lowercase)
    v_day_of_week := LOWER(TO_CHAR(v_current_date, 'Day'));
    v_day_of_week := TRIM(v_day_of_week);
    
    -- Skip if day not in working hours
    CONTINUE WHEN v_working_hours->v_day_of_week IS NULL;
    
    -- Generate slots every 30 minutes
    v_slot_start := (v_working_hours->v_day_of_week->>'start')::TIME;
    v_slot_end := (v_working_hours->v_day_of_week->>'end')::TIME;
    
    WHILE v_slot_start < v_slot_end LOOP
      -- Insert slot if not exists
      INSERT INTO booking_slots (date, start_time, end_time, capster_id, status)
      VALUES (v_current_date, v_slot_start, v_slot_start + INTERVAL '30 minutes', p_capster_id, 'available')
      ON CONFLICT (date, start_time, capster_id) DO NOTHING;
      
      v_slots_created := v_slots_created + 1;
      v_slot_start := v_slot_start + INTERVAL '30 minutes';
    END LOOP;
  END LOOP;
  
  RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- Function: Update capster rating after new review
CREATE OR REPLACE FUNCTION update_capster_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE capsters
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM customer_reviews
    WHERE capster_id = NEW.capster_id
    AND is_public = TRUE
  )
  WHERE id = NEW.capster_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update capster rating on new review
CREATE TRIGGER trigger_update_capster_rating
AFTER INSERT OR UPDATE ON customer_reviews
FOR EACH ROW
EXECUTE FUNCTION update_capster_rating();

-- Function: Update loyalty points after transaction
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Tambah points: Rp 1000 spent = 1 point
  INSERT INTO customer_loyalty (customer_id, points_balance, total_points_earned, last_transaction_date)
  VALUES (
    NEW.customer_id,
    FLOOR(NEW.price / 1000),
    FLOOR(NEW.price / 1000),
    CURRENT_DATE
  )
  ON CONFLICT (customer_id) DO UPDATE
  SET 
    points_balance = customer_loyalty.points_balance + FLOOR(NEW.price / 1000),
    total_points_earned = customer_loyalty.total_points_earned + FLOOR(NEW.price / 1000),
    last_transaction_date = CURRENT_DATE;
  
  -- Auto-upgrade tier
  UPDATE customer_loyalty
  SET tier = CASE
    WHEN total_points_earned >= 5000 THEN 'platinum'
    WHEN total_points_earned >= 2000 THEN 'gold'
    WHEN total_points_earned >= 500 THEN 'silver'
    ELSE 'bronze'
  END
  WHERE customer_id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update loyalty points on new transaction
CREATE TRIGGER trigger_update_loyalty_points
AFTER INSERT ON barbershop_transactions
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_points();

-- ===========================
-- SELESAI! DATABASE SCHEMA LENGKAP
-- ===========================
```

#### **1.2. Verifikasi Schema**

Jalankan ini untuk verify semua table berhasil dibuat:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected output: 12 tables total.

---

### **FASE 2: SUPABASE EDGE FUNCTIONS (Hari 3-4)**

#### **2.1. Setup Supabase Functions**

```bash
cd /home/user/webapp

# Initialize Supabase project (jika belum)
npx supabase init

# Link ke project
npx supabase link --project-ref qwqmhvwqeynnyxaecqzw
```

#### **2.2. Create Booking Availability Function**

```bash
npx supabase functions new booking-availability
```

Edit `supabase/functions/booking-availability/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // CORS handling
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const { date, capster_id, service_id } = await req.json();

    // Validate input
    if (!date) {
      return new Response(JSON.stringify({ error: 'Date is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get service duration if service_id provided
    let serviceDuration = 30; // default
    if (service_id) {
      const { data: service } = await supabase
        .from('service_catalog')
        .select('duration_minutes')
        .eq('id', service_id)
        .single();
      
      if (service) {
        serviceDuration = service.duration_minutes;
      }
    }

    // Build query
    let query = supabase
      .from('booking_slots')
      .select('*, capsters(id, capster_name, rating, specialization)')
      .eq('date', date)
      .eq('status', 'available')
      .gte('start_time', new Date().toTimeString().split(' ')[0]); // Only future slots

    if (capster_id) {
      query = query.eq('capster_id', capster_id);
    }

    const { data: availableSlots, error } = await query.order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    // Group slots by capster
    const slotsByCapster = availableSlots?.reduce((acc: any, slot: any) => {
      const capsterId = slot.capster_id;
      if (!acc[capsterId]) {
        acc[capsterId] = {
          capster: slot.capsters,
          slots: [],
        };
      }
      acc[capsterId].slots.push({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
      });
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        success: true,
        date,
        service_duration: serviceDuration,
        available_slots: Object.values(slotsByCapster || {}),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### **2.3. Deploy Edge Function**

```bash
npx supabase functions deploy booking-availability
```

#### **2.4. Test Edge Function**

```bash
curl -X POST https://qwqmhvwqeynnyxaecqzw.supabase.co/functions/v1/booking-availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"date": "2025-12-21"}'
```

---

### **FASE 3: FRONTEND COMPONENTS (Hari 5-7)**

#### **3.1. Create Booking Form Component**

```typescript
// components/booking/BookingForm.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Service {
  id: string;
  service_name: string;
  base_price: number;
  duration_minutes: number;
}

interface Capster {
  id: string;
  capster_name: string;
  rating: number;
  specialization: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

export default function BookingForm() {
  const supabase = createClient();
  
  const [services, setServices] = useState<Service[]>([]);
  const [capsters, setCapsters] = useState<Capster[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCapster, setSelectedCapster] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services on mount
  useEffect(() => {
    loadServices();
    loadCapsters();
  }, []);

  // Load available slots when date/capster changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedCapster]);

  async function loadServices() {
    const { data, error } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (!error && data) {
      setServices(data);
    }
  }

  async function loadCapsters() {
    const { data, error } = await supabase
      .from('capsters')
      .select('*')
      .eq('is_available', true);
    
    if (!error && data) {
      setCapsters(data);
    }
  }

  async function loadAvailableSlots() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('booking-availability', {
        body: {
          date: selectedDate,
          capster_id: selectedCapster || undefined,
          service_id: selectedService || undefined,
        },
      });

      if (error) throw error;
      
      setAvailableSlots(data.available_slots || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login first');

      // Get customer profile
      const { data: customer } = await supabase
        .from('barbershop_customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customer) throw new Error('Customer profile not found');

      // Get service details
      const service = services.find(s => s.id === selectedService);
      if (!service) throw new Error('Service not found');

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customer.id,
          booking_date: selectedDate,
          booking_time: availableSlots[0].slots.find((s: any) => s.id === selectedSlot)?.start_time,
          service_id: selectedService,
          capster_id: selectedCapster || null,
          total_price: service.base_price,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update slot status
      await supabase
        .from('booking_slots')
        .update({ status: 'booked', booking_id: booking.id })
        .eq('id', selectedSlot);

      alert('Booking berhasil! Menunggu konfirmasi.');
      
      // Reset form
      setSelectedService('');
      setSelectedDate('');
      setSelectedCapster('');
      setSelectedSlot('');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Book Appointment</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Pilih Layanan</label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          >
            <option value="">-- Pilih Layanan --</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.service_name} - Rp {service.base_price.toLocaleString()} ({service.duration_minutes} menit)
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Pilih Tanggal</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </div>

        {/* Capster Selection (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">Pilih Capster (Opsional)</label>
          <select
            value={selectedCapster}
            onChange={(e) => setSelectedCapster(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">-- Semua Capster --</option>
            {capsters.map((capster) => (
              <option key={capster.id} value={capster.id}>
                {capster.capster_name} - ⭐ {capster.rating}
              </option>
            ))}
          </select>
        </div>

        {/* Available Slots */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium mb-2">Pilih Waktu</label>
            {loading ? (
              <div className="text-center py-4">Loading slots...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Tidak ada slot tersedia untuk tanggal ini
              </div>
            ) : (
              <div className="space-y-4">
                {availableSlots.map((capsterSlots) => (
                  <div key={capsterSlots.capster.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">
                      {capsterSlots.capster.capster_name} - ⭐ {capsterSlots.capster.rating}
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {capsterSlots.slots.map((slot: TimeSlot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot.id);
                            setSelectedCapster(capsterSlots.capster.id);
                          }}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            selectedSlot === slot.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {slot.start_time.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedSlot}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
```

#### **3.2. Create Booking List Component (Admin)**

```typescript
// components/booking/BookingList.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  customer_id: string;
  service_id: string;
  capster_id: string;
  total_price: number;
  barbershop_customers: {
    customer_name: string;
    phone: string;
  };
  service_catalog: {
    service_name: string;
  };
  capsters: {
    capster_name: string;
  };
}

export default function BookingList() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, 
        () => {
          loadBookings(); // Reload on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function loadBookings() {
    setLoading(true);
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        barbershop_customers(customer_name, phone),
        service_catalog(service_name),
        capsters(capster_name)
      `)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setBookings(data);
    }
    
    setLoading(false);
  }

  async function updateStatus(bookingId: string, newStatus: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      loadBookings();
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Booking Management</h2>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Belum ada booking
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {booking.barbershop_customers.customer_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {booking.barbershop_customers.phone}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-medium">{booking.service_catalog.service_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capster</p>
                  <p className="font-medium">{booking.capsters.capster_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">
                    {new Date(booking.booking_date).toLocaleDateString('id-ID')} - {booking.booking_time.substring(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="font-medium">Rp {booking.total_price.toLocaleString()}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus(booking.id, 'in_progress')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Start Service
                  </button>
                )}
                {booking.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(booking.id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### **FASE 4: INTEGRATION & TESTING (Hari 8-10)**

#### **4.1. Add Booking Route**

Create `app/booking/page.tsx`:

```typescript
import BookingForm from '@/components/booking/BookingForm';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <BookingForm />
    </div>
  );
}
```

#### **4.2. Add to Customer Dashboard**

Edit `app/dashboard/customer/page.tsx`:

```typescript
// Add link to booking
<a href="/booking" className="btn-primary">
  Book Appointment
</a>
```

#### **4.3. Add to Admin Dashboard**

Edit `app/dashboard/barbershop/page.tsx` atau `app/dashboard/admin/page.tsx`:

```typescript
import BookingList from '@/components/booking/BookingList';

// Add component
<BookingList />
```

#### **4.4. Generate Slots untuk Semua Capster**

Run this in Supabase SQL Editor:

```sql
-- Generate slots for next 30 days for all capsters
DO $$
DECLARE
  capster_record RECORD;
  slots_created INTEGER;
BEGIN
  FOR capster_record IN 
    SELECT id, capster_name FROM capsters WHERE is_available = TRUE
  LOOP
    SELECT generate_booking_slots_for_capster(capster_record.id, CURRENT_DATE, 30) INTO slots_created;
    RAISE NOTICE 'Generated % slots for %', slots_created, capster_record.capster_name;
  END LOOP;
END $$;
```

---

### **FASE 5: TESTING & DEPLOYMENT (Hari 11-14)**

#### **5.1. Manual Testing Checklist**

- [ ] Customer dapat melihat services
- [ ] Customer dapat pilih date (min: today)
- [ ] Customer dapat pilih capster (optional)
- [ ] Slots tersedia ditampilkan dengan benar
- [ ] Customer dapat booking slot
- [ ] Admin dapat melihat semua bookings
- [ ] Admin dapat confirm/cancel bookings
- [ ] Admin dapat update status (in_progress, completed)
- [ ] Realtime updates berfungsi (auto-refresh saat ada booking baru)
- [ ] RLS policies berfungsi (customer hanya lihat own bookings)
- [ ] Loyalty points otomatis bertambah setelah transaction completed

#### **5.2. Automated Testing**

Create `tests/booking.test.ts`:

```typescript
// TODO: Add automated tests using Playwright
```

#### **5.3. Deploy to Production**

```bash
# Build
npm run build

# Deploy ke Vercel
vercel --prod

# Atau deploy ke Cloudflare Pages
wrangler pages deploy dist
```

---

## 🎯 SUCCESS METRICS

### **Week 1-2:**
- [ ] ✅ 5+ successful bookings
- [ ] ✅ 0 double-booking errors
- [ ] ✅ <2s response time untuk slot availability
- [ ] ✅ 90%+ customer satisfaction (post-booking survey)

### **Month 1:**
- [ ] ✅ 50+ bookings via platform
- [ ] ✅ 30% reduction in no-shows (vs. manual booking)
- [ ] ✅ 20% increase in revenue (lebih organized, less idle time)
- [ ] ✅ 10+ positive reviews mentioning "mudah booking"

---

## 📞 NEXT STEPS

1. **Run database migration** (copy-paste SQL di atas ke Supabase SQL Editor)
2. **Deploy Edge Functions** (booking-availability)
3. **Implement frontend components** (BookingForm, BookingList)
4. **Generate initial slots** (30 hari ke depan untuk semua capster)
5. **Test end-to-end flow** (customer booking → admin confirmation → service completed)
6. **Promote ke customers** (WhatsApp broadcast, poster di barbershop)

---

**LET'S BUILD THE KILLER FEATURE! 🚀**

*Generated: 20 Desember 2025*  
*Target Launch: 3 Januari 2026 (2 minggu dari sekarang)*
