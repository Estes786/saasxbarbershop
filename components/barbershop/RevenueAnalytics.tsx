"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, DollarSign, Users, Package, RefreshCw } from "lucide-react";
import { useRefresh } from "@/lib/context/RefreshContext";

interface DailyAnalytics {
  date: string;
  total_revenue: number;
  total_transactions: number;
  average_atv: number;
  day_of_week?: string;
}

interface ServiceDistribution {
  service_tier: string;
  total_count: number;
  total_revenue: number;
  avg_atv: number;
  percentage: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function RevenueAnalytics() {
  const { refreshTrigger } = useRefresh();
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<
    ServiceDistribution[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]); // Auto-refresh when trigger changes

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // Fetch daily analytics from database
      const { data: dailyData, error: dailyError } = await supabase
        .from("barbershop_analytics_daily")
        .select("*")
        .order("date", { ascending: false })
        .limit(30) as { data: any[] | null, error: any };

      if (dailyError) {
        console.warn("Daily analytics not found, calculating manually");
        await calculateAnalyticsManually();
        return;
      }

      // Fetch service distribution using function
      const { data: serviceData, error: serviceError } = await supabase.rpc(
        "get_service_distribution"
      ) as { data: any[] | null, error: any };

      if (serviceError) {
        console.warn("Service distribution function not found");
        await calculateServiceDistribution();
        return;
      }

      if (dailyData) {
        setDailyAnalytics(dailyData.reverse());
      }

      if (serviceData) {
        setServiceDistribution(serviceData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      await calculateAnalyticsManually();
    }
  }

  async function calculateAnalyticsManually() {
    try {
      // Get last 30 days of transactions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error } = await supabase
        .from("barbershop_transactions")
        .select("*")
        .gte("transaction_date", thirtyDaysAgo.toISOString())
        .order("transaction_date", { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        setDailyAnalytics([]);
        setLoading(false);
        return;
      }

      // Group by date
      const dailyMap = new Map<string, DailyAnalytics>();

      (transactions as any[]).forEach((t: any) => {
        const date = new Date(t.transaction_date).toISOString().split("T")[0];
        const existing = dailyMap.get(date);

        if (existing) {
          existing.total_revenue += t.net_revenue;
          existing.total_transactions += 1;
          existing.average_atv =
            existing.total_revenue / existing.total_transactions;
        } else {
          dailyMap.set(date, {
            date,
            total_revenue: t.net_revenue,
            total_transactions: 1,
            average_atv: t.net_revenue,
          });
        }
      });

      const dailyAnalyticsData = Array.from(dailyMap.values());
      setDailyAnalytics(dailyAnalyticsData);

      // Calculate service distribution
      await calculateServiceDistribution();

      setLoading(false);
    } catch (err) {
      console.error("Error calculating analytics manually:", err);
      setDailyAnalytics([]);
      setLoading(false);
    }
  }

  async function calculateServiceDistribution() {
    try {
      const { data: transactions, error } = await supabase
        .from("barbershop_transactions")
        .select("service_tier, net_revenue, atv_amount") as { data: any[] | null, error: any };

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        setServiceDistribution([]);
        return;
      }

      // Group by service tier
      const tierMap = new Map<
        string,
        { count: number; revenue: number; atvSum: number }
      >();

      transactions.forEach((t: any) => {
        const tier = t.service_tier;
        const existing = tierMap.get(tier);

        if (existing) {
          existing.count += 1;
          existing.revenue += t.net_revenue;
          existing.atvSum += t.atv_amount;
        } else {
          tierMap.set(tier, {
            count: 1,
            revenue: t.net_revenue,
            atvSum: t.atv_amount,
          });
        }
      });

      const totalTransactions = transactions.length;

      const serviceDistributionData: ServiceDistribution[] = Array.from(
        tierMap.entries()
      ).map(([tier, data]) => ({
        service_tier: tier,
        total_count: data.count,
        total_revenue: data.revenue,
        avg_atv: data.atvSum / data.count,
        percentage: (data.count / totalTransactions) * 100,
      }));

      setServiceDistribution(serviceDistributionData);
    } catch (err) {
      console.error("Error calculating service distribution:", err);
      setServiceDistribution([]);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalRevenue = dailyAnalytics.reduce(
    (sum, day) => sum + day.total_revenue,
    0
  );
  const totalTransactions = dailyAnalytics.reduce(
    (sum, day) => sum + day.total_transactions,
    0
  );
  const averageATV = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="mr-2" size={24} />
              📈 Revenue Analytics
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Analisis revenue dan service distribution (30 hari terakhir)
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">
                Total Revenue (30d)
              </span>
              <DollarSign className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">
                Total Transaksi
              </span>
              <Users className="text-blue-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalTransactions}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">
                Average ATV
              </span>
              <Package className="text-purple-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(averageATV)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="p-6 space-y-8">
        {/* Daily Revenue Trend */}
        {dailyAnalytics.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Daily Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    `Rp ${(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Daily Transactions */}
        {dailyAnalytics.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 Daily Transactions
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis />
                <Tooltip labelFormatter={(label) => `Tanggal: ${label}`} />
                <Legend />
                <Bar
                  dataKey="total_transactions"
                  fill="#3B82F6"
                  name="Transaksi"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Service Distribution */}
        {serviceDistribution.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🍰 Service Tier Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ service_tier, percentage }) =>
                      `${service_tier}: ${percentage.toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total_count"
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Service Tier Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-2">Tier</th>
                      <th className="px-4 py-2 text-right">Count</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                      <th className="px-4 py-2 text-right">Avg ATV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceDistribution.map((tier, index) => (
                      <tr
                        key={tier.service_tier}
                        className="border-b border-gray-200"
                      >
                        <td className="px-4 py-2 font-medium">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></span>
                          {tier.service_tier}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {tier.total_count}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(tier.total_revenue)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(tier.avg_atv)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {dailyAnalytics.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="mx-auto mb-4" size={48} />
            <p className="text-lg font-medium">Belum ada data transaksi</p>
            <p className="text-sm mt-2">
              Mulai input data di Google Sheets untuk melihat analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
