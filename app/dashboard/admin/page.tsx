"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { RefreshProvider } from "@/lib/context/RefreshContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import KHLTracker from "@/components/barbershop/KHLTracker";
import ActionableLeads from "@/components/barbershop/ActionableLeads";
import RevenueAnalytics from "@/components/barbershop/RevenueAnalytics";
import TransactionsManager from "@/components/barbershop/TransactionsManager";
import BookingMonitor from "@/components/admin/BookingMonitor";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();

  return (
    <AuthGuard allowedRoles={['admin']}>
      <ToastProvider>
        <RefreshProvider>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
            {/* Header - Fresha-inspired */}
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
                          🚀 BALIK.LAGI - Business Intelligence
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

            {/* Main Content - Enhanced with modern spacing */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Welcome Banner */}
              <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
                <h2 className="text-3xl font-bold mb-2">Welcome back, Owner! 👋</h2>
                <p className="text-purple-100 text-lg">Here's what's happening with your business today.</p>
              </div>

              <div className="space-y-6">
                {/* Booking Monitor - NEW! */}
                <section className="transform hover:scale-[1.01] transition-transform duration-300">
                  <BookingMonitor />
                </section>

                {/* KHL Progress Tracker */}
                <section className="transform hover:scale-[1.01] transition-transform duration-300">
                  <KHLTracker />
                </section>

                {/* Actionable Leads */}
                <section className="transform hover:scale-[1.01] transition-transform duration-300">
                  <ActionableLeads />
                </section>

                {/* Revenue Analytics */}
                <section className="transform hover:scale-[1.01] transition-transform duration-300">
                  <RevenueAnalytics />
                </section>

                {/* Transactions Manager */}
                <section className="transform hover:scale-[1.01] transition-transform duration-300">
                  <TransactionsManager />
                </section>
              </div>
            </main>

            {/* Footer - Enhanced */}
            <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <p className="text-sm font-medium text-gray-700">
                  © 2025 <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">BALIK.LAGI</span> - Barbershop Management Platform
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  🏢 Barbershop Kedungrandu • Jl. Raya Kedungrandu, Patikraja, Banyumas
                </p>
                <p className="mt-3 text-xs text-purple-600 font-medium">
                  Built with ❤️ for barbershop owners
                </p>
              </div>
            </footer>
          </div>
        </RefreshProvider>
      </ToastProvider>
    </AuthGuard>
  );
}
