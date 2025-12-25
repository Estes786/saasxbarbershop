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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ✂️ Capster Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Selamat datang, {profile?.customer_name || 'Capster'}!
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users size={18} />
              <span>Queue Management</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'predictions'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp size={18} />
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
          <p className="mt-2 text-xs text-gray-500">Powered by OASIS BI PRO</p>
        </div>
      </footer>
    </div>
  );
}
