'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { Clock, User, CheckCircle, XCircle, PlayCircle, Users, Calendar } from 'lucide-react';

interface QueueItem {
  id: string;
  customer_phone: string;
  customer_name: string;
  service_name: string;
  booking_date: string;
  queue_number: number;
  queue_position: number;
  status: string;
  estimated_start_time: string;
  estimated_duration_minutes: number;
  customer_notes: string;
  service_duration: number;
}

interface QueueManagementProps {
  capsterId: string;
}

export default function QueueManagement({ capsterId }: QueueManagementProps) {
  const { showToast } = useToast();
  const supabase = createClient();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentServing, setCurrentServing] = useState<QueueItem | null>(null);

  useEffect(() => {
    loadQueue();
    
    // Real-time subscription
    const channel = supabase
      .channel('queue_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [capsterId]);

  async function loadQueue() {
    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Load bookings directly from bookings table
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_catalog (
            service_name,
            duration_minutes
          )
        `)
        .eq('capster_id', capsterId)
        .gte('booking_date', today.toISOString())
        .lt('booking_date', tomorrow.toISOString())
        .in('status', ['pending', 'confirmed', 'in-progress', 'completed'])
        .order('booking_date');

      if (error) {
        console.error('Error loading bookings:', error);
        throw error;
      }

      // Transform data to match QueueItem interface
      const queueData = (data || []).map((booking: any, index: number) => ({
        id: booking.id,
        customer_phone: booking.customer_phone || '',
        customer_name: booking.customer_name || booking.customer_phone || 'Customer',
        service_name: booking.service_catalog?.service_name || 'Service',
        booking_date: booking.booking_date,
        queue_number: booking.queue_number || (index + 1),
        queue_position: index + 1,
        status: booking.status,
        estimated_start_time: booking.booking_date,
        estimated_duration_minutes: booking.service_catalog?.duration_minutes || 30,
        customer_notes: booking.customer_notes || '',
        service_duration: booking.service_catalog?.duration_minutes || 30
      }));

      setQueue(queueData);
      
      // Find currently serving customer
      const serving = queueData.find((item: any) => item.status === 'in-progress');
      setCurrentServing(serving || null);

    } catch (err: any) {
      console.error('Error loading queue:', err);
      showToast('error', 'Gagal memuat antrian: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, newStatus: string) {
    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'in-progress') {
        updates.actual_start_time = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.actual_end_time = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      if (error) throw error;

      showToast('success', `Status diupdate: ${newStatus}`);
      loadQueue();

    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('error', 'Gagal update status');
    }
  }

  async function startServing(booking: QueueItem) {
    // Complete current serving if any
    if (currentServing) {
      await updateBookingStatus(currentServing.id, 'completed');
    }

    // Start new serving
    await updateBookingStatus(booking.id, 'in-progress');
  }

  const pendingQueue = queue.filter(item => item.status === 'pending' || item.status === 'confirmed');
  const completedToday = queue.filter(item => item.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <Users className="w-8 h-8 mb-2" />
          <div className="text-3xl font-bold">{pendingQueue.length}</div>
          <div className="text-green-100 text-sm">Antrian Menunggu</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <PlayCircle className="w-8 h-8 mb-2" />
          <div className="text-3xl font-bold">{currentServing ? '1' : '0'}</div>
          <div className="text-blue-100 text-sm">Sedang Dilayani</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <CheckCircle className="w-8 h-8 mb-2" />
          <div className="text-3xl font-bold">{completedToday}</div>
          <div className="text-purple-100 text-sm">Selesai Hari Ini</div>
        </div>
      </div>

      {/* Currently Serving */}
      {currentServing && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900 flex items-center">
              <PlayCircle className="w-6 h-6 mr-2" />
              Sedang Dilayani
            </h3>
            <span className="text-3xl font-bold text-blue-600">
              #{currentServing.queue_number}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-semibold text-gray-900">{currentServing.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Layanan</p>
              <p className="font-semibold text-gray-900">{currentServing.service_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durasi</p>
              <p className="font-semibold text-gray-900">~{currentServing.service_duration} menit</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">No. HP</p>
              <p className="font-semibold text-gray-900">{currentServing.customer_phone}</p>
            </div>
          </div>

          {currentServing.customer_notes && (
            <div className="bg-white rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">Catatan Customer:</p>
              <p className="text-gray-800">{currentServing.customer_notes}</p>
            </div>
          )}

          <button
            onClick={() => updateBookingStatus(currentServing.id, 'completed')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Selesai Layanan
          </button>
        </div>
      )}

      {/* Queue List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-green-600" />
          Daftar Antrian Hari Ini
        </h3>

        {pendingQueue.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Belum ada antrian</p>
            <p className="text-sm">Antrian baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-green-600">
                        #{item.queue_number}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.customer_name}</h4>
                      <p className="text-sm text-gray-600">{item.service_name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">Estimasi</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(item.estimated_start_time).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>

                {item.customer_notes && (
                  <div className="bg-gray-50 rounded p-2 mb-3">
                    <p className="text-xs text-gray-600 mb-1">Catatan:</p>
                    <p className="text-sm text-gray-800">{item.customer_notes}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => startServing(item)}
                    disabled={!!currentServing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Mulai Layani
                  </button>

                  <button
                    onClick={() => updateBookingStatus(item.id, 'cancelled')}
                    className="px-4 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        <Clock className="w-4 h-4 inline mr-1" />
        Real-time updates aktif
      </div>
    </div>
  );
}
