"use client";

import Link from "next/link";
import { User, Scissors, Shield, Sparkles } from "lucide-react";

export default function LoginPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-2xl">
            <Sparkles className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">BALIK.LAGI</h1>
          <p className="text-purple-200 text-lg">Pilih role Anda untuk login</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Customer Login */}
          <Link href="/login/customer">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Customer</h3>
                <p className="text-purple-200 text-sm mb-4">
                  Pelanggan BALIK.LAGI
                </p>
                <div className="text-purple-300 text-sm font-medium group-hover:text-white transition-colors">
                  Login sebagai Customer →
                </div>
              </div>
            </div>
          </Link>

          {/* Capster Login */}
          <Link href="/login/capster">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Scissors className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Capster</h3>
                <p className="text-purple-200 text-sm mb-4">
                  Tukang cukur profesional
                </p>
                <div className="text-purple-300 text-sm font-medium group-hover:text-white transition-colors">
                  Login sebagai Capster →
                </div>
              </div>
            </div>
          </Link>

          {/* Admin Login */}
          <Link href="/login/admin">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Admin</h3>
                <p className="text-purple-200 text-sm mb-4">
                  Administrator sistem
                </p>
                <div className="text-purple-300 text-sm font-medium group-hover:text-white transition-colors">
                  Login sebagai Admin →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-purple-200 mb-3">Belum punya akun?</p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300 font-semibold"
          >
            Daftar Sekarang
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-purple-300 hover:text-purple-100 transition-colors">
            ← Kembali ke Home
          </Link>
        </div>
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
      `}</style>
    </div>
  );
}
