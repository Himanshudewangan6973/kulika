import SearchInterface from '@/components/search/SearchInterface'
import Link from 'next/link'

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Link href="/" className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl hover:rotate-3 transition-all">
              K
            </Link>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Intelligence Search</h1>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
            Discover family members and stories through AI-powered semantic search.
          </p>
        </header>

        <SearchInterface />
      </div>
    </main>
  )
}
