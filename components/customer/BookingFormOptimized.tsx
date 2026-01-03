'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import BranchSelector from './BranchSelector';
import useSWR from 'swr';
import { ServicesSkeleton, CapstersSkeleton } from '../ui/Skeleton';

interface Service {
  id: string;
  service_name: string;
  base_price: number;
  duration_minutes: number;
  description: string;
}

interface Capster {
  id: string;
  capster_id: string;
  capster_name: string;
  full_name: string;
  customer_name: string;
  email: string;
  specialization?: string;
}

interface BookingFormProps {
  customerPhone: string;
  customerName?: string;
}

// ✅ ULTRA OPTIMIZED Fetcher - Removed complex OR conditions
const servicesFetcher = async (branchId: string): Promise<Service[]> => {
  const supabase = createClient();
  
  // 🔥 SIMPLIFIED: Just show all active services (no branch filtering for speed)
  const { data, error } = await supabase
    .from('service_catalog')
    .select('id, service_name, base_price, duration_minutes, description')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return data || [];
};

const capstersFetcher = async (branchId: string): Promise<Capster[]> => {
  const supabase = createClient();
  
  // 🔥 SIMPLIFIED: Show all available approved capsters (no branch filtering for speed)
  const { data, error } = await supabase
    .from('capsters')
    .select('id, capster_name, specialization')
    .eq('is_available', true)
    .eq('is_active', true)
    .eq('status', 'approved')
    .order('capster_name');
  
  if (error) throw error;
  
  return (data || []).map((capster: any) => ({
    id: capster.id,
    capster_id: capster.id,
    capster_name: capster.capster_name,
    full_name: capster.capster_name,
    customer_name: capster.capster_name,
    email: '',
    specialization: capster.specialization || 'all'
  }));
};

