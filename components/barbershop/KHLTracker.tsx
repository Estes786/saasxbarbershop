"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Target, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { useRefresh } from "@/lib/context/RefreshContext";

interface KHLData {
  target_khl: number;
  current_revenue: number;
  progress_percentage: number;
  days_in_month: number;
  days_elapsed: number;
  days_remaining: number;
  daily_target_remaining: number;
}

export default function KHLTracker() {
  const { refreshTrigger } = useRefresh();
  const [khlData, setKhlData] = useState<KHLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKHLData();
  }, [refreshTrigger]); // Auto-refresh when trigger changes

  async function fetchKHLData() {
    try {
      setLoading(true);
      
      // Call Supabase function get_khl_progress
      const { data, error } = await supabase.rpc('get_khl_progress') as { data: KHLData[] | null, error: any };
      
      if (error) {
        // If function doesn't exist, calculate manually
        console.warn("Function get_khl_progress not found, calculating manually");
        await calculateKHLManually();
        return;
      }

      if (data && data.length > 0) {
        setKhlData(data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching KHL data:", err);
      // Fallback to manual calculation
      await calculateKHLManually();
    }
  }

  async function calculateKHLManually() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const daysInMonth = monthEnd.getDate();
      const daysElapsed = now.getDate();
      const daysRemaining = daysInMonth - daysElapsed;

      // Get current month revenue
      const { data: transactions, error } = await supabase
        .from("barbershop_transactions")
        .select("net_revenue")
        .gte("transaction_date", monthStart.toISOString())
        .lte("transaction_date", monthEnd.toISOString()) as { data: any[] | null, error: any };

      if (error) throw error;

      const currentRevenue = transactions?.reduce(
        (sum: number, t: any) => sum + (t.net_revenue || 0),
        0
      ) || 0;

      const targetKHL = 2500000;
      const progressPercentage = (currentRevenue / targetKHL) * 100;
      const dailyTargetRemaining = daysRemaining > 0 
        ? (targetKHL - currentRevenue) / daysRemaining 
        : 0;

      setKhlData({
        target_khl: targetKHL,
        current_revenue: currentRevenue,
        progress_percentage: progressPercentage,
        days_in_month: daysInMonth,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        daily_target_remaining: dailyTargetRemaining,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error calculating KHL manually:", err);
      setError("Gagal mengambil data KHL");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !khlData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">❌ {error || "Data tidak tersedia"}</p>
      </div>
    );
  }

  const progressColor =
    khlData.progress_percentage >= 80
      ? "bg-green-500"
      : khlData.progress_percentage >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Target className="mr-2" size={24} />
              🎯 KHL Monitoring Dashboard
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Target Kebutuhan Hidup Layak Bulanan
            </p>
          </div>
          <button
            onClick={fetchKHLData}
            disabled={loading}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress KHL
            </span>
            <span className="text-sm font-bold text-gray-900">
              {khlData.progress_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-500`}
              style={{ width: `${Math.min(khlData.progress_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Revenue */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 font-medium">
                Revenue Bulan Ini
              </span>
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(khlData.current_revenue)}
            </p>
          </div>

          {/* Target KHL */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-700 font-medium">
                Target KHL
              </span>
              <Target className="text-purple-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(khlData.target_khl)}
            </p>
          </div>

          {/* Remaining Target */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-yellow-700 font-medium">
                Sisa Target
              </span>
              <TrendingUp className="text-yellow-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {formatCurrency(khlData.target_khl - khlData.current_revenue)}
            </p>
          </div>

          {/* Daily Target */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700 font-medium">
                Target Harian Sisa
              </span>
              <Calendar className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(khlData.daily_target_remaining)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {khlData.days_remaining} hari tersisa
            </p>
          </div>
        </div>

        {/* Summary Text */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-700">
            📊 <strong>Summary:</strong> Dari target Rp 2.5M, saat ini sudah tercapai{" "}
            <strong className="text-blue-600">
              {formatCurrency(khlData.current_revenue)}
            </strong>{" "}
            ({khlData.progress_percentage.toFixed(1)}%). Masih ada{" "}
            <strong className="text-yellow-600">
              {khlData.days_remaining} hari
            </strong>{" "}
            tersisa bulan ini, dengan target harian{" "}
            <strong className="text-green-600">
              {formatCurrency(khlData.daily_target_remaining)}
            </strong>{" "}
            untuk mencapai KHL.
          </p>
        </div>
      </div>
    </div>
  );
}
