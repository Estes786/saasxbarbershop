'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronRight, ChevronLeft, Scissors, Users, ClipboardList, Key, TestTube } from 'lucide-react'

// Step Types
type OnboardingStep = 1 | 2 | 3 | 4 | 5

interface BarbershopData {
  name: string
  address: string
  phone: string
  open_time: string
  close_time: string
  days_open: string[]
}

interface CapsterData {
  name: string
  specialization: string
  phone: string
}

interface ServiceData {
  service_name: string
  price: number
  duration_minutes: number
  category: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: Barbershop Profile
  const [barbershopData, setBarbershopData] = useState<BarbershopData>({
    name: '',
    address: '',
    phone: '',
    open_time: '09:00',
    close_time: '21:00',
    days_open: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  })

  // Step 2: Capster Setup
  const [capsters, setCapsters] = useState<CapsterData[]>([
    { name: '', specialization: 'Classic Haircut', phone: '' }
  ])

  // Step 3: Service Catalog
  const [services, setServices] = useState<ServiceData[]>([
    { service_name: 'Cukur Dewasa', price: 18000, duration_minutes: 30, category: 'haircut' },
    { service_name: 'Cukur Anak', price: 15000, duration_minutes: 20, category: 'haircut' },
    { service_name: 'Cukur + Keramas', price: 25000, duration_minutes: 45, category: 'package' }
  ])

  // Step 4: Access Keys (Auto-generated)
  const [accessKeys, setAccessKeys] = useState({
    customer: `CUSTOMER_${Date.now()}`,
    capster: `CAPSTER_${Date.now()}`
  })

  const steps = [
    { id: 1, name: 'Profil Barbershop', icon: Scissors },
    { id: 2, name: 'Setup Capster', icon: Users },
    { id: 3, name: 'Katalog Layanan', icon: ClipboardList },
    { id: 4, name: 'Access Keys', icon: Key },
    { id: 5, name: 'Test Booking', icon: TestTube }
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as OnboardingStep)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard/admin')
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      // Call Supabase function to complete onboarding
      const { data, error } = await (supabase as any).rpc('complete_onboarding', {
        p_barbershop_data: barbershopData,
        p_capsters: capsters,
        p_services: services,
        p_access_keys: accessKeys
      })

      if (error) {
        console.error('Onboarding error:', error)
        alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.')
        return
      }

