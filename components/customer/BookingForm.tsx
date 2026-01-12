'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin } from 'lucide-react';
import BranchSelector from './BranchSelector';

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

export default function BookingForm({ customerPhone, customerName }: BookingFormProps) {
  const { showToast } = useToast();
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [capsters, setCapsters] = useState<Capster[]>([]);
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

  useEffect(() => {
    if (formData.branch_id) {
      loadServices();
      loadCapsters();
    }
  }, [formData.branch_id]);

  async function loadServices() {
    try {
      let query = supabase
        .from('service_catalog')
        .select('*')
        .eq('is_active', true);

      // FIXED: Support both specific branch AND NULL branches (global services)
      if (formData.branch_id) {
        query = query.or(`branch_id.eq.${formData.branch_id},branch_id.is.null`);
      }

      const { data, error } = await query.order('display_order');

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error('Error loading services:', err);
      showToast('error', 'Gagal memuat layanan');
    }
  }

  async function loadCapsters() {
    try {
      // FIXED: Use correct filters for active capsters
      let query = supabase
        .from('capsters')
        .select('id, capster_name, specialization, branch_id')
        .eq('is_active', true)
        .eq('status', 'approved');

      // FIXED: Support both specific branch AND NULL branches (available at all branches)
      if (formData.branch_id) {
        query = query.or(`branch_id.eq.${formData.branch_id},branch_id.is.null`);
      }

      const { data, error } = await query.order('capster_name');

      if (error) {
        console.error('Error from capsters table:', error);
        throw error;
      }
      
      // Transform data to match Capster interface (optimized)
      const transformedData = (data || []).map((capster: any) => ({
        id: capster.id,
        capster_id: capster.id,
        capster_name: capster.capster_name,
        full_name: capster.capster_name,
        customer_name: capster.capster_name,
        email: '',
        specialization: capster.specialization || 'all'
      }));
      
      setCapsters(transformedData);
    } catch (err: any) {
      console.error('Error loading capsters:', err);
      showToast('error', 'Gagal memuat capster');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.branch_id || !formData.service_id || !formData.capster_id || !formData.booking_date) {
      showToast('error', 'Mohon lengkapi semua data termasuk pilih cabang');
      return;
    }

    setLoading(true);

    try {
      const bookingDateTime = new Date(`${formData.booking_date}T${formData.booking_time}`);

      // Determine service tier based on selected service price (FIXED: using database constraint values)
      const basePrice = selectedService?.base_price || 0;
      const serviceTier = basePrice >= 50000 ? 'Premium' 
                        : basePrice >= 25000 ? 'Standard'  // Changed from 'Mastery' to 'Standard'
                        : 'Basic';

      // FIXED: Use simple date string 'YYYY-MM-DD' for DATE field (not ISO string)
      const { data, error } = await (supabase as any)
        .from('bookings')
        .insert({
          customer_phone: customerPhone,
          customer_name: customerName || 'Guest',
          branch_id: formData.branch_id,
          service_id: formData.service_id,
          capster_id: formData.capster_id,
          booking_date: formData.booking_date,  // Use 'YYYY-MM-DD' format directly
          booking_time: formData.booking_time,
          service_tier: serviceTier,
          customer_notes: formData.customer_notes,
          status: 'pending',
          booking_source: 'online',
          total_price: selectedService?.base_price || 0
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
  }

  const selectedService = services.find(s => s.id === formData.service_id);
  const selectedCapster = capsters.find(c => c.id === formData.capster_id);

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Booking Berhasil!</h2>
        <p className="text-gray-600 mb-2">Nomor Antrian Anda akan muncul di dashboard</p>
        <p className="text-sm text-gray-500">Kami akan mengirimkan notifikasi via WhatsApp</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Online 🔥</h2>
        <p className="text-gray-600">Pilih layanan dan capster favorit Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Selection - PHASE 3 */}
        <div>
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

        {/* Service Selection */}
        {formData.branch_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Pilih Layanan
            </label>
            <select
              value={formData.service_id}
              onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <p className="text-sm text-gray-500 mt-1">{selectedService.description}</p>
            )}
          </div>
        )}

        {/* Capster Selection */}
        {formData.branch_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Pilih Capster
            </label>
            <select
              value={formData.capster_id}
              onChange={(e) => setFormData({ ...formData, capster_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Pilih capster...</option>
              {capsters.length === 0 ? (
                <option disabled>Loading capsters...</option>
              ) : (
                capsters.map((capster) => (
                  <option key={capster.id} value={capster.id}>
                    {capster.capster_name} {capster.specialization && `- ${capster.specialization}`}
                  </option>
                ))
              )}
            </select>
            {selectedCapster && (
              <p className="text-sm text-gray-500 mt-1">
                Capster: {selectedCapster.capster_name} 
                {selectedCapster.specialization && ` - ${selectedCapster.specialization}`}
              </p>
            )}
          </div>
        )}

        {/* Date Selection */}
        {formData.branch_id && (
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tanggal Booking
          </label>
          <input
            type="date"
            value={formData.booking_date}
            onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        )}

        {/* Time Selection */}
        {formData.branch_id && (
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Waktu Booking
          </label>
          <select
            value={formData.booking_time}
            onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

        {/* Customer Notes */}
        {formData.branch_id && (
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Catatan (Opsional)
          </label>
          <textarea
            value={formData.customer_notes}
            onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
            placeholder="Contoh: Mau model rambut undercut, fade samping..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
          />
        </div>
        )}

        {/* Summary */}
        {selectedService && selectedCapster && formData.booking_date && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Ringkasan Booking:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Layanan: {selectedService.service_name}</li>
              <li>• Capster: {selectedCapster.capster_name}</li>
              <li>• Tanggal: {new Date(formData.booking_date).toLocaleDateString('id-ID')}</li>
              <li>• Waktu: {formData.booking_time}</li>
              <li>• Durasi: ~{selectedService.duration_minutes} menit</li>
              <li>• Harga: Rp {selectedService.base_price.toLocaleString()}</li>
            </ul>
          </div>
        )}

        {/* Submit Button */}
        {formData.branch_id && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Memproses...' : '🔥 Booking Sekarang'}
          </button>
        )}
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        *Nomor antrian akan diberikan otomatis setelah booking dikonfirmasi
      </p>
    </div>
  );
}
