"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CapsterRegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    accessKey: "",
    email: "",
    password: "",
    confirmPassword: "",
    capsterName: "",
    phone: "",
    specialization: "all" as "haircut" | "grooming" | "coloring" | "all",
    yearsOfExperience: 0,
    bio: "",
  });

  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValidated, setKeyValidated] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.accessKey) {
      setError("Mohon masukkan Access Key terlebih dahulu");
      setLoading(false);
      return;
    }

    if (!keyValidated) {
      setError("Access Key belum divalidasi. Klik tombol Verify Access Key");
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.password || !formData.capsterName || !formData.phone) {
      setError("Mohon lengkapi semua field yang wajib diisi");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    try {
      // For now, we just create the user profile
      // The capster record will be created manually by admin after approval
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        "capster",
        {
          phone: formData.phone,
          name: formData.capsterName,
        }
      );

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Increment access key usage
      await fetch('/api/access-key/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: formData.accessKey }),
      });

      // Success - will be redirected by AuthContext
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  async function handleValidateKey() {
    if (!formData.accessKey) {
      setError("Mohon masukkan Access Key");
      return;
    }

    setValidatingKey(true);
    setError("");

    try {
      const response = await fetch('/api/validate-access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: formData.accessKey,
          role: 'capster',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.validation?.[0]?.is_valid) {
        const message = data.validation?.[0]?.message || data.error || 'Invalid access key';
        setError(message);
        setKeyValidated(false);
        setValidatingKey(false);
        return;
      }

      setKeyValidated(true);
      setError("");
      alert(`✅ Access Key Valid! Welcome ${data.validation[0].key_name || 'Capster'}`);
    } catch (err: any) {
      setError(err.message || "Gagal validasi access key");
      setKeyValidated(false);
    } finally {
      setValidatingKey(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Sebagai Capster</h1>
          <p className="text-gray-600">
            Bergabung dengan tim BALIK.LAGI Barbershop
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ACCESS KEY */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-xl">
              <label className="block text-sm font-bold text-green-800 mb-2">
                🔑 Access Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.accessKey}
                  onChange={(e) => {
                    setFormData({ ...formData, accessKey: e.target.value });
                    setKeyValidated(false);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  placeholder="Masukkan access key Anda"
                  disabled={keyValidated}
                  required
                />
                <button
                  type="button"
                  onClick={handleValidateKey}
                  disabled={validatingKey || keyValidated || !formData.accessKey}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {validatingKey ? "Checking..." : keyValidated ? "✅ Valid" : "Verify"}
                </button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Access key tersedia dari management. Hubungi admin jika belum memiliki.
              </p>
              {keyValidated && (
                <div className="mt-3 p-2 bg-green-100 border border-green-400 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">✅ Access key terverifikasi! Anda dapat melanjutkan registrasi.</p>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="capster@barbershop.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ulangi password"
                required
              />
            </div>

            {/* Capster Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.capsterName}
                onChange={(e) => setFormData({ ...formData, capsterName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Budi Santoso"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="08123456789"
                required
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spesialisasi
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Semua Layanan</option>
                <option value="haircut">Haircut</option>
                <option value="grooming">Grooming</option>
                <option value="coloring">Coloring</option>
              </select>
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pengalaman (tahun)
              </label>
              <input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="5"
                min="0"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio / Deskripsi Singkat
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ceritakan sedikit tentang keahlian dan pengalaman Anda..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mendaftar..." : "Daftar Sebagai Capster"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Login di sini
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Daftar sebagai{" "}
              <Link href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                Customer
              </Link>
              {" atau "}
              <Link href="/register/admin" className="text-orange-600 hover:text-orange-700 font-medium">
                Admin
              </Link>
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ Auto-Approval Active:</strong> Setelah mendaftar, Anda langsung dapat mengakses dashboard capster tanpa perlu menunggu approval admin!
          </p>
        </div>
      </div>
    </div>
  );
}
