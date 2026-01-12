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
                <span className="text-purple-200 text-sm font-medium">Ekosistem Barber & Sistem yang Bikin Pelanggan Balik Lagi</span>
              </div>
            </div>

            {/* Main Heading - Fresha-inspired */}
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Sekali Cocok,
              </span>
              <br />
              <span className="text-white">Pengen Balik Lagi</span>
            </h1>

            {/* Subtitle - R0.1 Philosophy */}
            <p className="text-xl md:text-2xl text-purple-200 text-center mb-8 max-w-3xl mx-auto leading-relaxed">
              Barbershop bukan soal ramai sesaat. Tapi soal waktu yang rapi, kerja yang tenang, dan pelanggan yang merasa cocok.
              <br />
              <span className="text-purple-300 font-semibold">Booking mudah • Antrian jelas • Kerja lebih tenang</span>
            </p>

            {/* Social Proof */}
            <div className="flex justify-center items-center space-x-8 mb-12 text-purple-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={20} className="text-green-400" />
                <span className="text-sm">Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={20} className="text-green-400" />
                <span className="text-sm">Setup in 10 mins</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={20} className="text-green-400" />
                <span className="text-sm">No credit card</span>
              </div>
            </div>

            {/* 3-ROLE NAVIGATION SECTION - Fresha-inspired */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-center text-white mb-3">Siapa Anda?</h2>
              <p className="text-purple-200 text-center mb-6 text-lg">Pilih role Anda untuk mulai menggunakan BALIK.LAGI</p>
            </div>

            {/* CTA Buttons - 3 Roles - Enhanced Fresha style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center mb-16 max-w-5xl mx-auto">
              {/* Customer Role */}
              <div className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:-translate-y-2">
                <div className="flex flex-col items-center text-white space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users size={36} />
                  </div>
                  <h3 className="text-2xl font-bold">Customer</h3>
                  <p className="text-sm text-purple-100 text-center leading-relaxed">Booking mudah, loyalty points otomatis, riwayat lengkap semua kunjungan Anda</p>
                  <div className="flex flex-col w-full space-y-3 mt-6">
                    <Link
                      href="/register"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 text-center transform hover:scale-105"
                    >
                      Register Gratis
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-3 bg-white/10 border border-white/30 text-white rounded-xl hover:bg-white/20 transition-all duration-300 text-center font-medium"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>

              {/* Capster Role */}
              <div className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-500 hover:-translate-y-2">
                <div className="flex flex-col items-center text-white space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Target size={36} />
                  </div>
                  <h3 className="text-2xl font-bold">Capster</h3>
                  <p className="text-sm text-green-100 text-center leading-relaxed">Kelola antrian real-time, track performa harian, insights customer favorit Anda</p>
                  <div className="flex flex-col w-full space-y-3 mt-6">
                    <Link
                      href="/register/capster"
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 text-center transform hover:scale-105"
                    >
                      Register Gratis
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-3 bg-white/10 border border-white/30 text-white rounded-xl hover:bg-white/20 transition-all duration-300 text-center font-medium"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>

              {/* Admin Role */}
              <div className="group bg-white/10 backdrop-blur-lg border-2 border-yellow-500/40 rounded-3xl p-8 hover:bg-white/15 hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                {/* Premium badge */}
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-red-500 rounded-bl-2xl rounded-tr-3xl px-4 py-2 text-xs font-bold text-white shadow-lg">
                  <div className="flex items-center space-x-1">
                    <Crown size={14} />
                    <span>OWNER</span>
                  </div>
                </div>
                <div className="flex flex-col items-center text-white space-y-4 mt-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Shield size={36} />
                  </div>
                  <h3 className="text-2xl font-bold">Owner</h3>
                  <p className="text-sm text-yellow-100 text-center leading-relaxed">Melihat kondisi barbershop dengan tenang. Ringkasan hari ini: booking, antrian, selesai. Sederhana & jelas.</p>
                  <div className="flex flex-col w-full space-y-3 mt-6">
                    <Link
                      href="/register/admin"
                      className="w-full py-3 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-yellow-500/50 transition-all duration-300 text-center transform hover:scale-105"
                    >
                      Register 🔒
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-3 bg-white/10 border border-white/30 text-white rounded-xl hover:bg-white/20 transition-all duration-300 text-center font-medium"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Button - Enhanced */}
            <div className="flex flex-col items-center mb-16 space-y-4">
              <Link
                href="/dashboard/barbershop"
                className="group px-10 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-semibold hover:bg-white/20 hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center space-x-3 transform hover:scale-105"
              >
                <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                <span className="text-lg">Lihat Demo Dashboard</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-purple-300 text-sm">Tanpa registrasi • Lihat fitur lengkap • 100% gratis</p>
            </div>

            {/* Feature Cards Grid - R0.1 Philosophy */}
            <div className="mb-12">
              <h3 className="text-3xl font-bold text-white text-center mb-3">Kenapa BALIK.LAGI?</h3>
              <p className="text-purple-200 text-center mb-10 text-lg">Menjaga hal-hal dasar. Karena kalau yang dasar rapi, yang lain akan menyusul dengan sendirinya.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Card 1 - Booking Mudah (R0.1) */}
              <div className="group bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 hover:border-purple-400/30 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-white font-bold text-2xl mb-3">Booking Mudah</h3>
                <p className="text-purple-200 leading-relaxed">Pelanggan datang sesuai waktu. Booking sederhana supaya pelanggan tahu kapan datang, barber tahu kapan mulai, tidak saling menunggu.</p>
              </div>

              {/* Card 2 - Antrian Jelas (R0.1) */}
              <div className="group bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 hover:border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                  <Target className="text-white" size={32} />
                </div>
                <h3 className="text-white font-bold text-2xl mb-3">Antrian Jelas</h3>
                <p className="text-purple-200 leading-relaxed">Kerja lebih tenang, tanpa saling mendahului. Antrian real-time membantu barber fokus satu per satu, pelanggan merasa dihargai.</p>
              </div>

              {/* Card 3 - Reminder Otomatis (R0.1) */}
              <div className="group bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 hover:border-green-400/30 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-500 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                  <CheckCircle2 className="text-white" size={32} />
                </div>
                <h3 className="text-white font-bold text-2xl mb-3">Reminder Otomatis</h3>
                <p className="text-purple-200 leading-relaxed">Janji dijaga, bukan dilupakan. Pengingat otomatis membantu mengurangi batal mendadak, membuat pelanggan lebih konsisten balik.</p>
              </div>
            </div>

            {/* Integration Flow - R0.1 Simplified */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 mb-12">
              <h3 className="text-white font-bold text-3xl text-center mb-4">Bagaimana Cara Kerjanya?</h3>
              <p className="text-purple-300 text-center mb-12 text-lg">Sederhana. Fokus pada yang penting.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <CheckCircle2 className="text-white" size={40} />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 group-hover:bg-white/10 transition-all duration-300">
                    <h4 className="text-white font-semibold text-xl mb-3">1. Booking</h4>
                    <p className="text-purple-200 text-sm leading-relaxed">Pelanggan pilih waktu yang cocok. Barber tahu jadwal hari ini. Tidak saling menunggu.</p>
                  </div>
                </div>
                
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <TrendingUp className="text-white" size={40} />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 group-hover:bg-white/10 transition-all duration-300">
                    <h4 className="text-white font-semibold text-xl mb-3">2. Antrian</h4>
                    <p className="text-purple-200 text-sm leading-relaxed">Barber lihat siapa sekarang, siapa berikutnya. Pelanggan tahu giliran mereka. Tenang, tidak panik.</p>
                  </div>
                </div>
                
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <Sparkles className="text-white" size={40} />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 group-hover:bg-white/10 transition-all duration-300">
                    <h4 className="text-white font-semibold text-xl mb-3">3. Selesai</h4>
                    <p className="text-purple-200 text-sm leading-relaxed">Owner lihat ringkasan hari ini: berapa booking, berapa selesai. Owner tenang. Reminder otomatis jaga pelanggan balik lagi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center text-purple-300 text-sm">
            <p>© 2025 BALIK.LAGI. Bikin pelanggan pengen balik lagi.</p>
            <p className="mt-2 md:mt-0">Built with ❤️ for barbershop Indonesia</p>
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
