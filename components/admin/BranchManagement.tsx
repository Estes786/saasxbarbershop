"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, MapPin, Phone, Clock, Users, Save, X } from 'lucide-react';

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
  created_at: string;
}

interface Capster {
  id: string;
  capster_name: string;
  branch_id: string | null;
}

export default function BranchManagement() {
  const supabase = createClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [capsters, setCapsters] = useState<Capster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    address: '',
    phone: '',
    operating_hours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '09:00', close: '21:00' },
      sunday: { open: '09:00', close: '21:00' },
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

      // Load capsters
      const { data: capstersData, error: capstersError } = await supabase
        .from('capsters')
        .select('id, capster_name, branch_id');

      if (capstersError) throw capstersError;
      setCapsters(capstersData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        // Update existing branch
        const { error } = await (supabase as any)
          .from('branches')
          .update({
            branch_name: formData.branch_name,
            branch_code: formData.branch_code,
            address: formData.address,
            phone: formData.phone,
            operating_hours: formData.operating_hours,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBranch.id);

        if (error) throw error;
      } else {
        // Create new branch
        const { error } = await (supabase as any)
          .from('branches')
          .insert([{
            branch_name: formData.branch_name,
            branch_code: formData.branch_code,
            address: formData.address,
            phone: formData.phone,
            operating_hours: formData.operating_hours,
            is_active: true,
            barbershop_id: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (error) throw error;
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Gagal menyimpan branch');
    }
  }

  async function handleDelete(branchId: string) {
    if (!confirm('Yakin ingin menghapus branch ini?')) return;

    try {
      const { error } = await (supabase as any)
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Gagal menghapus branch');
    }
  }

  async function handleAssignCapster(branchId: string, capsterId: string) {
    try {
      const { error } = await (supabase as any)
        .from('capsters')
        .update({ branch_id: branchId })
        .eq('id', capsterId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error assigning capster:', error);
      alert('Gagal assign capster');
    }
  }

  async function handleUnassignCapster(capsterId: string) {
    try {
      const { error } = await (supabase as any)
        .from('capsters')
        .update({ branch_id: null })
        .eq('id', capsterId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error unassigning capster:', error);
      alert('Gagal unassign capster');
    }
  }

  function openModal(branch?: Branch) {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        branch_name: branch.branch_name,
        branch_code: branch.branch_code,
        address: branch.address,
        phone: branch.phone,
        operating_hours: branch.operating_hours as any
      });
    } else {
      setEditingBranch(null);
      setFormData({
        branch_name: '',
        branch_code: '',
        address: '',
        phone: '',
        operating_hours: {
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '09:00', close: '21:00' },
          sunday: { open: '09:00', close: '21:00' },
        }
      });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBranch(null);
  }

  function getCapsterCount(branchId: string): number {
    return capsters.filter(c => c.branch_id === branchId).length;
  }

  function getAssignedCapsters(branchId: string): Capster[] {
    return capsters.filter(c => c.branch_id === branchId);
  }

  function getUnassignedCapsters(): Capster[] {
    return capsters.filter(c => !c.branch_id);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data branches...</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Branch Management</h2>
            <p className="text-gray-600 mt-1">Kelola semua cabang barbershop</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            <span>Tambah Branch</span>
          </button>
        </div>
      </div>

      {/* Branches List */}
      <div className="p-6">
        {branches.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Belum ada branch. Tambahkan branch pertama Anda!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div key={branch.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{branch.branch_name}</h3>
                    <p className="text-sm text-purple-600 font-medium">{branch.branch_code}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(branch)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <p className="text-gray-600">{branch.address}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-gray-400" />
                    <p className="text-gray-600">{branch.phone}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-400" />
                    <p className="text-gray-600">
                      {branch.operating_hours.monday.open} - {branch.operating_hours.monday.close}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-gray-400" />
                    <p className="text-gray-600">{getCapsterCount(branch.id)} Capster</p>
                  </div>
                </div>

                {/* Assigned Capsters */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Capster di Branch:</p>
                  {getAssignedCapsters(branch.id).length === 0 ? (
                    <p className="text-xs text-gray-400">Belum ada capster</p>
                  ) : (
                    <div className="space-y-1">
                      {getAssignedCapsters(branch.id).map((capster) => (
                        <div key={capster.id} className="flex items-center justify-between bg-purple-50 rounded px-2 py-1">
                          <span className="text-xs text-gray-700">{capster.capster_name}</span>
                          <button
                            onClick={() => handleUnassignCapster(capster.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Assign Capster Dropdown */}
                  {getUnassignedCapsters().length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignCapster(branch.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">+ Assign Capster</option>
                      {getUnassignedCapsters().map((capster) => (
                        <option key={capster.id} value={capster.id}>
                          {capster.capster_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBranch ? 'Edit Branch' : 'Tambah Branch Baru'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Branch
                  </label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Branch
                  </label>
                  <input
                    type="text"
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Operasional
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.keys(formData.operating_hours).map((day) => {
                      const dayHours = (formData.operating_hours as any)[day];
                      return (
                        <div key={day} className="flex items-center space-x-2">
                          <span className="w-20 text-gray-600 capitalize">{day}</span>
                          <input
                            type="time"
                            value={dayHours.open}
                            onChange={(e) => setFormData({
                              ...formData,
                              operating_hours: {
                                ...formData.operating_hours,
                                [day]: { ...dayHours, open: e.target.value }
                              } as any
                            })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={dayHours.close}
                            onChange={(e) => setFormData({
                              ...formData,
                              operating_hours: {
                                ...formData.operating_hours,
                                [day]: { ...dayHours, close: e.target.value }
                              } as any
                            })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Save size={18} />
                  <span>{editingBranch ? 'Update' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
