'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface Booking {
  id: string;
  customer_phone: string;
  customer_name: string;
  capster_name: string;
  service_name: string;
  booking_date: string;
  status: string;
  customer_notes: string;
  created_at: string;
  base_price: number;
  duration_minutes: number;
}

export default function BookingMonitor() {
  const { showToast } = useToast();
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('today');

  useEffect(() => {
    loadBookings();
    
    // Real-time subscription
    const channel = supabase
      .channel('admin_bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function loadBookings() {
    try {
      setLoading(true);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          service_catalog (
            service_name,
            base_price,
            duration_minutes
          )
        `)
        .order('booking_date', { ascending: false });

      // Apply filters
      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        query = query
          .gte('booking_date', today.toISOString())
          .lt('booking_date', tomorrow.toISOString());
      } else if (filter === 'pending') {
        query = query.in('status', ['pending', 'confirmed']);
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get capster names from user_profiles
      const bookingsWithCapsterNames = await Promise.all(
        (data || []).map(async (booking: any) => {
          let capsterName = 'Unknown Capster';
          
          if (booking.capster_id) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('full_name, customer_name, email')
              .eq('capster_id', booking.capster_id)
              .single();
            
            if (profileData) {
              capsterName = (profileData as any).full_name || (profileData as any).customer_name || (profileData as any).email;
            }
          }

          return {
            id: booking.id,
            customer_phone: booking.customer_phone || '',
            customer_name: booking.customer_name || booking.customer_phone || 'Customer',
            capster_name: capsterName,
            service_name: booking.service_catalog?.service_name || 'Service',
            booking_date: booking.booking_date,
            status: booking.status,
            customer_notes: booking.customer_notes || '',
            created_at: booking.created_at,
            base_price: booking.service_catalog?.base_price || 0,
            duration_minutes: booking.service_catalog?.duration_minutes || 0
          };
        })
      );

      setBookings(bookingsWithCapsterNames);

    } catch (err: any) {
      console.error('Error loading bookings:', err);
      showToast('error', 'Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    inProgress: bookings.filter(b => b.status === 'in-progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.base_price || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              📅 Booking Monitor
            </h2>
            <p className="text-sm text-gray-600 mt-1">Real-time monitoring semua booking</p>
          </div>
          <button
            onClick={() => loadBookings()}
            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-xs text-blue-600">Total Booking</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">{stats.inProgress}</div>
            <div className="text-xs text-green-600">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-700">{stats.completed}</div>
            <div className="text-xs text-purple-600">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-pink-700">
              Rp {(stats.totalRevenue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-pink-600">Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mt-4">
          {['all', 'today', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' && 'Semua'}
              {f === 'today' && 'Hari Ini'}
              {f === 'pending' && 'Pending'}
              {f === 'completed' && 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List */}
      <div className="p-6">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Belum ada booking</p>
            <p className="text-sm">Booking akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{booking.customer_name}</h4>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span>{booking.status}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Capster</p>
                        <p className="font-medium text-gray-900">{booking.capster_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Layanan</p>
                        <p className="font-medium text-gray-900">{booking.service_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Tanggal & Waktu</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.booking_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Harga</p>
                        <p className="font-medium text-gray-900">Rp {booking.base_price.toLocaleString()}</p>
                      </div>
                    </div>

                    {booking.customer_notes && (
                      <div className="bg-gray-50 rounded p-2 mt-2">
                        <p className="text-xs text-gray-600">Catatan:</p>
                        <p className="text-sm text-gray-800">{booking.customer_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-right text-xs text-gray-500">
                    <Phone className="w-3 h-3 inline mr-1" />
                    {booking.customer_phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time indicator */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          Real-time monitoring aktif
        </div>
      </div>
    </div>
  );
}
