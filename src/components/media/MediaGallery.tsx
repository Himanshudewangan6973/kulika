import { useState, useEffect } from 'react'

export default function MediaGallery() {
  const [filter, setFilter] = useState('All')
  const [media, setMedia] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/media?type=${filter}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to fetch')
        setMedia(result.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [filter])

  return (
    <div className="space-y-6">
      <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
        {['All', 'Photos', 'Videos', 'Documents'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === f ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="aspect-square bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100">
          <p className="font-bold">Error loading gallery</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : media.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-4">📸</p>
          <h3 className="text-lg font-bold text-gray-800">No memories found</h3>
          <p className="text-gray-500 mt-1">Start preserving family history by uploading your first photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 transform hover:-translate-y-1">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={item.r2_url || item.thumbnail_url}
                  alt={item.description || item.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 bg-white text-primary px-4 py-2 rounded-xl shadow-lg transform scale-90 group-hover:scale-100 transition-all font-bold text-xs">
                    View
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-800 truncate">{item.description || item.filename}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    {item.upload_date ? new Date(item.upload_date).toLocaleDateString() : 'Unknown'}
                  </p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">
                    {item.file_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
