'use client';

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Users, TrendingUp, Clock } from "lucide-react";
import QueueManagement from "@/components/capster/QueueManagement";
import QueueDisplay from "@/components/capster/QueueDisplay";
import CustomerPredictionsPanel from "@/components/capster/CustomerPredictionsPanel";
import { createClient } from "@/lib/supabase/client";

export default function CapsterDashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [capsterId, setCapsterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'predictions'>('queue');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login/capster");
      } else if (!profile) {
        const timeout = setTimeout(() => {
          router.push("/login/capster");
        }, 5000);
        return () => clearTimeout(timeout);
      } else if (profile.role !== "capster") {
        if (profile.role === 'admin') {
          router.push("/dashboard/admin");
        } else if (profile.role === 'barbershop') {
          router.push("/dashboard/barbershop");
        } else {
          router.push("/dashboard/customer");
        }
      } else {
        loadCapsterData();
      }
    }
  }, [user, profile, authLoading, router]);

  async function loadCapsterData() {
    try {
      setLoading(true);

      // Load or create capster record
      let currentCapsterId = profile?.capster_id;

      if (!currentCapsterId && profile?.id) {
        // Try to find existing capster by user_id
        const { data: existingCapster } = await supabase
          .from("capsters")
          .select("id")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (existingCapster && 'id' in existingCapster) {
          currentCapsterId = (existingCapster as any).id;
        } else {
          // Create new capster record
          const { data: newCapster, error } = await supabase
            .from("capsters")
            .insert({
              user_id: profile?.id,
              capster_name: profile?.customer_name || profile?.email || 'Capster',
              phone: profile?.customer_phone || null,
              specialization: 'all',
              is_available: true,
            } as any)
            .select()
            .maybeSingle();

          if (!error && newCapster) {
            currentCapsterId = (newCapster as any).id;

            // Update user profile with capster_id
            await (supabase as any)
              .from("user_profiles")
              .update({ capster_id: (newCapster as any).id })
              .eq("id", profile?.id || '');
          }
        }
      }

      setCapsterId(currentCapsterId || null);
      setLoading(false);

    } catch (err) {
      console.error('Error loading capster data:', err);
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!capsterId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-4">Capster ID tidak ditemukan</p>
          <p className="text-gray-600 mb-6">Silakan hubungi admin untuk setup akun capster Anda.</p>
          <button
            onClick={() => signOut()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header - Fresha-inspired */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">✂️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Capster Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    Selamat datang, {profile?.customer_name || 'Capster'}!
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation - Enhanced */}
        <div className="flex space-x-3 mb-8 bg-white/60 backdrop-blur-lg rounded-2xl p-2 shadow-md border border-gray-200/50">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/30 scale-105'
                : 'text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users size={20} className={activeTab === 'queue' ? 'animate-pulse' : ''} />
              <span>Queue Management</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'predictions'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/30 scale-105'
                : 'text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp size={20} className={activeTab === 'predictions' ? 'animate-pulse' : ''} />
              <span>Customer Predictions</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'queue' && <QueueManagement capsterId={capsterId} />}
          {activeTab === 'predictions' && <CustomerPredictionsPanel />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <p>© 2025 Barbershop Kedungrandu. All rights reserved.</p>
          <p className="mt-1">Jl. Raya Kedungrandu, Patikraja, Banyumas</p>
          <p className="mt-2 text-xs text-gray-500">Powered by BALIK.LAGI</p>
        </div>
      </footer>
    </div>
  );
}
