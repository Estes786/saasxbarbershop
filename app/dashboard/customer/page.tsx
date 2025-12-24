"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut, User, Gift, Calendar, History } from "lucide-react";
import LoyaltyTracker from "@/components/customer/LoyaltyTracker";
import { useState, useEffect } from "react";

export default function CustomerDashboard() {
  const { signOut, profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'loyalty' | 'booking' | 'history'>('loyalty');

  // DEBUG: Log user and profile info on mount
  useEffect(() => {
    console.log('🏠 Customer Dashboard mounted');
    console.log('👤 User:', user);
    console.log('📋 Profile:', profile);
    if (profile) {
      console.log('🆔 User ID:', user?.id);
      console.log('📧 Email:', profile.email);
      console.log('👨 Name:', profile.customer_name);
      console.log('📱 Phone:', profile.customer_phone);
    }
  }, [user, profile]);

  return (
    <AuthGuard allowedRoles={['customer']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Selamat Datang, {profile?.customer_name || 'Customer'}! 👋
                </h1>
                <p className="text-sm text-gray-600">
                  Barbershop Kedungrandu - Dashboard Anda
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === 'loyalty'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Gift size={18} />
                <span>Loyalitas</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === 'booking'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Calendar size={18} />
                <span>Booking</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <History size={18} />
                <span>Riwayat</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'loyalty' && (
              <div>
                <LoyaltyTracker />
                
                {/* Quick Info */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Akun</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{profile?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama:</span>
                      <span className="font-medium text-gray-900">{profile?.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nomor HP:</span>
                      <span className="font-medium text-gray-900">{profile?.customer_phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <Calendar size={48} className="mx-auto text-purple-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sistem Booking</h3>
                <p className="text-gray-600 mb-6">
                  Fitur booking online sedang dalam pengembangan. Segera hadir!
                </p>
                <div className="bg-purple-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-700 mb-2">🚀 Fitur yang akan datang:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Pilih jadwal cukur online</li>
                    <li>• Request capster favorit</li>
                    <li>• Reminder otomatis via WhatsApp</li>
                    <li>• Lihat estimasi antrian</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <History size={48} className="mx-auto text-purple-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Riwayat Kunjungan</h3>
                <p className="text-gray-600 mb-6">
                  Fitur riwayat kunjungan sedang dalam pengembangan. Segera hadir!
                </p>
                <div className="bg-purple-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-700 mb-2">🚀 Fitur yang akan datang:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Lihat semua transaksi Anda</li>
                    <li>• Detail layanan yang pernah diambil</li>
                    <li>• Track progress kupon</li>
                    <li>• Download invoice</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
            <p>© 2025 Barbershop Kedungrandu. All rights reserved.</p>
            <p className="mt-1">Jl. Raya Kedungrandu, Patikraja, Banyumas</p>
            <p className="mt-2 text-xs text-gray-500">Powered by OASIS BI PRO</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