export default function BookingFormOptimized({ customerPhone, customerName }: BookingFormProps) {
  const { showToast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔧 FIX: Set default branch to empty string (shows all services/capsters)
  const [formData, setFormData] = useState({
    branch_id: '', // Empty = show all branches
    service_id: '',
    capster_id: '',
    booking_date: '',
    booking_time: '09:00',
    customer_notes: ''
  });

  // ✅ ULTRA FAST SWR - Reduced cache time for immediate updates
  const { data: services = [], isLoading: servicesLoading } = useSWR<Service[]>(
    `services-${formData.branch_id || 'all'}`,
    () => servicesFetcher(formData.branch_id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000, // 🔥 Reduced to 10 seconds for faster updates
      refreshInterval: 0, // No auto-refresh
      onError: (err) => {
        console.error('Error loading services:', err);
        showToast('error', 'Gagal memuat layanan. Silakan refresh halaman.');
      }
    }
  );

  const { data: capsters = [], isLoading: capstersLoading } = useSWR<Capster[]>(
    `capsters-${formData.branch_id || 'all'}`,
    () => capstersFetcher(formData.branch_id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000, // 🔥 Reduced to 10 seconds for faster updates
      refreshInterval: 0, // No auto-refresh
      onError: (err) => {
        console.error('Error loading capsters:', err);
        showToast('error', 'Gagal memuat capster. Silakan refresh halaman.');
      }
    }
  );

  // ✅ Memoized computed values
  const selectedService = useMemo(
    () => services.find(s => s.id === formData.service_id),
    [services, formData.service_id]
  );

  const selectedCapster = useMemo(
    () => capsters.find(c => c.id === formData.capster_id),
    [capsters, formData.capster_id]
  );

  const isFormComplete = useMemo(
    () => formData.service_id && formData.capster_id && formData.booking_date, // branch_id optional
    [formData]
  );

  // ✅ OPTIMIZED: Submit handler with progress feedback
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete) {
      showToast('error', 'Mohon lengkapi semua data booking');
      return;
    }

    setLoading(true);
    console.log('🚀 Starting booking process...');

    try {
      const bookingDateTime = new Date(`${formData.booking_date}T${formData.booking_time}`);

      // Determine service tier
      const basePrice = selectedService?.base_price || 0;
      const serviceTier = basePrice >= 50000 ? 'Premium' 
                        : basePrice >= 25000 ? 'Mastery'
                        : 'Basic';

      // 🔧 Step 1: Create or update customer (with progress feedback)
      console.log('1️⃣ Creating/updating customer...');
      const { error: customerError } = await (supabase as any)
        .from('barbershop_customers')
        .upsert({
          customer_phone: customerPhone,
          customer_name: customerName || 'Guest',
          customer_area: 'Online',
          total_visits: 0,
          total_revenue: 0,
          average_atv: 0,
          customer_segment: 'New',
          lifetime_value: 0,
          coupon_count: 0,
          coupon_eligible: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'customer_phone',
          ignoreDuplicates: true
        });

      if (customerError) {
        console.warn('⚠️ Customer upsert warning:', customerError);
      } else {
        console.log('✅ Customer ready');
      }

      // 🔧 Step 2: Create booking (with detailed logging)
      console.log('2️⃣ Creating booking...');
      console.log('📋 Booking data:', {
        customer_phone: customerPhone,
        service_id: formData.service_id,
        capster_id: formData.capster_id,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
      });

      const { data: newBooking, error: bookingError } = await (supabase as any)
        .from('bookings')
        .insert({
          customer_phone: customerPhone,
          customer_name: customerName || 'Guest',
          branch_id: formData.branch_id || null,
          service_id: formData.service_id,
          capster_id: formData.capster_id,
          booking_date: formData.booking_date,
          booking_time: formData.booking_time,
          service_tier: serviceTier,
          customer_notes: formData.customer_notes,
          status: 'pending',
          booking_source: 'online',
          total_price: basePrice,
          estimated_duration_minutes: selectedService?.duration_minutes || 30
        })
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Booking error:', bookingError);
        // Better error messages
        if (bookingError.message.includes('duplicate')) {
          throw new Error('Anda sudah memiliki booking di waktu tersebut');
        } else if (bookingError.message.includes('capster')) {
          throw new Error('Capster tidak tersedia di waktu tersebut');
        } else if (bookingError.message.includes('foreign key')) {
          throw new Error('Data tidak valid. Silakan refresh halaman dan coba lagi.');
        } else {
          throw bookingError;
        }
      }

      console.log('✅ Booking created successfully:', newBooking);

      // 🎉 Success!
      setSuccess(true);
      showToast('success', '🎉 Booking berhasil dibuat! Cek tab Riwayat.');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          branch_id: '',
          service_id: '',
          capster_id: '',
          booking_date: '',
          booking_time: '09:00',
          customer_notes: ''
        });
        setSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('💥 Booking failed:', err);
      showToast('error', err.message || 'Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [formData, selectedService, customerPhone, customerName, isFormComplete, showToast, supabase]);

  // Success screen
  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl p-8 text-center animate-fade-in border-2 border-purple-200">
        <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Booking Berhasil!
        </h2>
        <p className="text-gray-700 mb-2 font-medium">✅ Booking Anda telah dikonfirmasi</p>
        <p className="text-sm text-gray-600 mb-4">Nomor antrian akan muncul di halaman Riwayat</p>
        <div className="bg-white rounded-xl p-4 shadow-md inline-block">
          <p className="text-xs text-gray-500 mb-1">Booking untuk:</p>
          <p className="font-bold text-purple-600">{customerName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-100">
      <div className="mb-6 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start mb-2">
          <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Booking Online
          </h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Pilih layanan dan capster favorit Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Branch Selection */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-purple-600" />
            Pilih Cabang
          </label>
          <BranchSelector
            selectedBranchId={formData.branch_id}
            onSelectBranch={(branchId) => {
              setFormData({ 
                ...formData, 
                branch_id: branchId,
                service_id: '',
                capster_id: ''
              });
            }}
          />
        </div>

        {/* Service Selection - Always show */}
        <div className="space-y-2 animate-fade-in">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <User className="w-4 h-4 mr-2 text-purple-600" />
            Pilih Layanan
          </label>
          
          {servicesLoading ? (
            <ServicesSkeleton />
          ) : (
            <div className="space-y-2">
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-medium transition-all hover:border-purple-300"
                required
              >
                <option value="">Pilih layanan...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.service_name} - Rp {service.base_price.toLocaleString()} ({service.duration_minutes} menit)
                  </option>
                ))}
              </select>
              {selectedService && (
                <p className="text-xs text-gray-500 px-2">{selectedService.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Capster Selection - Always show */}
        <div className="space-y-2 animate-fade-in">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <User className="w-4 h-4 mr-2 text-purple-600" />
            Pilih Capster
          </label>
          
          {capstersLoading ? (
            <CapstersSkeleton />
          ) : (
            <div className="space-y-2">
              <select
                value={formData.capster_id}
                onChange={(e) => setFormData({ ...formData, capster_id: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-medium transition-all hover:border-purple-300"
                required
              >
                <option value="">Pilih capster...</option>
                {capsters.length === 0 ? (
                  <option disabled>Tidak ada capster tersedia</option>
                ) : (
                  capsters.map((capster) => (
                    <option key={capster.id} value={capster.id}>
                      {capster.capster_name} {capster.specialization && `- ${capster.specialization}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        {/* Date & Time Selection - Always show when services/capsters loaded */}
        {!servicesLoading && !capstersLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Tanggal
                </label>
                <input
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-medium transition-all hover:border-purple-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-purple-600" />
                  Waktu
                </label>
                <select
                  value={formData.booking_time}
                  onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-medium transition-all hover:border-purple-300"
                  required
                >
                  {Array.from({ length: 11 }, (_, i) => i + 9).map((hour) => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.customer_notes}
                onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                placeholder="Contoh: Mau model rambut undercut, fade samping..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base transition-all hover:border-purple-300 resize-none"
                rows={3}
              />
            </div>
          </>
        )}

        {/* Summary */}
        {isFormComplete && selectedService && selectedCapster && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-md animate-fade-in">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Ringkasan Booking
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Layanan:</span>
                <span className="font-semibold text-gray-900">{selectedService.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Capster:</span>
                <span className="font-semibold text-gray-900">{selectedCapster.capster_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tanggal:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(formData.booking_date).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Waktu:</span>
                <span className="font-semibold text-gray-900">{formData.booking_time}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-purple-200">
                <span className="text-purple-900 font-bold">Total:</span>
                <span className="text-lg font-bold text-purple-900">
                  Rp {selectedService.base_price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button - Always show when data loaded */}
        {!servicesLoading && !capstersLoading && (
          <>
            <button
              type="submit"
              disabled={loading || !isFormComplete}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses Booking...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Booking Sekarang
                </span>
              )}
            </button>
            
            {/* Progress hints */}
            {loading && (
              <div className="text-center text-sm text-gray-500 animate-pulse">
                <p>⏳ Mohon tunggu sebentar...</p>
                <p className="text-xs mt-1">Booking Anda sedang diproses</p>
              </div>
            )}
          </>
        )}
      </form>

      <p className="text-xs text-gray-500 text-center mt-6">
        ⚡ Booking akan diproses dalam beberapa detik
      </p>
    </div>
  );
}
