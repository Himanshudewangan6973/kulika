"use client"

import { useState } from 'react'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Search, Tag, Filter, Globe, Camera, Ghost, ChevronRight } from 'lucide-react'
import { useFamilySpaceStore } from '@/store/familySpaceStore'

const SUGGESTED_FILTERS = [
  { id: 'raipur', label: 'Raipur Branches', icon: Globe, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'deceased', label: 'Deceased Records', icon: Ghost, color: 'bg-slate-50 text-slate-600 border-slate-100' },
  { id: 'media', label: 'Missing Media', icon: Camera, color: 'bg-rose-50 text-rose-600 border-rose-100' },
]

export default function SearchInterface() {
  const { currentSpace } = useFamilySpaceStore()
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      const communityParam = currentSpace?.id ? `&communityId=${currentSpace.id}` : ''
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}${communityParam}`)
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Search service error (Status: ${response.status})`);
      }

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

  const toggleFilter = (id: string) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="space-y-6">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-[32px] blur opacity-10 group-hover:opacity-25 transition duration-500"></div>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search names, stories, or themes..."
              className="w-full px-8 py-8 bg-white border border-slate-200 rounded-[32px] text-2xl font-bold shadow-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none pl-16 placeholder:text-slate-300"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-500 transition-colors" size={32} />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? 'Analyzing...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 justify-center">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">
              <Filter size={14} /> Quick Filters
           </div>
           {SUGGESTED_FILTERS.map((f) => (
             <button
               key={f.id}
               onClick={() => toggleFilter(f.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                 activeFilters.includes(f.id) 
                   ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                   : `${f.color} hover:shadow-md`
               }`}
             >
               <f.icon size={14} />
               {f.label}
             </button>
           ))}
        </div>
      </div>

      {error && (
        <ErrorState message={error || 'Something went wrong'} />
      )}

      {query && !error && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {isSearching ? 'Searching across history...' : (
                <>Found <span className="text-indigo-600">{results.length}</span> connections for &quot;{query}&quot;</>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result) => (
              <a
                key={`${result.type}-${result.id}`}
                href={result.link}
                className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between group hover:border-indigo-100"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    result.type === 'Member' ? 'bg-blue-50 text-blue-600' :
                    result.type === 'Story' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {result.type === 'Member' ? <Tag size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${
                      result.type === 'Member' ? 'text-blue-500' :
                      result.type === 'Story' ? 'text-emerald-500' :
                      'text-amber-500'
                    }`}>
                      {result.type}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{result.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{result.subtitle}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all group-hover:translate-x-1">
                   <ChevronRight size={20} />
                </div>
              </a>
            ))}
          </div>

          {!isSearching && results.length === 0 && (
            <EmptyState 
              icon="🏜️" 
              title="No results found" 
              description="Try searching for a different branch of the tree or a family theme." 
            />
          )}
        </div>
      )}
    </div>
  )
}
