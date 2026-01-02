'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin } from 'lucide-react';
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

// ✅ SWR Fetcher functions - Separate for type safety
const servicesFetcher = async (branchId: string): Promise<Service[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('is_active', true)
    .eq('branch_id', branchId)
    .order('display_order');
  
  if (error) throw error;
  return data || [];
};

const capstersFetcher = async (branchId: string): Promise<Capster[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('capsters')
    .select('id, capster_name, specialization, branch_id')
    .eq('is_available', true)
    .eq('branch_id', branchId)
    .order('capster_name');
  
  if (error) throw error;
  
  // Transform data to match Capster interface
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

  const [formData, setFormData] = useState({
    branch_id: '',
    service_id: '',
    capster_id: '',
    booking_date: '',
    booking_time: '09:00',
    customer_notes: ''
  });

  // ✅ OPTIMIZATION 1: Parallel data fetching with SWR
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useSWR<Service[]>(
    formData.branch_id ? `services-${formData.branch_id}` : null,
    () => servicesFetcher(formData.branch_id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      onError: (err) => {
        console.error('Error loading services:', err);
        showToast('error', 'Gagal memuat layanan');
      }
    }
  );

  const { data: capsters = [], isLoading: capstersLoading, error: capstersError } = useSWR<Capster[]>(
    formData.branch_id ? `capsters-${formData.branch_id}` : null,
    () => capstersFetcher(formData.branch_id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      onError: (err) => {
        console.error('Error loading capsters:', err);
        showToast('error', 'Gagal memuat capster');
      }
    }
  );

  // ✅ OPTIMIZATION 2: Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branch_id || !formData.service_id || !formData.capster_id || !formData.booking_date) {
      showToast('error', 'Mohon lengkapi semua data termasuk pilih cabang');
      return;
    }

    setLoading(true);

    try {
      const bookingDateTime = new Date(`${formData.booking_date}T${formData.booking_time}`);

      // Determine service tier based on selected service price
      const currentService = services.find((s) => s.id === formData.service_id);
      const basePrice = currentService?.base_price || 0;
      const serviceTier = basePrice >= 50000 ? 'Premium' 
                        : basePrice >= 25000 ? 'Mastery'
                        : 'Basic';

      const { data, error } = await (supabase as any)
        .from('bookings')
        .insert({
          customer_phone: customerPhone,
          customer_name: customerName || 'Guest',
          branch_id: formData.branch_id,
          service_id: formData.service_id,
          capster_id: formData.capster_id,
          booking_date: bookingDateTime.toISOString(),
          booking_time: formData.booking_time,
          service_tier: serviceTier,
          customer_notes: formData.customer_notes,
          status: 'pending',
          booking_source: 'online'
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      showToast('success', 'Booking berhasil dibuat! 🎉');
      
      // Reset form after 3 seconds
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
      console.error('Error creating booking:', err);
      showToast('error', 'Gagal membuat booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, services, customerPhone, customerName, supabase, showToast]);

  const selectedService = services.find(s => s.id === formData.service_id);
  const selectedCapster = capsters.find(c => c.id === formData.capster_id);

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Booking Berhasil!</h2>
        <p className="text-gray-600 mb-2">Nomor Antrian Anda akan muncul di dashboard</p>
        <p className="text-sm text-gray-500">Kami akan mengirimkan notifikasi via WhatsApp</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Online 🔥</h2>
        <p className="text-gray-600 text-sm sm:text-base">Pilih layanan dan capster favorit Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Branch Selection - OPTIMIZED */}
        <div className="tap-target-area">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Pilih Cabang
          </label>
          <BranchSelector
            selectedBranchId={formData.branch_id}
            onSelectBranch={(branchId) => {
              setFormData({ 
                ...formData, 
                branch_id: branchId,
                service_id: '', // Reset service when branch changes
                capster_id: ''  // Reset capster when branch changes
              });
            }}
          />
        </div>

        {/* Service Selection - WITH SKELETON */}
        {formData.branch_id && (
          <div className="tap-target-area">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Pilih Layanan
            </label>
            
            {servicesLoading ? (
              <ServicesSkeleton />
            ) : servicesError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600 text-sm">
                Gagal memuat layanan. Silakan refresh halaman.
              </div>
            ) : (
              <>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base touch-manipulation"
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
                  <p className="text-sm text-gray-500 mt-2">{selectedService.description}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Capster Selection - WITH SKELETON */}
        {formData.branch_id && (
          <div className="tap-target-area">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Pilih Capster
            </label>
            
            {capstersLoading ? (
              <CapstersSkeleton />
            ) : capstersError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600 text-sm">
                Gagal memuat capster. Silakan refresh halaman.
              </div>
            ) : (
              <>
                <select
                  value={formData.capster_id}
                  onChange={(e) => setFormData({ ...formData, capster_id: e.target.value })}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base touch-manipulation"
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
                {selectedCapster && (
                  <p className="text-sm text-gray-500 mt-2">
                    Capster: {selectedCapster.capster_name} 
                    {selectedCapster.specialization && ` - ${selectedCapster.specialization}`}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Date Selection - MOBILE OPTIMIZED */}
        {formData.branch_id && !servicesLoading && !capstersLoading && (
          <div className="tap-target-area">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tanggal Booking
          </label>
          <input
            type="date"
            value={formData.booking_date}
            onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base touch-manipulation"
            required
          />
        </div>
        )}

        {/* Time Selection - MOBILE OPTIMIZED */}
        {formData.branch_id && !servicesLoading && !capstersLoading && (
          <div className="tap-target-area">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Waktu Booking
          </label>
          <select
            value={formData.booking_time}
            onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
            className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base touch-manipulation"
            required
          >
            {Array.from({ length: 11 }, (_, i) => i + 9).map((hour) => (
              <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                {hour}:00
              </option>
            ))}
          </select>
        </div>
        )}

        {/* Customer Notes - MOBILE OPTIMIZED */}
        {formData.branch_id && !servicesLoading && !capstersLoading && (
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Catatan (Opsional)
          </label>
          <textarea
            value={formData.customer_notes}
            onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
            placeholder="Contoh: Mau model rambut undercut, fade samping..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base touch-manipulation"
            rows={3}
          />
        </div>
        )}

        {/* Summary - OPTIMIZED DISPLAY */}
        {selectedService && selectedCapster && formData.booking_date && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 animate-fade-in">
            <h3 className="font-semibold text-purple-900 mb-3 text-sm sm:text-base">Ringkasan Booking:</h3>
            <ul className="text-xs sm:text-sm text-purple-800 space-y-2">
              <li className="flex items-start">
                <span className="font-semibold mr-2">Layanan:</span>
                <span>{selectedService.service_name}</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Capster:</span>
                <span>{selectedCapster.capster_name}</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Tanggal:</span>
                <span>{new Date(formData.booking_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Waktu:</span>
                <span>{formData.booking_time}</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Durasi:</span>
                <span>~{selectedService.duration_minutes} menit</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-900">Total Harga:</span>
                <span className="font-bold text-purple-900">Rp {selectedService.base_price.toLocaleString()}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Submit Button - MOBILE OPTIMIZED */}
        {formData.branch_id && !servicesLoading && !capstersLoading && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 sm:py-5 rounded-xl font-semibold text-base sm:text-lg hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation tap-target"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              '🔥 Booking Sekarang'
            )}
          </button>
        )}
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        *Nomor antrian akan diberikan otomatis setelah booking dikonfirmasi
      </p>
    </div>
  );
}
