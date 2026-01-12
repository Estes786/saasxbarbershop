'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QueueItem {
  id: string;
  queue_number: number;
  booking_date: string;
  status: string;
  customer_notes: string | null;
  estimated_start_time: string | null;
  estimated_duration_minutes: number;
  barbershop_customers: {
    customer_name: string;
    customer_phone: string;
  };
  service_catalog: {
    service_name: string;
    duration_minutes: number;
  };
}

interface QueueDisplayProps {
  capsterId: string;
}

export default function QueueDisplay({ capsterId }: QueueDisplayProps) {
  const supabase = createClient();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayQueue();
    
    // Realtime subscription for queue updates
    const subscription = supabase
      .channel('booking-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Queue updated:', payload);
          loadTodayQueue();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [capsterId]);

  async function loadTodayQueue() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          queue_number,
          booking_date,
          status,
          customer_notes,
          estimated_start_time,
          estimated_duration_minutes,
          barbershop_customers (customer_name, customer_phone),
          service_catalog (service_name, duration_minutes)
        `)
        .eq('capster_id', capsterId)
        .gte('booking_date', `${today}T00:00:00`)
        .lte('booking_date', `${today}T23:59:59`)
        .in('status', ['pending', 'confirmed', 'in-progress'])
        .order('queue_number', { ascending: true });

      if (error) throw error;
      setQueue(data || []);
    } catch (err: any) {
      console.error('Error loading queue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, newStatus: string) {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ 
          status: newStatus,
          ...(newStatus === 'in-progress' && { actual_start_time: new Date().toISOString() }),
          ...(newStatus === 'completed' && { actual_end_time: new Date().toISOString() })
        })
        .eq('id', bookingId);

      if (error) throw error;
      loadTodayQueue();
    } catch (err: any) {
      console.error('Error updating status:', err);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-purple-500 animate-pulse" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-pulse">Loading queue...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Queue Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">Antrian Hari Ini</h2>
            <p className="text-orange-100">Total: {queue.length} customer</p>
          </div>
          <Users className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Antrian</h3>
          <p className="text-gray-500">Antrian akan muncul di sini saat ada booking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item, index) => {
            const isFirst = index === 0;
            const isNext = index === 1;
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl p-6 shadow-md transition-all ${
                  isFirst ? 'ring-4 ring-orange-400 ring-opacity-50' : ''
                } ${isNext ? 'ring-2 ring-blue-300 ring-opacity-30' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                      isFirst ? 'bg-gradient-to-br from-orange-500 to-pink-500' : 
                      isNext ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                      'bg-gray-400'
                    }`}>
                      {item.queue_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {item.barbershop_customers?.customer_name || 'Customer'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.service_catalog?.service_name}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(item.status)}
                </div>

                {item.customer_notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-600 mb-1">Catatan Customer:</p>
                    <p className="text-sm text-gray-800">{item.customer_notes}</p>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(item.booking_date).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>
                    ~{item.service_catalog?.duration_minutes || item.estimated_duration_minutes} menit
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => updateBookingStatus(item.id, 'confirmed')}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      ✓ Konfirmasi
                    </button>
                  )}
                  {item.status === 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(item.id, 'in-progress')}
                      className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      ▶ Mulai Layanan
                    </button>
                  )}
                  {item.status === 'in-progress' && (
                    <button
                      onClick={() => updateBookingStatus(item.id, 'completed')}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      ✓ Selesai
                    </button>
                  )}
                  {item.status !== 'cancelled' && (
                    <button
                      onClick={() => updateBookingStatus(item.id, 'cancelled')}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {isFirst && (
                  <div className="mt-3 text-center">
                    <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
                      👤 SEDANG DILAYANI
                    </span>
                  </div>
                )}
                {isNext && (
                  <div className="mt-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      🔜 SELANJUTNYA
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
