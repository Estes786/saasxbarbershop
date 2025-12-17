import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          🚀 OASIS BI PRO x Barbershop
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Data Monetization Engine untuk Barbershop Kedungrandu
        </p>
        
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Sistem Terintegrasi</h2>
          <ul className="text-left space-y-3">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Google Sheets → Data Collection Real-time
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Supabase → Database & Processing
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Dashboard → Predictive Insights & Actions
            </li>
          </ul>
        </div>

        <Link 
          href="/dashboard/barbershop"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
        >
          Buka Dashboard →
        </Link>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">🎯 Target KHL</h3>
            <p className="text-gray-600">Rp 2.5M/bulan tracked real-time</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">📊 Actionable Leads</h3>
            <p className="text-gray-600">Churn risk, coupon, review targets</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">💰 Revenue Analytics</h3>
            <p className="text-gray-600">Trends, predictions, insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
