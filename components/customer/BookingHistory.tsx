'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, User, Star, MapPin } from 'lucide-react';
import useSWR from 'swr';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  queue_number: number | null;
  customer_notes: string | null;
  rating: number | null;
  feedback: string | null;
  total_price: number;
  service_catalog: {
    service_name: string;
    base_price: number;
  } | null;
  capsters: {
    capster_name: string;
  } | null;
}

interface BookingHistoryProps {
  customerPhone: string;
}

// ✅ FIXED: SWR Fetcher for bookings with proper joins
const bookingsFetcher = async (customerPhone: string): Promise<Booking[]> => {
  const supabase = createClient();
  
  // 🔧 FIX: Proper join syntax for Supabase
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      booking_time,
      status,
      queue_number,
      customer_notes,
      rating,
      feedback,
      total_price,
      service_id,
      capster_id,
      service_catalog!bookings_service_id_fkey (
        service_name,
        base_price
      ),
      capsters!bookings_capster_id_fkey (
        capster_name
      )
    `)
    .eq('customer_phone', customerPhone)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
  
  return data || [];
};

export default function BookingHistory({ customerPhone }: BookingHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // ✅ Use SWR for automatic caching and revalidation
  const { data: bookings = [], isLoading: loading, error, mutate } = useSWR<Booking[]>(
    customerPhone ? `bookings-${customerPhone}` : null,
    () => bookingsFetcher(customerPhone),
    {
      revalidateOnFocus: true, // Refresh when user comes back
      dedupingInterval: 5000, // Cache for 5 seconds
      onError: (err) => {
        console.error('Error loading bookings:', err);
      }
    }
  );

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'in-progress': return 'Sedang Proses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-pulse">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
              filter === status
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'Semua' : getStatusText(status)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Booking</h3>
          <p className="text-gray-500">Mulai booking sekarang untuk melihat riwayat</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {booking.service_catalog?.service_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    <User className="w-4 h-4 inline mr-1" />
                    {booking.capsters?.capster_name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(booking.booking_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {booking.booking_time || 'N/A'}
                </div>
              </div>

              {booking.queue_number && (
                <div className="bg-purple-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-semibold text-purple-800">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Nomor Antrian: {booking.queue_number}
                  </p>
                </div>
              )}

              {booking.customer_notes && (
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-xs text-gray-600 mb-1">Catatan:</p>
                  <p className="text-sm text-gray-800">{booking.customer_notes}</p>
                </div>
              )}

              {booking.rating && (
                <div className="flex items-center mt-3">
                  <span className="text-sm text-gray-600 mr-2">Rating:</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < booking.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">
                  Rp {(booking.total_price || booking.service_catalog?.base_price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
