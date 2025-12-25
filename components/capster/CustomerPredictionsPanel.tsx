'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { TrendingUp, AlertTriangle, Calendar, Users, Clock, Target } from 'lucide-react';

interface CustomerPrediction {
  customer_phone: string;
  customer_name: string;
  predicted_next_visit_date: string | null;
  confidence_score: number;
  average_visit_interval_days: number;
  churn_risk_level: 'low' | 'medium' | 'high';
  churn_risk_score: number;
  last_visit_date: string;
  days_since_last_visit: number;
  total_visits: number;
}

export default function CustomerPredictionsPanel() {
  const { showToast } = useToast();
  const supabase = createClient();

  const [predictions, setPredictions] = useState<CustomerPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      setLoading(true);

      // Join predictions with customer data
      const { data, error } = await supabase
        .from('customer_predictions')
        .select(`
          *,
          barbershop_customers!inner(customer_name)
        `)
        .eq('prediction_date', new Date().toISOString().split('T')[0])
        .order('churn_risk_score', { ascending: false });

      if (error) throw error;

      const formattedData = (data as any)?.map((item: any) => ({
        customer_phone: item.customer_phone,
        customer_name: item.barbershop_customers?.customer_name || 'Unknown',
        predicted_next_visit_date: item.predicted_next_visit_date,
        confidence_score: item.confidence_score,
        average_visit_interval_days: item.average_visit_interval_days,
        churn_risk_level: item.churn_risk_level,
        churn_risk_score: item.churn_risk_score,
        last_visit_date: item.last_visit_date,
        days_since_last_visit: item.days_since_last_visit,
        total_visits: item.total_visits
      })) || [];

      setPredictions(formattedData);

    } catch (err: any) {
      console.error('Error loading predictions:', err);
      showToast('error', 'Gagal memuat prediksi customer');
    } finally {
      setLoading(false);
    }
  }

  const filteredPredictions = filter === 'all' 
    ? predictions 
    : predictions.filter(p => p.churn_risk_level === filter);

  const stats = {
    high: predictions.filter(p => p.churn_risk_level === 'high').length,
    medium: predictions.filter(p => p.churn_risk_level === 'medium').length,
    low: predictions.filter(p => p.churn_risk_level === 'low').length
  };

  function getRiskColor(level: string) {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  function getRiskIcon(level: string) {
    switch (level) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <TrendingUp className="w-7 h-7 mr-2 text-green-600" />
          Customer Visit Prediction
        </h2>
        <p className="text-gray-600">AI-powered prediction untuk customer yang akan datang</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`cursor-pointer rounded-xl p-6 transition-all ${
            filter === 'all' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-105' 
              : 'bg-white border-2 border-gray-200 hover:shadow-md'
          }`}
        >
          <Users className="w-8 h-8 mb-2" />
          <div className="text-3xl font-bold">{predictions.length}</div>
          <div className="text-sm opacity-90">Total Customers</div>
        </div>

        <div 
          onClick={() => setFilter('high')}
          className={`cursor-pointer rounded-xl p-6 transition-all ${
            filter === 'high' 
              ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg scale-105' 
              : 'bg-white border-2 border-gray-200 hover:shadow-md'
          }`}
        >
          <AlertTriangle className="w-8 h-8 mb-2 text-red-500" />
          <div className="text-3xl font-bold text-red-600">{stats.high}</div>
          <div className="text-sm text-gray-600">High Risk</div>
        </div>

        <div 
          onClick={() => setFilter('medium')}
          className={`cursor-pointer rounded-xl p-6 transition-all ${
            filter === 'medium' 
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg scale-105' 
              : 'bg-white border-2 border-gray-200 hover:shadow-md'
          }`}
        >
          <Clock className="w-8 h-8 mb-2 text-yellow-500" />
          <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
          <div className="text-sm text-gray-600">Medium Risk</div>
        </div>

        <div 
          onClick={() => setFilter('low')}
          className={`cursor-pointer rounded-xl p-6 transition-all ${
            filter === 'low' 
              ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg scale-105' 
              : 'bg-white border-2 border-gray-200 hover:shadow-md'
          }`}
        >
          <Target className="w-8 h-8 mb-2 text-green-500" />
          <div className="text-3xl font-bold text-green-600">{stats.low}</div>
          <div className="text-sm text-gray-600">Low Risk</div>
        </div>
      </div>

      {/* Predictions List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {filter === 'all' ? 'Semua Customer' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Risk Customers`}
          </h3>
          <span className="text-sm text-gray-500">
            {filteredPredictions.length} customers
          </span>
        </div>

        {filteredPredictions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Tidak ada data prediksi</p>
            <p className="text-sm">Prediksi akan muncul setelah customer memiliki riwayat kunjungan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPredictions.map((pred, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRiskColor(pred.churn_risk_level)}`}>
                      <span className="text-2xl">{getRiskIcon(pred.churn_risk_level)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{pred.customer_name}</h4>
                      <p className="text-sm text-gray-600">{pred.customer_phone}</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(pred.churn_risk_level)}`}>
                    {pred.churn_risk_level.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs mb-1">Last Visit</p>
                    <p className="font-semibold text-gray-900">{formatDate(pred.last_visit_date)}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-xs mb-1">Days Since Last</p>
                    <p className="font-semibold text-gray-900">{pred.days_since_last_visit} hari</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-xs mb-1">Predicted Next Visit</p>
                    <p className="font-semibold text-gray-900">{formatDate(pred.predicted_next_visit_date)}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-xs mb-1">Total Visits</p>
                    <p className="font-semibold text-gray-900">{pred.total_visits}x</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-1">Confidence:</span>
                    <span className="font-semibold text-green-600">{pred.confidence_score}%</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-600 mr-1">Risk Score:</span>
                    <span className={`font-semibold ${
                      pred.churn_risk_score > 80 ? 'text-red-600' :
                      pred.churn_risk_score > 50 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {pred.churn_risk_score.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-600 mr-1">Avg Interval:</span>
                    <span className="font-semibold text-gray-800">{pred.average_visit_interval_days} hari</span>
                  </div>
                </div>

                {pred.churn_risk_level === 'high' && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-800">
                      ⚠️ <strong>Action Required:</strong> Customer ini sudah {pred.days_since_last_visit} hari tidak datang. 
                      Pertimbangkan untuk mengirim reminder atau promo khusus.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          💡 <strong>Tip:</strong> Customer dengan high risk membutuhkan perhatian khusus. 
          Kirim reminder atau promo untuk meningkatkan retention rate.
        </p>
      </div>
    </div>
  );
}