      if (data && data.success) {
        // Redirect to dashboard with success message
        router.push('/dashboard/admin?onboarding_complete=true')
      } else {
        alert(data?.error || 'Gagal menyelesaikan onboarding')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const addCapster = () => {
    setCapsters([...capsters, { name: '', specialization: 'Classic Haircut', phone: '' }])
  }

  const removeCapster = (index: number) => {
    setCapsters(capsters.filter((_, i) => i !== index))
  }

  const updateCapster = (index: number, field: keyof CapsterData, value: string) => {
    const updated = [...capsters]
    updated[index] = { ...updated[index], [field]: value }
    setCapsters(updated)
  }

  const addService = () => {
    setServices([...services, { service_name: '', price: 0, duration_minutes: 30, category: 'haircut' }])
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: keyof ServiceData, value: string | number) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const toggleDay = (day: string) => {
    setBarbershopData({
      ...barbershopData,
      days_open: barbershopData.days_open.includes(day)
        ? barbershopData.days_open.filter(d => d !== day)
        : [...barbershopData.days_open, day]
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Setup Barbershop Anda</h1>
              <p className="text-sm text-gray-600 mt-1">Mari kita siapkan barbershop Anda dalam 5 langkah mudah</p>
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Lewati Setup →
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                          ${isCompleted ? 'bg-green-600 border-green-600 text-white' : ''}
                          ${isCurrent ? 'bg-amber-600 border-amber-600 text-white' : ''}
                          ${!isCompleted && !isCurrent ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                        `}
                      >
                        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {/* Step 1: Barbershop Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil Barbershop</h2>
                <p className="text-sm text-gray-600">Informasi dasar tentang barbershop Anda</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Barbershop *
                  </label>
                  <input
                    type="text"
                    value={barbershopData.name}
                    onChange={(e) => setBarbershopData({ ...barbershopData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Contoh: BOZQ Barbershop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat *
                  </label>
                  <textarea
                    value={barbershopData.address}
                    onChange={(e) => setBarbershopData({ ...barbershopData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Jl. Contoh No. 123, Kota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={barbershopData.phone}
                    onChange={(e) => setBarbershopData({ ...barbershopData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="08123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Buka
                    </label>
                    <input
                      type="time"
                      value={barbershopData.open_time}
                      onChange={(e) => setBarbershopData({ ...barbershopData, open_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Tutup
                    </label>
                    <input
                      type="time"
                      value={barbershopData.close_time}
                      onChange={(e) => setBarbershopData({ ...barbershopData, close_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari Operasional
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${barbershopData.days_open.includes(day)
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Capster Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Capster</h2>
                <p className="text-sm text-gray-600">Tambahkan barber/capster yang bekerja di barbershop Anda</p>
              </div>

              <div className="space-y-4">
                {capsters.map((capster, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Capster #{index + 1}</h3>
                      {capsters.length > 1 && (
                        <button
                          onClick={() => removeCapster(index)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                      <input
                        type="text"
                        value={capster.name}
                        onChange={(e) => updateCapster(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Nama Capster"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi</label>
                      <select
                        value={capster.specialization}
                        onChange={(e) => updateCapster(index, 'specialization', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="Classic Haircut">Classic Haircut</option>
                        <option value="Modern Style">Modern Style</option>
                        <option value="Beard Specialist">Beard Specialist</option>
                        <option value="Kids Haircut">Kids Haircut</option>
                        <option value="All Services">All Services</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                      <input
                        type="tel"
                        value={capster.phone}
                        onChange={(e) => updateCapster(index, 'phone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="08123456789"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addCapster}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 font-medium transition-colors"
                >
                  + Tambah Capster
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Service Catalog */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Katalog Layanan</h2>
                <p className="text-sm text-gray-600">Atur layanan dan harga yang tersedia</p>
              </div>

              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Layanan #{index + 1}</h3>
                      {services.length > 1 && (
                        <button
                          onClick={() => removeService(index)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan *</label>
                        <input
                          type="text"
                          value={service.service_name}
                          onChange={(e) => updateService(index, 'service_name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Cukur Dewasa"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(index, 'price', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="18000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                        <input
                          type="number"
                          value={service.duration_minutes}
                          onChange={(e) => updateService(index, 'duration_minutes', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="30"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                          value={service.category}
                          onChange={(e) => updateService(index, 'category', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="haircut">Haircut</option>
                          <option value="grooming">Grooming</option>
                          <option value="coloring">Coloring</option>
                          <option value="package">Package</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addService}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 font-medium transition-colors"
                >
                  + Tambah Layanan
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Access Keys */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Keys</h2>
                <p className="text-sm text-gray-600">Keys ini untuk registrasi customer dan capster Anda</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-900">Customer Access Key</h3>
                    <span className="text-xs text-blue-600 font-medium">PUBLIC</span>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-300 font-mono text-sm text-gray-900 break-all">
                    {accessKeys.customer}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    ✓ Bagikan ke customer saat mereka registrasi online
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-900">Capster Access Key</h3>
                    <span className="text-xs text-green-600 font-medium">INTERNAL</span>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-300 font-mono text-sm text-gray-900 break-all">
                    {accessKeys.capster}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    ✓ Berikan ke capster/barber yang bekerja di barbershop Anda
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">💡 Cara Menggunakan Access Keys:</h4>
                  <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                    <li>Customer dan Capster akan diminta memasukkan key ini saat registrasi</li>
                    <li>Keys ini menjaga eksklusivitas dan mencegah registrasi sembarangan</li>
                    <li>Anda bisa generate key baru kapan saja dari dashboard Admin</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Test Booking */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-green-600" size={40} />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Setup Selesai!</h2>
                <p className="text-gray-600">Barbershop Anda siap menerima booking online</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">🎉 Yang Sudah Tersedia:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <Check className="text-green-600 mt-0.5" size={16} />
                    <span><strong>Profil Barbershop:</strong> {barbershopData.name}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="text-green-600 mt-0.5" size={16} />
                    <span><strong>Capster:</strong> {capsters.length} capster terdaftar</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="text-green-600 mt-0.5" size={16} />
                    <span><strong>Layanan:</strong> {services.length} layanan tersedia</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="text-green-600 mt-0.5" size={16} />
                    <span><strong>Access Keys:</strong> Siap dibagikan</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🚀 Langkah Selanjutnya:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Pergi ke Dashboard Admin untuk melihat overview</li>
                  <li>Bagikan Customer Access Key kepada pelanggan Anda</li>
                  <li>Berikan Capster Access Key kepada barber Anda</li>
                  <li>Mulai terima booking online! 🎊</li>
                </ol>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`
                flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-colors
                ${currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <ChevronLeft size={20} />
              <span>Sebelumnya</span>
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>Selesai & Pergi ke Dashboard</span>
                    <Check size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Butuh bantuan? <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">Hubungi Support</a>
          </p>
        </div>
      </div>
    </div>
  )
}
