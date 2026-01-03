'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, User, Star, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
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

// 🔧 Normalize phone number (remove +62, leading 0, spaces)
const normalizePhone = (phone: string): string => {
  return phone.replace(/^\+?62/, '0').replace(/\s/g, '').replace(/-/g, '');
};

// ✅ OPTIMIZED: SWR Fetcher with multiple phone formats
const bookingsFetcher = async (customerPhone: string): Promise<Booking[]> => {
  const supabase = createClient();
  
  // Try multiple phone formats
  const normalized = normalizePhone(customerPhone);
  const withPlus62 = '+62' + normalized.substring(1);
  const phoneVariants = [customerPhone, normalized, withPlus62];
  
  console.log('🔍 Searching bookings with phone variants:', phoneVariants);
  
  // 🔧 FIX: Use alternative join syntax (simpler and more reliable)
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service_catalog:service_id (service_name, base_price),
      capsters:capster_id (capster_name)
    `)
    .in('customer_phone', phoneVariants)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  if (error) {
    console.error('❌ Error fetching bookings:', error);
    throw error;
  }
  
  console.log(`✅ Found ${data?.length || 0} bookings`);
  return data || [];
};

export default function BookingHistory({ customerPhone }: BookingHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Use SWR with optimized settings
  const { data: bookings = [], isLoading: loading, error, mutate } = useSWR<Booking[]>(
    customerPhone ? `bookings-${normalizePhone(customerPhone)}` : null,
    () => bookingsFetcher(customerPhone),
    {
      revalidateOnFocus: true, // Auto-refresh when tab becomes active
      revalidateOnReconnect: true, // Auto-refresh when reconnect
      dedupingInterval: 2000, // Prevent duplicate requests within 2s
      onSuccess: () => {
        setLastSync(new Date());
        setIsRefreshing(false);
      },
      onError: (err) => {
        console.error('❌ Error loading bookings:', err);
        setIsRefreshing(false);
      }
    }
  );

  // Log when component mounts
  useEffect(() => {
    console.log('📖 BookingHistory mounted with phone:', customerPhone);
  }, [customerPhone]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
  };

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
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <p className="text-center text-gray-500 mt-4 text-sm">
          Memuat riwayat booking...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Gagal Memuat Riwayat</h3>
        <p className="text-red-600 mb-4">{error.message || 'Terjadi kesalahan'}</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-gray-800">Riwayat Booking</h3>
          <p className="text-xs text-gray-500">
            Terakhir diperbarui: {lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

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
            {status === 'all' && bookings.length > 0 && (
              <span className="ml-2 bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {bookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {filter === 'all' ? 'Belum Ada Booking' : `Tidak ada booking ${getStatusText(filter)}`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'Mulai booking sekarang untuk melihat riwayat' 
              : `Belum ada booking dengan status ${getStatusText(filter)}`}
          </p>
          <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg inline-block">
            <p className="font-mono">📱 Phone: {customerPhone}</p>
            <p className="font-mono">🔍 Normalized: {normalizePhone(customerPhone)}</p>
          </div>
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
