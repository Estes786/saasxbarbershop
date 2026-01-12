"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut, User, Gift, Calendar, History } from "lucide-react";
import LoyaltyTracker from "@/components/customer/LoyaltyTracker";
import BookingFormOptimized from "@/components/customer/BookingFormOptimized";
import BookingHistory from "@/components/customer/BookingHistory";
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        {/* Header - Fresha-inspired */}
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                  Selamat Datang, {profile?.customer_name || 'Customer'}! 👋
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  🏢 BALIK.LAGI - Barbershop Kedungrandu
                </p>
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation - Enhanced */}
          <div className="flex space-x-3 mb-8 bg-white/60 backdrop-blur-lg rounded-2xl p-2 shadow-md border border-gray-200/50">
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'loyalty'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30 scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Gift size={20} className={activeTab === 'loyalty' ? 'animate-pulse' : ''} />
                <span>Loyalitas</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'booking'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30 scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Calendar size={20} className={activeTab === 'booking' ? 'animate-pulse' : ''} />
                <span>Booking</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30 scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <History size={20} className={activeTab === 'history' ? 'animate-pulse' : ''} />
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
              <div>
                {profile?.customer_phone ? (
                  <BookingFormOptimized 
                    customerPhone={profile.customer_phone} 
                    customerName={profile.customer_name}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800">Nomor HP tidak tersedia. Silakan lengkapi profil Anda.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {profile?.customer_phone ? (
                  <BookingHistory customerPhone={profile.customer_phone} />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800">Nomor HP tidak tersedia. Silakan lengkapi profil Anda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
            <p>© 2025 Barbershop Kedungrandu. All rights reserved.</p>
            <p className="mt-1">Jl. Raya Kedungrandu, Patikraja, Banyumas</p>
            <p className="mt-2 text-xs text-gray-500">Powered by BALIK.LAGI</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
