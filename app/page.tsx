"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TrendingUp, Target, BarChart3, Users, Sparkles, ArrowRight, CheckCircle2, Shield, Crown } from "lucide-react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [showAdminOption, setShowAdminOption] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute w-96 h-96 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Admin Access Modal */}
      {showAdminOption && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowAdminOption(false)}>
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-2 border-yellow-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-yellow-500/30" onClick={(e) => e.stopPropagation()}>
            {/* Crown Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                <Crown className="text-white" size={32} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white text-center mb-2">FOUNDER ACCESS</h2>
            <p className="text-yellow-200 text-center mb-6 text-sm">🔒 Exclusive Admin Registration</p>
            
            {/* Warning Box */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-2">
                <Shield className="text-yellow-400 mt-0.5" size={20} />
                <p className="text-yellow-100 text-sm">
                  Registrasi admin memerlukan <strong>kode rahasia khusus</strong>. Hanya founder/owner BOZQ Barbershop yang memiliki akses ini.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href="/register/admin"
                className="block w-full py-3 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-center"
                onClick={() => setShowAdminOption(false)}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Shield size={20} />
                  <span>Register sebagai Admin</span>
                </div>
              </Link>
              
              <Link
                href="/login"
                className="block w-full py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300 text-center font-medium"
                onClick={() => setShowAdminOption(false)}
              >
                Admin Login
              </Link>

              <button
                onClick={() => setShowAdminOption(false)}
                className="block w-full py-2 text-purple-300 hover:text-white transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header/Navigation */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-white font-bold text-xl">BALIK.LAGI</span>
            </div>
            <div className="flex items-center space-x-3">
              {/* Toggle Admin Option - Secret Button */}
              <button
                onClick={() => setShowAdminOption(!showAdminOption)}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 font-medium flex items-center space-x-2"
                title="Founder/Admin Access"
              >
                <Crown size={18} />
                <span className="hidden sm:inline">Admin</span>
              </button>
              
              <Link
                href="/login"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-medium"
              >
                Login
              </Link>
              <Link
                href="/dashboard/barbershop"
                className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 container mx-auto px-6 flex items-center">
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center space-x-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2">
                <Sparkles className="text-purple-300" size={16} />
                <span className="text-purple-200 text-sm font-medium">Data Monetization Engine</span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Transform Your Data
              </span>
              <br />
              <span className="text-white">Into Actionable Insights</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-purple-200 text-center mb-12 max-w-3xl mx-auto leading-relaxed">
              Platform BI terintegrasi untuk Barbershop Kedungrandu yang mengubah data transaksi menjadi prediksi revenue dan customer intelligence
            </p>

            {/* 3-ROLE NAVIGATION SECTION */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-center text-white mb-2">Pilih Role Anda</h2>
              <p className="text-purple-200 text-center mb-6">3-Role Architecture: Customer → Capster → Admin</p>
            </div>

            {/* CTA Buttons - 3 Roles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center mb-16 max-w-5xl mx-auto">
              {/* Customer Role */}
              <div className="group bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                <div className="flex flex-col items-center text-white space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Users size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Customer</h3>
                  <p className="text-sm text-purple-100 text-center">Booking online, loyalty points, reviews</p>
                  <div className="flex flex-col w-full space-y-2 mt-4">
                    <Link
                      href="/register"
                      className="w-full py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300 text-center"
                    >
                      Register
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-2 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-all duration-300 text-center"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>

              {/* Capster Role */}
              <div className="group bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105">
                <div className="flex flex-col items-center text-white space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Target size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Capster/Barberman</h3>
                  <p className="text-sm text-green-100 text-center">Predictive analytics, queue management</p>
                  <div className="flex flex-col w-full space-y-2 mt-4">
                    <Link
                      href="/register/capster"
                      className="w-full py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 text-center"
                    >
                      Register
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-2 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-all duration-300 text-center"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>

              {/* Admin Role */}
              <div className="group bg-gradient-to-br from-yellow-600 to-red-600 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 relative">
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full px-3 py-1 text-xs font-bold text-white">
                  <div className="flex items-center space-x-1">
                    <Crown size={14} />
                    <span>FOUNDER</span>
                  </div>
                </div>
                <div className="flex flex-col items-center text-white space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Admin</h3>
                  <p className="text-sm text-yellow-100 text-center">Full system access, audit & management</p>
                  <div className="flex flex-col w-full space-y-2 mt-4">
                    <Link
                      href="/register/admin"
                      className="w-full py-2 bg-white text-yellow-600 rounded-lg font-semibold hover:bg-yellow-50 transition-all duration-300 text-center"
                    >
                      Register 🔒
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-2 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-all duration-300 text-center"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Button */}
            <div className="flex justify-center mb-16">
              <Link
                href="/dashboard/barbershop"
                className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
              >
                <Sparkles size={20} />
                <span>View Demo Dashboard</span>
              </Link>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Card 1 */}
              <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <Target className="text-white" size={24} />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">KHL Tracking</h3>
                <p className="text-purple-200">Monitor target Rp 2.5M/bulan secara real-time dengan prediksi harian</p>
              </div>

              {/* Card 2 */}
              <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <Users className="text-white" size={24} />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Actionable Leads</h3>
                <p className="text-purple-200">Identifikasi churn risk, coupon eligible, dan review targets otomatis</p>
              </div>

              {/* Card 3 */}
              <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Revenue Analytics</h3>
                <p className="text-purple-200">Analisis trend revenue, ATV distribution, dan service performance</p>
              </div>
            </div>

            {/* Integration Flow */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-white font-bold text-2xl text-center mb-8">Sistem Terintegrasi End-to-End</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
                    <CheckCircle2 className="text-white" size={32} />
                  </div>
                  <h4 className="text-white font-semibold text-lg mb-2">Data Collection</h4>
                  <p className="text-purple-200 text-sm">Google Sheets untuk input transaksi real-time dari barbershop</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4">
                    <TrendingUp className="text-white" size={32} />
                  </div>
                  <h4 className="text-white font-semibold text-lg mb-2">Data Processing</h4>
                  <p className="text-purple-200 text-sm">Supabase database & edge functions untuk analytics pipeline</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4">
                    <Sparkles className="text-white" size={32} />
                  </div>
                  <h4 className="text-white font-semibold text-lg mb-2">Actionable Insights</h4>
                  <p className="text-purple-200 text-sm">Dashboard prediktif dengan WhatsApp integration untuk action</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center text-purple-300 text-sm">
            <p>© 2025 OASIS BI PRO x Barbershop Kedungrandu. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Jl. Raya Kedungrandu, Patikraja, Banyumas</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
