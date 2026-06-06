/**
 * @file src/app/search/page.tsx
 * @description Semantic discovery and global search page.
 * Requirement: Leverages AI embeddings and full-text search to locate family heritage data.
 */

import SearchInterface from '@/components/search/SearchInterface'

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16 relative">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Semantic Discovery</h1>
          <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Discover family members and stories through AI-powered semantic search.
          </p>
        </header>

        <SearchInterface />
      </div>
    </main>
  )
}
