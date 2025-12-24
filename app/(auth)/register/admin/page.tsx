"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { UserPlus, Mail, Lock, Key, Sparkles, Shield } from "lucide-react";

export default function AdminRegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [keyVerified, setKeyVerified] = useState(false);

  async function verifySecretKey() {
    if (!formData.secretKey) {
      setError("Kode rahasia admin wajib diisi!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/validate-access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessKey: formData.secretKey,
          role: 'admin'
        }),
      });

      const data = await response.json();

      if (data.success && data.validation?.[0]?.is_valid) {
        setKeyVerified(true);
        setError(null);
      } else {
        const message = data.validation?.[0]?.message || data.error || "Kode rahasia admin tidak valid!";
        setError(message + " Hanya founder yang memiliki akses admin.");
      }
    } catch (err) {
      setError("Gagal memverifikasi kode. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!keyVerified) {
      setError("Verifikasi kode rahasia admin terlebih dahulu!");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter!");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      'admin',
      undefined
    );

    if (signUpError) {
      setError(signUpError.message || "Registrasi gagal. Silakan coba lagi.");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (!keyVerified) {
      setError("Verifikasi kode rahasia admin terlebih dahulu!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { error: googleError } = await signInWithGoogle('admin');
      
      if (googleError) {
        setError("Google sign-up failed. Please ensure Google OAuth is configured.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Google sign-up failed. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Berhasil Terdaftar! 🎉</h2>
          <p className="text-purple-200 mb-6">
            Silakan cek email Anda untuk konfirmasi akun. Setelah dikonfirmasi, Anda dapat login sebagai Admin.
          </p>
          <Link
            href="/login/admin"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Login Sebagai Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-600 rounded-2xl mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ADMIN REGISTRATION</h1>
          <p className="text-yellow-200">🔒 Exclusive Access - Founder Only</p>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="text-yellow-400 mt-1" size={24} />
            <div>
              <h3 className="text-yellow-100 font-semibold mb-1">Exclusive Admin Access</h3>
              <p className="text-yellow-200 text-sm">
                Registrasi admin memerlukan kode rahasia khusus. Hanya founder/owner BOZQ Barbershop yang memiliki akses admin.
              </p>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          {!keyVerified ? (
            // Step 1: Verify Admin Secret Key
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Kode Rahasia Admin *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="text-purple-300" size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Masukkan kode rahasia"
                    required
                  />
                </div>
                <p className="text-purple-300 text-xs mt-2">
                  Hubungi founder untuk mendapatkan kode rahasia admin
                </p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={verifySecretKey}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    <span>Verifikasi Kode Admin</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // Step 2: Admin Registration Form
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm mb-4">
                ✅ Kode admin terverifikasi! Silakan lengkapi data registrasi.
              </div>

              {/* Email */}
              <div>
                <label className="block text-white font-medium mb-2">Email Admin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-purple-300" size={20} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="admin@oasis-bi-pro.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-white font-medium mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-purple-300" size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-white font-medium mb-2">Konfirmasi Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-purple-300" size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Mendaftar...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Daftar sebagai Admin</span>
                  </>
                )}
              </button>
            </form>
          )}

          {keyVerified && (
            <>
              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-purple-300 text-sm">atau</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full py-3 bg-white text-gray-700 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google (Admin)</span>
              </button>
            </>
          )}

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-purple-200 mb-3">Sudah punya akun admin?</p>
            <Link
              href="/login/admin"
              className="inline-block px-6 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              Login Sebagai Admin
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
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
