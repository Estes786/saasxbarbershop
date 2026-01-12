"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Phone, Clock, CheckCircle2, Users } from 'lucide-react';

interface Branch {
  id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  phone: string;
  operating_hours: {
    [key: string]: { open: string; close: string };
  };
  is_active: boolean;
}

interface BranchSelectorProps {
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
}

export default function BranchSelector({ selectedBranchId, onSelectBranch }: BranchSelectorProps) {
  const supabase = createClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [capsterCounts, setCapsterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    try {
      setLoading(true);

      // Load active branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('branch_name', { ascending: true });

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

      // Count capsters per branch
      const { data: capstersData } = await supabase
        .from('capsters')
        .select('branch_id');

      if (capstersData) {
        const counts: Record<string, number> = {};
        (capstersData as Array<{branch_id: string | null}>).forEach((capster) => {
          if (capster.branch_id) {
            counts[capster.branch_id] = (counts[capster.branch_id] || 0) + 1;
          }
        });
        setCapsterCounts(counts);
      }

    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTodaySchedule(operatingHours: any): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const schedule = operatingHours[today];
    return schedule ? `${schedule.open} - ${schedule.close}` : 'Tutup';
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Memuat cabang...</p>
        </div>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <MapPin className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600">Belum ada cabang tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
        <h3 className="text-lg font-bold text-gray-900">Pilih Cabang</h3>
        <p className="text-sm text-gray-600 mt-1">Pilih lokasi barbershop terdekat Anda</p>
      </div>

      <div className="p-5 space-y-3">
        {/* 🆕 NEW: "All Branches" option for NULL branch support */}
        <button
          onClick={() => onSelectBranch('')}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selectedBranchId === '' || !selectedBranchId
              ? 'border-purple-500 bg-purple-50 shadow-md'
              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-bold text-gray-900">🌐 Semua Cabang</h4>
                {(selectedBranchId === '' || !selectedBranchId) && (
                  <CheckCircle2 size={20} className="text-purple-600" />
                )}
              </div>
              <p className="text-xs text-purple-600 font-medium mb-3">Lihat semua layanan & capster</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600">Pilihan dari semua lokasi tersedia</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={14} className="text-gray-400" />
                  <p className="text-gray-600">Semua capster tersedia</p>
                </div>
              </div>
            </div>
          </div>
        </button>
        
        {branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id;
          const capsterCount = capsterCounts[branch.id] || 0;

          return (
            <button
              key={branch.id}
              onClick={() => onSelectBranch(branch.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-bold text-gray-900">{branch.branch_name}</h4>
                    {isSelected && (
                      <CheckCircle2 size={20} className="text-purple-600" />
                    )}
                  </div>
                  <p className="text-xs text-purple-600 font-medium mb-3">{branch.branch_code}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600">{branch.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-gray-400" />
                      <p className="text-gray-600">{branch.phone}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-gray-400" />
                      <p className="text-gray-600">Hari ini: {getTodaySchedule(branch.operating_hours)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users size={14} className="text-gray-400" />
                      <p className="text-gray-600">{capsterCount} Capster tersedia</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {(selectedBranchId === '' || !selectedBranchId) && (
        <div className="p-4 bg-purple-50 border-t border-purple-100">
          <p className="text-sm text-purple-800 text-center font-medium">
            ✅ Semua layanan & capster dipilih! Lanjutkan untuk memilih.
          </p>
        </div>
      )}
      {selectedBranchId && selectedBranchId !== '' && (
        <div className="p-4 bg-green-50 border-t border-green-100">
          <p className="text-sm text-green-800 text-center font-medium">
            ✅ Cabang dipilih! Lanjutkan untuk memilih capster.
          </p>
        </div>
      )}
    </div>
  );
}
