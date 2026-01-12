"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { RefreshProvider } from "@/lib/context/RefreshContext";
import { ToastProvider } from "@/lib/context/ToastContext";
// R0.1: Hide advanced analytics
// import KHLTracker from "@/components/barbershop/KHLTracker";
// import ActionableLeads from "@/components/barbershop/ActionableLeads";
// import RevenueAnalytics from "@/components/barbershop/RevenueAnalytics";
import TransactionsManager from "@/components/barbershop/TransactionsManager";
import BookingMonitor from "@/components/admin/BookingMonitor";
import BranchManagement from "@/components/admin/BranchManagement";
import BranchAnalytics from "@/components/admin/BranchAnalytics";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut, LayoutDashboard, MapPin, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'analytics'>('overview');
  const supabase = createClient();

  useEffect(() => {
    checkOnboardingStatus();
  }, [profile]);

  async function checkOnboardingStatus() {
    // Only check if user is admin
    if (!profile || profile.role !== 'admin') {
      setCheckingOnboarding(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_onboarding_status');
      
      if (error) {
        console.error('Error checking onboarding:', error);
        setCheckingOnboarding(false);
        return;
      }

      // If admin hasn't completed onboarding, redirect to onboarding page
      if (data && !data.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setCheckingOnboarding(false);
    } catch (error) {
      console.error('Onboarding check error:', error);
      setCheckingOnboarding(false);
    }
  }

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa status onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <ToastProvider>
        <RefreshProvider>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
            {/* Header - R0.1: Simplified */}
            <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <LayoutDashboard className="text-white" size={20} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          Admin Dashboard
                        </h1>
                        <p className="text-xs text-gray-500">
                          🚀 BALIK.LAGI - Kondisi Hari Ini
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right bg-purple-50 rounded-xl px-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">{profile?.email}</p>
                      <p className="text-xs text-purple-600 font-medium">Admin Access</p>
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
              </div>
            </header>

            {/* Main Content - R0.1: Simplified */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Welcome Banner - R0.1: Calmer tone */}
              <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
                <h2 className="text-3xl font-bold mb-2">Selamat datang, Owner! 👋</h2>
                <p className="text-purple-100 text-lg">Ringkasan barbershop hari ini.</p>
              </div>

              {/* Tab Navigation - PHASE 3: Multi-Location */}
              <div className="mb-6 bg-white rounded-xl shadow-sm p-2 flex space-x-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'overview'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard size={20} />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('branches')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'branches'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin size={20} />
                  <span>Branches</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'analytics'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Analytics</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <>
                    {/* Booking Monitor - Keep for basic overview */}
                    <section className="transform hover:scale-[1.01] transition-transform duration-300">
                      <BookingMonitor />
                    </section>

                    {/* R0.1: Hidden Advanced Analytics */}
                    {/* 
                    <section className="transform hover:scale-[1.01] transition-transform duration-300">
                      <KHLTracker />
                    </section>

                    <section className="transform hover:scale-[1.01] transition-transform duration-300">
                      <ActionableLeads />
                    </section>

                    <section className="transform hover:scale-[1.01] transition-transform duration-300">
                      <RevenueAnalytics />
                    </section>
                    */}

                    {/* Transactions Manager - Keep for basic data view */}
                    <section className="transform hover:scale-[1.01] transition-transform duration-300">
                      <TransactionsManager />
                    </section>

                    {/* R0.1: Information Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                      <p className="text-blue-800 font-semibold mb-2">📊 Release 0.1 - Menjaga Aliran Dasar</p>
                      <p className="text-blue-700 text-sm">
                        Dashboard ini fokus pada informasi penting hari ini: booking, antrian, dan riwayat sederhana.
                        <br />
                        <span className="font-medium">Target tracking & analytics mendalam akan hadir di update berikutnya.</span>
                      </p>
                    </div>
                  </>
                )}

                {/* BRANCHES TAB - PHASE 3 */}
                {activeTab === 'branches' && (
                  <section className="transform hover:scale-[1.01] transition-transform duration-300">
                    <BranchManagement />
                  </section>
                )}

                {/* ANALYTICS TAB - PHASE 3 */}
                {activeTab === 'analytics' && (
                  <section className="transform hover:scale-[1.01] transition-transform duration-300">
                    <BranchAnalytics />
                  </section>
                )}
              </div>
            </main>

            {/* Footer - Enhanced */}
            <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <p className="text-sm font-medium text-gray-700">
                  © 2025 <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">BALIK.LAGI</span> - Barbershop Management Platform
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Sekali Cocok, Pengen Balik Lagi
                </p>
                <p className="mt-3 text-xs text-purple-600 font-medium">
                  Built with ❤️ for barbershop Indonesia
                </p>
              </div>
            </footer>
          </div>
        </RefreshProvider>
      </ToastProvider>
    </AuthGuard>
  );
}
