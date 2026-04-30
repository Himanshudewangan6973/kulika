import { useState } from 'react'

export default function SearchInterface() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Search failed')
      
      setResults(result.data.results || [])
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for names, stories, or themes like 'resilience'..."
          className="w-full px-8 py-6 bg-white border-2 border-primary/20 rounded-3xl text-xl shadow-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none pl-16"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
        >
          {isSearching ? 'Analyzing...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-center">
          {error}
        </div>
      )}

      {query && !error && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isSearching ? 'Searching across history...' : `Found ${results.length} connections for "${query}"`}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result) => (
              <a
                key={`${result.type}-${result.id}`}
                href={result.link}
                className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md mb-2 inline-block ${
                    result.type === 'Member' ? 'bg-blue-50 text-blue-600' :
                    result.type === 'Story' ? 'bg-green-50 text-green-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {result.type}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{result.title}</h3>
                  <p className="text-sm text-gray-500">{result.subtitle}</p>
                </div>
                <span className="text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1">→</span>
              </a>
            ))}
          </div>

          {!isSearching && results.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-4">🏜️</p>
              <h3 className="text-lg font-bold text-gray-800">No results found</h3>
              <p className="text-gray-500 mt-1">Try searching for a different branch of the tree or a family theme.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
