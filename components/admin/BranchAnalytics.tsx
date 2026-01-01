"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, MapPin } from 'lucide-react';

interface BranchStats {
  branchId: string;
  branchName: string;
  totalBookings: number;
  totalRevenue: number;
  activeCapsters: number;
  completedBookings: number;
  pendingBookings: number;
}

export default function BranchAnalytics() {
  const supabase = createClient();
  const [stats, setStats] = useState<BranchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, all

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  async function loadAnalytics() {
    try {
      setLoading(true);

      // Load branches
      const { data: branches } = await supabase
        .from('branches')
        .select('id, branch_name');

      if (!branches || branches.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      // Calculate date filter
      let dateFilter = '';
      if (selectedPeriod !== 'all') {
        const days = selectedPeriod === '7d' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = startDate.toISOString();
      }

      // Load stats for each branch
      const branchStats: BranchStats[] = [];

      for (const branch of (branches as Array<{id: string; branch_name: string}>)) {
        // Count bookings
        let bookingsQuery = supabase
          .from('bookings')
          .select('id, booking_status, service_tier', { count: 'exact' })
          .eq('branch_id', branch.id);

        if (dateFilter) {
          bookingsQuery = bookingsQuery.gte('created_at', dateFilter);
        }

        const { data: bookings, count: totalBookings } = await bookingsQuery;

        // Count completed and pending
        const bookingsList = bookings as Array<{id: string; booking_status: string; service_tier: string}> || [];
        const completedBookings = bookingsList.filter(b => b.booking_status === 'completed').length;
        const pendingBookings = bookingsList.filter(b => b.booking_status === 'pending').length;

        // Calculate revenue (simplified - based on service tier)
        const tierPrices: Record<string, number> = {
          'basic': 50000,
          'standard': 75000,
          'premium': 100000
        };

        const totalRevenue = bookingsList.reduce((sum, booking) => {
          if (booking.booking_status === 'completed') {
            return sum + (tierPrices[booking.service_tier.toLowerCase()] || 0);
          }
          return sum;
        }, 0);

        // Count active capsters
        const { count: activeCapsters } = await supabase
          .from('capsters')
          .select('id', { count: 'exact' })
          .eq('branch_id', branch.id);

        branchStats.push({
          branchId: branch.id,
          branchName: branch.branch_name,
          totalBookings: totalBookings || 0,
          totalRevenue,
          activeCapsters: activeCapsters || 0,
          completedBookings,
          pendingBookings
        });
      }

      setStats(branchStats);

    } catch (error) {
      console.error('Error loading analytics:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getTotalStats() {
    return {
      totalBookings: stats.reduce((sum, s) => sum + s.totalBookings, 0),
      totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalCapsters: stats.reduce((sum, s) => sum + s.activeCapsters, 0),
      totalBranches: stats.length
    };
  }

  const totals = getTotalStats();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="text-purple-600" />
              <span>Branch Analytics</span>
            </h2>
            <p className="text-gray-600 mt-1">Perbandingan performa antar cabang</p>
          </div>
          <div className="flex space-x-2">
            {[
              { value: '7d', label: '7 Hari' },
              { value: '30d', label: '30 Hari' },
              { value: 'all', label: 'Semua' }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === period.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
              <MapPin size={16} />
              <span>Total Cabang</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.totalBranches}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
              <Calendar size={16} />
              <span>Total Booking</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
              <Users size={16} />
              <span>Total Capster</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.totalCapsters}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
              <DollarSign size={16} />
              <span>Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Branch Comparison */}
      <div className="p-6">
        {stats.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Belum ada data analytics</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((branch) => {
              const bookingPercentage = totals.totalBookings > 0 
                ? (branch.totalBookings / totals.totalBookings) * 100 
                : 0;
              const revenuePercentage = totals.totalRevenue > 0 
                ? (branch.totalRevenue / totals.totalRevenue) * 100 
                : 0;

              return (
                <div key={branch.branchId} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition">
                  {/* Branch Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{branch.branchName}</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {branch.completedBookings} Selesai
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        {branch.pendingBookings} Pending
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Booking</p>
                      <p className="text-xl font-bold text-gray-900">{branch.totalBookings}</p>
                      <p className="text-xs text-purple-600 font-medium">{bookingPercentage.toFixed(1)}% dari total</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Revenue</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(branch.totalRevenue)}</p>
                      <p className="text-xs text-purple-600 font-medium">{revenuePercentage.toFixed(1)}% dari total</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Capster Aktif</p>
                      <p className="text-xl font-bold text-gray-900">{branch.activeCapsters}</p>
                      <p className="text-xs text-gray-600">
                        {branch.activeCapsters > 0 
                          ? `${(branch.totalBookings / branch.activeCapsters).toFixed(1)} booking/capster`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Booking Performance</span>
                        <span>{bookingPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${bookingPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Revenue Contribution</span>
                        <span>{revenuePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${revenuePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insights */}
      {stats.length > 0 && (
        <div className="p-6 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start space-x-3">
            <TrendingUp className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Branch terbaik: <span className="font-bold">{stats.sort((a, b) => b.totalRevenue - a.totalRevenue)[0].branchName}</span> (revenue tertinggi)</li>
                <li>• Branch tersibuk: <span className="font-bold">{stats.sort((a, b) => b.totalBookings - a.totalBookings)[0].branchName}</span> ({stats.sort((a, b) => b.totalBookings - a.totalBookings)[0].totalBookings} booking)</li>
                <li>• Rata-rata booking per branch: <span className="font-bold">{(totals.totalBookings / stats.length).toFixed(1)}</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
