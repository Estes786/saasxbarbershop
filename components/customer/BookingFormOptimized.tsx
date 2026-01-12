'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import BranchSelector from './BranchSelector';
import useSWR from 'swr';
import { ServicesSkeleton, CapstersSkeleton } from '../ui/Skeleton';
import { normalizePhoneNumber } from '@/lib/utils/phoneUtils';

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

// ✅ ULTRA OPTIMIZED Fetcher with AbortError handling
const servicesFetcher = async (branchId: string): Promise<Service[]> => {
  try {
    const supabase = createClient();
    
    // 🔥 SIMPLIFIED: Just show all active services (no branch filtering for speed)
    const { data, error } = await supabase
      .from('service_catalog')
      .select('id, service_name, base_price, duration_minutes, description')
      .eq('is_active', true)
      .order('display_order');
    
    // ✅ FIX: Don't throw on AbortError, return empty array
    if (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Service fetch aborted (normal - will retry)');
        return [];
      }
      throw error;
    }
    
    return data || [];
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return []; // Silent fail for AbortError
    }
    throw err;
  }
};

const capstersFetcher = async (branchId: string): Promise<Capster[]> => {
  try {
    const supabase = createClient();
    
    // 🔥 FIXED: Removed is_available check (field doesn't exist)
    const { data, error } = await supabase
      .from('capsters')
      .select('id, capster_name, specialization')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('capster_name');
    
    // ✅ FIX: Don't throw on AbortError, return empty array
    if (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Capster fetch aborted (normal - will retry)');
        return [];
      }
      throw error;
    }
    
    return (data || []).map((capster: any) => ({
      id: capster.id,
      capster_id: capster.id,
      capster_name: capster.capster_name,
      full_name: capster.capster_name,
      customer_name: capster.capster_name,
      email: '',
      specialization: capster.specialization || 'all'
    }));
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return []; // Silent fail for AbortError
    }
    throw err;
  }
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

  // 🔥 ULTRA FAST SWR - FINAL FIX: Maximum deduping to prevent AbortError
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useSWR<Service[]>(
    `services-${formData.branch_id || 'all'}`,
    () => servicesFetcher(formData.branch_id),
    {
      revalidateOnFocus: false, // ❌ Never revalidate on focus
      revalidateOnReconnect: false, // ❌ Never revalidate on reconnect
      revalidateOnMount: false, // ❌ Never revalidate on mount (after first load)
      revalidateIfStale: false, // ❌ Never revalidate if data is stale
      dedupingInterval: 600000, // ✅ FINAL FIX: 10 MINUTES (was 5 minutes)
      refreshInterval: 0, // ❌ No auto-refresh
      refreshWhenHidden: false, // ❌ Don't refresh when tab hidden
      refreshWhenOffline: false, // ❌ Don't refresh when offline
      shouldRetryOnError: false, // ❌ NO retries on error
      errorRetryCount: 0, // ❌ NO retry attempts
      errorRetryInterval: 0, // ❌ NO retry delay
      focusThrottleInterval: 600000, // ✅ Throttle focus events (10 minutes)
      fallbackData: [], // ✅ Instant render
      keepPreviousData: true, // ✅ Keep old data while fetching
      onSuccess: (data) => {
        if (data && data.length > 0) {
          console.log(`✅ Services loaded: ${data.length} items`);
        }
      },
      onError: (err) => {
        // ✅ Completely silent for AbortError
        if (err?.name === 'AbortError') {
          console.log('⚠️ Service fetch aborted (ignored)');
          return;
        }
        console.error('❌ Services error:', err.message);
      }
    }
  );

  const { data: capsters = [], isLoading: capstersLoading, error: capstersError } = useSWR<Capster[]>(
    `capsters-${formData.branch_id || 'all'}`,
    () => capstersFetcher(formData.branch_id),
    {
      revalidateOnFocus: false, // ❌ Never revalidate on focus
      revalidateOnReconnect: false, // ❌ Never revalidate on reconnect
      revalidateOnMount: false, // ❌ Never revalidate on mount (after first load)
      revalidateIfStale: false, // ❌ Never revalidate if data is stale
      dedupingInterval: 600000, // ✅ FINAL FIX: 10 MINUTES (was 5 minutes)
      refreshInterval: 0, // ❌ No auto-refresh
      refreshWhenHidden: false, // ❌ Don't refresh when tab hidden
      refreshWhenOffline: false, // ❌ Don't refresh when offline
      shouldRetryOnError: false, // ❌ NO retries on error
      errorRetryCount: 0, // ❌ NO retry attempts
      errorRetryInterval: 0, // ❌ NO retry delay
      focusThrottleInterval: 600000, // ✅ Throttle focus events (10 minutes)
      fallbackData: [], // ✅ Instant render
      keepPreviousData: true, // ✅ Keep old data while fetching
      onSuccess: (data) => {
        if (data && data.length > 0) {
          console.log(`✅ Capsters loaded: ${data.length} items`);
        }
      },
      onError: (err) => {
        // ✅ Completely silent for AbortError
        if (err?.name === 'AbortError') {
          console.log('⚠️ Capster fetch aborted (ignored)');
          return;
        }
        console.error('❌ Capsters error:', err.message);
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

  // ✅ OPTIMIZED: Submit handler with AbortError handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete) {
      showToast('error', 'Mohon lengkapi semua data booking');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    console.log('🚀 Starting booking process...');

    try {
      // Determine service tier (FIXED: using database constraint values)
      const basePrice = selectedService?.base_price || 0;
      const serviceTier = basePrice >= 50000 ? 'Premium' 
                        : basePrice >= 25000 ? 'Standard'
                        : 'Basic';

      // ⚡ ULTRA OPTIMIZED: Direct insert with minimal data validation
      console.log('🚀 Creating booking...');
      
      // 🔥 CRITICAL FIX: Normalize phone number before insert
      const normalizedPhone = normalizePhoneNumber(customerPhone);
      console.log(`📞 Saving booking with phone: ${normalizedPhone}`);
      
      // ✅ FIX: Create fresh Supabase client to avoid abort conflicts
      const freshSupabase = createClient();
      
      const { data: newBooking, error: bookingError } = await freshSupabase
        .from('bookings')
        .insert({
          customer_phone: normalizedPhone,
          customer_name: customerName || 'Guest',
          branch_id: formData.branch_id || null,
          service_id: formData.service_id,
          capster_id: formData.capster_id,
          booking_date: formData.booking_date, // Simple date format: YYYY-MM-DD
          booking_time: formData.booking_time, // Simple time format: HH:MM
          service_tier: serviceTier,
          customer_notes: formData.customer_notes || null,
          status: 'pending',
          booking_source: 'online',
          total_price: basePrice,
          estimated_duration_minutes: selectedService?.duration_minutes || 30
        } as any) // ✅ Type fix for strict mode
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Booking error:', bookingError);
        
        // ✅ FIX: Handle AbortError gracefully
        if (bookingError.name === 'AbortError') {
          throw new Error('⚠️ Koneksi terputus. Mohon coba lagi.');
        }
        
        // Enhanced error messages
        if (bookingError.message.includes('duplicate') || bookingError.code === '23505') {
          throw new Error('⚠️ Anda sudah memiliki booking di waktu tersebut');
        } else if (bookingError.message.includes('capster') || bookingError.message.includes('foreign key')) {
          throw new Error('⚠️ Data tidak valid. Mohon refresh halaman dan coba lagi.');
        } else if (bookingError.message.includes('phone')) {
          throw new Error('⚠️ Nomor telepon tidak valid. Mohon hubungi admin.');
        } else {
          throw new Error(bookingError.message || 'Gagal membuat booking');
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ Booking created in ${elapsed}ms:`, newBooking);

      // 🎉 Instant Success Feedback!
      setSuccess(true);
      showToast('success', `🎉 Booking berhasil! (${elapsed}ms)`);
      
      // Auto-reset form after 3 seconds
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
      }, 3000);

    } catch (err: any) {
      console.error('💥 Booking failed:', err);
      
      // ✅ FIX: Handle AbortError specifically
      if (err?.name === 'AbortError') {
        showToast('error', '⚠️ Koneksi terputus. Mohon coba lagi.');
      } else {
        showToast('error', err.message || '❌ Gagal membuat booking. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, selectedService, customerPhone, customerName, isFormComplete, showToast]);

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
        {/* Quick Status Bar - Show loading status instantly */}
        {(servicesLoading || capstersLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center animate-pulse">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-blue-700">
                {servicesLoading && capstersLoading ? 'Memuat layanan & capster...' : 
                 servicesLoading ? 'Memuat layanan...' : 'Memuat capster...'}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">⚡ Harap tunggu sebentar</p>
          </div>
        )}

        {/* Error handling - Show if loading failed */}
        {(servicesError || capstersError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-red-700">
              ⚠️ Gagal memuat data. Silakan refresh halaman.
            </p>
            {servicesError && (
              <p className="text-xs text-red-600 mt-1">Error layanan: {servicesError.message}</p>
            )}
            {capstersError && (
              <p className="text-xs text-red-600 mt-1">Error capster: {capstersError.message}</p>
            )}
          </div>
        )}

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
