"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, RefreshCw, Download } from "lucide-react";
import { useRefresh } from "@/lib/context/RefreshContext";
import { useToast } from "@/lib/context/ToastContext";

interface Transaction {
  id: string;
  transaction_date: string;
  customer_phone: string;
  customer_name: string;
  service_tier: string;
  upsell_items: string | null;
  atv_amount: number;
  discount_amount: number;
  net_revenue: number;
  is_coupon_redeemed: boolean;
  is_google_review_asked: boolean;
  customer_area: string | null;
  capster_name: string | null;
}

export default function TransactionsManager() {
  const { triggerRefresh } = useRefresh();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().slice(0, 16),
    customer_phone: "",
    customer_name: "",
    service_tier: "",
    upsell_items: "",
    atv_amount: "",
    discount_amount: "0",
    customer_area: "",
    capster_name: "",
    is_coupon_redeemed: false,
    is_google_review_asked: false,
  });

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  async function fetchTransactions(page: number) {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions?page=${page}&limit=10`);
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
        setTotalPages(result.pagination.pages);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast("success", "✅ Transaksi berhasil ditambahkan!");
        setShowModal(false);
        fetchTransactions(currentPage);
        resetForm();
        // Trigger refresh untuk semua dashboard
        triggerRefresh();
      } else {
        showToast("error", "❌ Error: " + result.error);
      }
    } catch (error: any) {
      showToast("error", "❌ Error: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        showToast("success", "✅ Transaksi berhasil dihapus!");
        fetchTransactions(currentPage);
        // Trigger refresh untuk semua dashboard
        triggerRefresh();
      } else {
        showToast("error", "❌ Error: " + result.error);
      }
    } catch (error: any) {
      showToast("error", "❌ Error: " + error.message);
    }
  }

  function resetForm() {
    setFormData({
      transaction_date: new Date().toISOString().slice(0, 16),
      customer_phone: "",
      customer_name: "",
      service_tier: "",
      upsell_items: "",
      atv_amount: "",
      discount_amount: "0",
      customer_area: "",
      capster_name: "",
      is_coupon_redeemed: false,
      is_google_review_asked: false,
    });
  }

  function exportToCSV() {
    if (transactions.length === 0) {
      showToast("warning", "Tidak ada data untuk di-export");
      return;
    }

    // CSV headers
    const headers = [
      "ID",
      "Tanggal",
      "Customer",
      "No HP",
      "Service Tier",
      "Upsell Items",
      "ATV Amount",
      "Discount",
      "Net Revenue",
      "Coupon",
      "Review Asked",
      "Area",
      "Capster"
    ];

    // CSV rows
    const rows = transactions.map((tx) => [
      tx.id,
      formatDateTime(tx.transaction_date),
      tx.customer_name,
      tx.customer_phone,
      tx.service_tier,
      tx.upsell_items || "",
      tx.atv_amount,
      tx.discount_amount,
      tx.net_revenue,
      tx.is_coupon_redeemed ? "Yes" : "No",
      tx.is_google_review_asked ? "Yes" : "No",
      tx.customer_area || "",
      tx.capster_name || ""
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "✅ Data berhasil di-export!");
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">📋 Data Transaksi</h2>
          <p className="text-green-100 text-sm mt-1">Kelola semua transaksi barbershop</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchTransactions(currentPage)}
            className="bg-white text-green-600 px-3 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2"
            title="Refresh data"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={exportToCSV}
            className="bg-white text-green-600 px-3 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2"
            title="Export ke CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ATV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(tx.transaction_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{tx.customer_name}</div>
                  <div className="text-sm text-gray-500">{tx.customer_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tx.service_tier === "Basic" ? "bg-blue-100 text-blue-800" :
                    tx.service_tier === "Premium" ? "bg-purple-100 text-purple-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {tx.service_tier}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(tx.atv_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  {formatCurrency(tx.net_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <Plus className="mr-2" size={28} />
                  Tambah Transaksi Baru
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-1">Isi form di bawah untuk menambahkan transaksi baru</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-gray-50">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      📅 Tanggal & Waktu *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      📱 No. HP Customer *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10,15}"
                      placeholder="08123456789"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    👤 Nama Customer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap customer"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      ✂️ Service Tier *
                    </label>
                    <select
                      required
                      value={formData.service_tier}
                      onChange={(e) => setFormData({ ...formData, service_tier: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium"
                    >
                      <option value="">-- Pilih Service --</option>
                      <option value="Basic">Basic (Rp 20K)</option>
                      <option value="Premium">Premium (Rp 40-50K)</option>
                      <option value="Mastery">Mastery (Rp 70K+)</option>
                    </select>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      💇 Capster
                    </label>
                    <select
                      value={formData.capster_name}
                      onChange={(e) => setFormData({ ...formData, capster_name: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium"
                    >
                      <option value="">-- Pilih Capster --</option>
                      <option value="Owner">Owner</option>
                      <option value="Staff 1">Staff 1</option>
                      <option value="Staff 2">Staff 2</option>
                      <option value="Staff 3">Staff 3</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    ➕ Upsell Items (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hair Tonic, Coloring, Massage"
                    value={formData.upsell_items}
                    onChange={(e) => setFormData({ ...formData, upsell_items: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      💰 ATV Amount (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="20000"
                      value={formData.atv_amount}
                      onChange={(e) => setFormData({ ...formData, atv_amount: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      🏷️ Discount (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    📍 Area
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Patikraja, Kedungrandu, Banyumas"
                    value={formData.customer_area}
                    onChange={(e) => setFormData({ ...formData, customer_area: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <div className="flex items-center h-full">
                      <input
                        type="checkbox"
                        id="coupon-check"
                        checked={formData.is_coupon_redeemed}
                        onChange={(e) => setFormData({ ...formData, is_coupon_redeemed: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="coupon-check" className="ml-3 text-base font-semibold text-gray-800 cursor-pointer">
                        🎟️ Coupon Redeemed
                      </label>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <div className="flex items-center h-full">
                      <input
                        type="checkbox"
                        id="review-check"
                        checked={formData.is_google_review_asked}
                        onChange={(e) => setFormData({ ...formData, is_google_review_asked: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="review-check" className="ml-3 text-base font-semibold text-gray-800 cursor-pointer">
                        ⭐ Google Review Asked
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    💾 Simpan Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-xl font-bold text-lg transition-all"
                  >
                    ❌ Batal
                  </button>
                </div>
              </form>
            </div>

            {/* Help Text */}
            <div className="px-6 pb-6 bg-gray-50">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Pastikan semua field yang bertanda * diisi dengan lengkap. 
                  ATV Amount adalah total harga sebelum discount.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
