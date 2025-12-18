"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TrendingUp, Target, BarChart3, Users, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

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

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header/Navigation */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-white font-bold text-xl">OASIS BI PRO</span>
            </div>
            <div className="flex items-center space-x-3">
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/login"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Login with Google</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link
                href="/dashboard/barbershop"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
              >
                View Demo Dashboard
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
