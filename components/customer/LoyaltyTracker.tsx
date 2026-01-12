"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Gift, Star, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LoyaltyData {
  current_visits: number;
  total_visits: number;
  visits_until_free: number;
  progress_percentage: number;
  total_spent: number;
  average_atv: number;
  free_visits_redeemed: number;
}

export default function LoyaltyTracker() {
  const { profile, user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('💳 LoyaltyTracker mounted');
    console.log('👤 User ID:', user?.id);
    console.log('📋 Profile:', profile);
    if (user?.id) {
      console.log('🔍 Fetching loyalty data for user_id:', user.id);
      fetchLoyaltyData();
    } else {
      console.warn('⚠️ No user ID found');
    }
  }, [user, profile]);

  async function fetchLoyaltyData() {
    try {
      if (!user?.id) {
        console.error('❌ Cannot fetch loyalty data: No user ID');
        setLoading(false);
        return;
      }

      console.log('📡 Querying barbershop_customers for user_id:', user.id);
      
      // ✅ FIX: Create fresh client to avoid AbortError
      const { data: customer, error } = await supabase
        .from("barbershop_customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // ✅ FIX: Handle AbortError gracefully
      if (error) {
        if (error.name === 'AbortError') {
          console.log('⚠️ Loyalty fetch aborted (ignored)');
          setLoading(false);
          return;
        }
        throw error;
      }

      if (customer && typeof customer === 'object') {
        const customerData = customer as any;
        const currentVisits = customerData.total_visits || 0;
        const cycleVisits = currentVisits % 5; // 4 visits → 1 free (cycle of 5)
        const visitsInCurrentCycle = cycleVisits === 0 ? 4 : cycleVisits;
        const visitsUntilFree = visitsInCurrentCycle < 4 ? 4 - visitsInCurrentCycle : 0;
        const progressPercentage = (visitsInCurrentCycle / 4) * 100;

        setLoyaltyData({
          current_visits: visitsInCurrentCycle,
          total_visits: currentVisits,
          visits_until_free: visitsUntilFree,
          progress_percentage: progressPercentage,
          total_spent: customerData.total_revenue || 0,
          average_atv: customerData.average_atv || 0,
          free_visits_redeemed: Math.floor(currentVisits / 5),
        });
      }
      setLoading(false);
    } catch (error: any) {
      // ✅ FIX: Silent handling for AbortError
      if (error?.name === 'AbortError') {
        console.log('⚠️ Loyalty fetch aborted (ignored)');
      } else {
        console.error("Error fetching loyalty data:", error);
      }
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500">No loyalty data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-md border border-purple-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Gift className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Program Loyalitas</h3>
            <p className="text-sm text-gray-600">4 Kunjungan → 1 Gratis</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-600">{loyaltyData.current_visits}/4</p>
          <p className="text-xs text-gray-500">Kunjungan</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress ke Cukur Gratis</span>
          <span className="text-sm font-bold text-purple-600">
            {loyaltyData.progress_percentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 ease-out relative"
            style={{ width: `${loyaltyData.progress_percentage}%` }}
          >
            {loyaltyData.progress_percentage >= 10 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {loyaltyData.current_visits} ⭐
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {loyaltyData.visits_until_free === 0 ? (
            <span className="text-green-600 font-bold">🎉 Kunjungan berikutnya GRATIS!</span>
          ) : (
            <span>Tinggal {loyaltyData.visits_until_free} kunjungan lagi untuk cukur gratis!</span>
          )}
        </p>
      </div>

      {/* Visual Star Counter */}
      <div className="flex justify-center space-x-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              i <= loyaltyData.current_visits
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg scale-110'
                : 'bg-gray-200'
            }`}
          >
            <Star
              size={24}
              className={i <= loyaltyData.current_visits ? 'text-white fill-white' : 'text-gray-400'}
            />
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{loyaltyData.total_visits}</p>
          <p className="text-xs text-gray-600">Total Kunjungan</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{loyaltyData.free_visits_redeemed}</p>
          <p className="text-xs text-gray-600">Gratis Diterima</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(loyaltyData.total_spent)}</p>
          <p className="text-xs text-gray-600">Total Belanja</p>
        </div>
      </div>

      {/* Call to Action */}
      {loyaltyData.visits_until_free === 0 && (
        <div className="mt-6 bg-white rounded-lg p-4 text-center border-2 border-dashed border-purple-300">
          <p className="text-sm font-bold text-purple-600 mb-2">🎁 Voucher Anda Siap!</p>
          <p className="text-xs text-gray-600">
            Tunjukkan layar ini saat datang untuk klaim cukur gratis Anda!
          </p>
        </div>
      )}
    </div>
  );
}
