import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/analytics/StatsCards'
import OccupationChart from '@/components/analytics/OccupationChart'
import GenerationDistribution from '@/components/analytics/GenerationDistribution'
import DocumentVault from '@/components/analytics/DocumentVault'
import BirthdayReminders from '@/components/reminders/BirthdayReminders'
import TraditionArchive from '@/components/traditions/TraditionArchive'
import MigrationMapClient from '@/components/analytics/MigrationMapClient'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  let stats: any = null
  let occupationTrends: any[] = []
  let migrationData: any[] = []
  let hasData = false

  if (supabase) {
    // Fetch all analytics data concurrently
    const [
      { data: statsData },
      { data: occData },
      { data: migData }
    ] = await Promise.all([
      supabase.from('view_statistics').select('*').single(),
      supabase.from('view_occupation_trends').select('*'),
      supabase.from('view_migration_timeline').select('*')
    ])

    stats = statsData
    occupationTrends = occData || []
    migrationData = migData || []
    
    if (stats && stats.total_members > 0) {
      hasData = true
    }
  }

  if (!hasData) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
            <span className="text-6xl mb-6 block">📊</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No data to analyze</h1>
            <p className="text-gray-500 mb-8">Add family members and stories to unlock AI-powered insights and historical trends.</p>
            <Link href="/submit" className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg">
              Start Contributing
            </Link>
          </div>
          {!supabase && (
            <p className="mt-6 text-xs text-amber-600 bg-amber-50 py-2 px-4 rounded-full inline-block border border-amber-200">
              ⚠️ Configuration Required: Supabase is not connected.
            </p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Family Analytics</h1>
            <p className="text-gray-500 mt-2">Insights into our heritage, growth, and journey across generations.</p>
          </div>
          <Link href="/" className="text-primary hover:text-primary-dark font-bold text-sm">
            ← Back Home
          </Link>
        </div>

        {/* 1. Overview Stats */}
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* 2. Occupation Trends */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>💼</span> Occupation Trends
            </h2>
            <div className="h-[300px] w-full">
              <OccupationChart data={occupationTrends} />
            </div>
          </div>

          {/* 3. Generation Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🌳</span> Generation Distribution
            </h2>
            <div className="h-[300px] w-full">
              <GenerationDistribution data={stats?.members_by_generation} />
            </div>
          </div>
        </div>

        {/* 4. Document Vault */}
        <div className="mt-8">
          <DocumentVault />
        </div>

        {/* 5. Traditions & Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <TraditionArchive />
          </div>
          <div>
            <BirthdayReminders />
          </div>
        </div>

        {/* 6. Migration Map */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📍</span> Family Migration Map
            </h2>
            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Visualizing our journey
            </div>
          </div>
          <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-100">
            <MigrationMapClient data={migrationData} />
          </div>
          <div className="mt-4 text-sm text-gray-500 italic">
            * Map shows major migration routes and ancestral locations recorded in our history.
          </div>
        </div>
      </div>
    </main>
  )
}
