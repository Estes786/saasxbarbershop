"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import KHLTracker from "@/components/barbershop/KHLTracker";
import ActionableLeads from "@/components/barbershop/ActionableLeads";
import RevenueAnalytics from "@/components/barbershop/RevenueAnalytics";

export default function BarbershopDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from("barbershop_transactions")
          .select("count")
          .limit(1);

        if (error) throw error;
        setLoading(false);
      } catch (err) {
        console.error("Error connecting to Supabase:", err);
        setError("Gagal koneksi ke database. Periksa konfigurasi Supabase.");
        setLoading(false);
      }
    }

    testConnection();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🚀 OASIS BI PRO x Barbershop Kedungrandu
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Data Monetization Dashboard - Real-time Insights
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* KHL Progress Tracker */}
          <section>
            <KHLTracker />
          </section>

          {/* Actionable Leads */}
          <section>
            <ActionableLeads />
          </section>

          {/* Revenue Analytics */}
          <section>
            <RevenueAnalytics />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <p>
            © 2025 OASIS BI PRO x Barbershop Kedungrandu. All rights reserved.
          </p>
          <p className="mt-1">
            Jl. Raya Kedungrandu, Patikraja, Banyumas
          </p>
        </div>
      </footer>
    </div>
  );
}
