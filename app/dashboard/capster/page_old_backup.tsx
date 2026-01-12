"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { predictMultipleCustomers, getUpcomingVisits, getChurnRiskCustomers, type CustomerVisitHistory, type PredictionResult } from "@/lib/analytics/customerPrediction";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface CapsterStats {
  total_customers_served: number;
  total_revenue_generated: number;
  rating: number;
  is_available: boolean;
}

export default function CapsterDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [capsterStats, setCapsterStats] = useState<CapsterStats | null>(null);
  const [upcomingVisits, setUpcomingVisits] = useState<PredictionResult[]>([]);
  const [churnRiskCustomers, setChurnRiskCustomers] = useState<PredictionResult[]>([]);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [capsterId, setCapsterId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 Dashboard effect triggered:', { authLoading, user: !!user, profile });
    
    if (!authLoading) {
      if (!user) {
        console.log('❌ No user, redirecting to login');
        router.push("/login/capster");
      } else if (!profile) {
        console.warn('⚠️ User exists but profile not loaded yet, waiting...');
        // Wait for profile to load
        const timeout = setTimeout(() => {
          console.error('❌ Profile loading timeout, redirecting to login');
          router.push("/login/capster");
        }, 5000); // 5 second timeout
        
        return () => clearTimeout(timeout);
      } else if (profile.role !== "capster") {
        console.log(`❌ Wrong role: ${profile.role}, redirecting`);
        if (profile.role === 'admin') {
          router.push("/dashboard/admin");
        } else if (profile.role === 'barbershop') {
          router.push("/dashboard/barbershop");
        } else {
          router.push("/dashboard/customer");
        }
      } else {
        console.log('✅ Capster authenticated, loading dashboard data');
        loadDashboardData();
      }
    }
  }, [user, profile, authLoading, router]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // 1. Load or create capster record if not exists
      let currentCapsterId = profile?.capster_id;
      
      if (!currentCapsterId) {
        console.log('⚠️ No capster_id found, attempting to create capster record...');
        // Try to create capster record
        const { data: capsterData, error: capsterError } = await supabase
          .from("capsters")
          .insert({
            user_id: profile?.id,
            capster_name: profile?.customer_name || profile?.email || 'Capster',
            phone: profile?.customer_phone || null,
            specialization: 'all',
            is_available: true,
          } as any)
          .select()
          .single();

        if (!capsterError && capsterData) {
          const newCapsterId = (capsterData as any).id as string;
          currentCapsterId = newCapsterId;
          setCapsterId(newCapsterId);
          console.log('✅ Capster record created:', newCapsterId);
          
          // Update user profile with capster_id
          // @ts-ignore - Supabase types not generated for capster_id field yet
          const { error: updateError } = await (supabase as any)
            .from("user_profiles")
            .update({ capster_id: newCapsterId })
            .eq("id", profile?.id);
            
          if (!updateError) {
            console.log('✅ User profile updated with capster_id');
          }
        } else {
          console.error('❌ Failed to create capster record:', capsterError);
        }
      } else if (currentCapsterId) {
        setCapsterId(currentCapsterId);
      }

      // 2. Load capster stats (if capster_id exists)
      if (currentCapsterId) {
        // @ts-ignore - Supabase types not generated for capsters table yet
        const { data: capsterData } = await supabase
          .from("capsters")
          .select("*")
          .eq("id", currentCapsterId)
          .single();

        if (capsterData) {
          setCapsterStats({
            total_customers_served: (capsterData as any).total_customers_served || 0,
            total_revenue_generated: (capsterData as any).total_revenue_generated || 0,
            rating: (capsterData as any).rating || 0,
            is_available: (capsterData as any).is_available || false,
          });
        }
      }

      // 3. Load customer visit history for predictions
      // @ts-ignore - Supabase types not generated for barbershop_customers table yet
      const { data: customers } = await supabase
        .from("barbershop_customers")
        .select("*")
        .gte("total_visits", 1)
        .order("last_visit_date", { ascending: false });

      if (customers) {
        // Transform data for prediction algorithm
        const customerHistory: CustomerVisitHistory[] = customers.map((c: any) => ({
          customer_phone: c.customer_phone,
          customer_name: c.customer_name,
          total_visits: c.total_visits,
          first_visit_date: c.first_visit_date,
          last_visit_date: c.last_visit_date,
          average_days_between_visits: c.average_days_between_visits,
          visit_dates: [c.first_visit_date, c.last_visit_date].filter(Boolean),
          total_revenue: c.total_revenue || 0,
          average_atv: c.average_atv || 0,
        }));

        // Get predictions
        const upcoming = getUpcomingVisits(customerHistory, 7);
        const churnRisk = getChurnRiskCustomers(customerHistory);

        setUpcomingVisits(upcoming);
        setChurnRiskCustomers(churnRisk);
      }

      // 4. Load today's bookings (if capster_id exists)
      if (currentCapsterId) {
        const today = format(new Date(), "yyyy-MM-dd");
        // @ts-ignore - Supabase types not generated for bookings table yet
        const { data: bookings } = await supabase
          .from("bookings")
          .select(`
            *,
            service:service_catalog(service_name, base_price)
          `)
          .eq("booking_date", today)
          .eq("capster_id", currentCapsterId)
          .order("booking_time", { ascending: true });

        if (bookings) {
          setTodayBookings(bookings);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  }

  async function toggleAvailability() {
    if (!capsterId) {
      console.error('Cannot toggle availability: No capster_id');
      return;
    }

    const newStatus = !capsterStats?.is_available;
    
    const { error } = await supabase
      .from("capsters")
      // @ts-ignore - Supabase types not generated for capsters table yet
      .update({ is_available: newStatus })
      .eq("id", capsterId);

    if (!error) {
      setCapsterStats({ ...capsterStats!, is_available: newStatus });
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat dashboard capster...</p>
          <p className="text-gray-500 text-sm mt-2">
            {authLoading ? 'Memverifikasi autentikasi...' : 'Memuat data dashboard...'}
          </p>
        </div>
      </div>
    );
  }
  
  // CRITICAL: Check if profile is loaded before rendering dashboard
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">
            Kami tidak dapat memuat profil Anda. Silakan coba login kembali.
          </p>
          <button
            onClick={() => router.push('/login/capster')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Capster</h1>
              <p className="text-green-100 mt-1">Selamat datang, {profile?.customer_name || "Capster"}!</p>
            </div>
            <button
              onClick={toggleAvailability}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                capsterStats?.is_available
                  ? "bg-green-500 hover:bg-green-400"
                  : "bg-gray-500 hover:bg-gray-400"
              }`}
            >
              {capsterStats?.is_available ? "✅ Available" : "⏸️ Unavailable"}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-green-600">
                  {capsterStats?.total_customers_served || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  Rp {(capsterStats?.total_revenue_generated || 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-3xl font-bold text-green-600">
                  {capsterStats?.rating?.toFixed(1) || "0.0"} ⭐
                </p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Bookings</p>
                <p className="text-3xl font-bold text-green-600">{todayBookings.length}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Visits Prediction (CORE FEATURE!) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🔮</span>
              Prediksi Customer akan Datang
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Customer yang diprediksi akan datang dalam 7 hari ke depan
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingVisits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada prediksi customer saat ini</p>
              ) : (
                upcomingVisits.map((prediction, idx) => (
                  <div
                    key={prediction.customer_phone}
                    className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{prediction.customer_name}</p>
                        <p className="text-sm text-gray-600">{prediction.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {prediction.days_until_visit === 0
                            ? "Hari ini!"
                            : prediction.days_until_visit === 1
                            ? "Besok"
                            : `${prediction.days_until_visit} hari lagi`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Confidence: {prediction.confidence_score}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{prediction.recommendation}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Churn Risk Customers */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              Customer Berisiko Churn
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Customer yang sudah lama tidak datang - butuh retention action!
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {churnRiskCustomers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Semua customer dalam kondisi baik! 💚</p>
              ) : (
                churnRiskCustomers.map((customer) => (
                  <div
                    key={customer.customer_phone}
                    className="border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-red-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{customer.customer_name}</p>
                        <p className="text-sm text-gray-600">{customer.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.churn_risk === "high"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {customer.churn_risk === "high" ? "HIGH RISK" : "MEDIUM RISK"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 mt-2">{customer.recommendation}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Queue */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Jadwal Hari Ini
            </h2>
            {todayBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Tidak ada booking hari ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Waktu</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Layanan</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {todayBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{booking.booking_time}</td>
                        <td className="px-4 py-3 text-sm font-medium">{booking.customer_name}</td>
                        <td className="px-4 py-3 text-sm">{booking.service?.service_name || "-"}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          Rp {(booking.service?.base_price || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
