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
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <LayoutDashboard className="text-purple-600" size={24} />
                      <h1 className="text-2xl font-bold text-gray-900">
                        Admin Dashboard
                      </h1>
                    </div>
                    <p className="text-sm text-gray-600">
                      🚀 OASIS BI PRO x Barbershop Kedungrandu - Data Monetization Engine
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
                      <p className="text-xs text-gray-500">Admin Account</p>
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
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="space-y-8">
                {/* Booking Monitor - NEW! */}
                <section>
                  <BookingMonitor />
                </section>

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

                {/* Transactions Manager */}
                <section>
                  <TransactionsManager />
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
        </RefreshProvider>
      </ToastProvider>
    </AuthGuard>
  );
}
