"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { RefreshProvider } from "@/lib/context/RefreshContext";
import { ToastProvider } from "@/lib/context/ToastContext";
// R0.1: Hide advanced analytics components
// import KHLTracker from "@/components/barbershop/KHLTracker";
// import ActionableLeads from "@/components/barbershop/ActionableLeads";
// import RevenueAnalytics from "@/components/barbershop/RevenueAnalytics";
import TransactionsManager from "@/components/barbershop/TransactionsManager";

interface BookingStats {
  today: number;
  completed: number;
  cancelled: number;
}

interface Booking {
  id: string;
  status: string;
}

export default function BarbershopDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BookingStats>({ today: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    async function loadBasicStats() {
      try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Count today's bookings
        const { data: todayBookings, error: todayError } = await supabase
          .from("bookings")
          .select("id, status")
          .gte("booking_date", today.toISOString())
          .lt("booking_date", tomorrow.toISOString());

        if (todayError) throw todayError;

        // Calculate stats
        const bookings = (todayBookings || []) as Booking[];
        const completed = bookings.filter(b => b.status === "completed").length;
        const cancelled = bookings.filter(b => b.status === "cancelled").length;
        
        setStats({
          today: bookings.length,
          completed,
          cancelled
        });
        setLoading(false);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Gagal memuat data. Periksa koneksi database.");
        setLoading(false);
      }
    }

    loadBasicStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
          <h2 className="text-red-800 font-bold text-lg mb-2">❌ Error</h2>
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-600 mt-4">
            Pastikan environment variables sudah di-set:
            <br />
            - NEXT_PUBLIC_SUPABASE_URL
            <br />- NEXT_PUBLIC_SUPABASE_ANON_KEY
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <RefreshProvider>
        <div className="min-h-screen bg-gray-50">
        {/* Header - R0.1: Simplified */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 BALIK.LAGI
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kondisi Hari Ini - Demo Dashboard
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* R0.1: Simple Stats Cards */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Booking Hari Ini */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Booking Hari Ini</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  </div>
                </div>

                {/* Selesai */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Selesai</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                </div>

                {/* Batal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Batal</p>
                      <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">❌</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* R0.1: Hidden Advanced Features */}
            {/* 
            <section>
              <KHLTracker />
            </section>

            <section>
              <ActionableLeads />
            </section>

            <section>
              <RevenueAnalytics />
            </section>
            */}

            {/* Transactions Manager - Keep for basic data view */}
            <section>
              <TransactionsManager />
            </section>

            {/* R0.1: Note about advanced features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800 font-semibold mb-2">📊 Release 0.1 - Fokus Ketenangan</p>
              <p className="text-blue-700 text-sm">
                Dashboard ini menampilkan informasi dasar yang perlu Anda ketahui hari ini.
                <br />
                Analytics & insights mendalam akan tersedia di release berikutnya.
              </p>
            </div>
          </div>
        </main>
      </div>
      </RefreshProvider>
    </ToastProvider>
  );
}
