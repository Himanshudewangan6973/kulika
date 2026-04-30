import { useState, useEffect } from 'react'

export default function StoryArchive() {
  const [filter, setFilter] = useState('All')
  const [stories, setStories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/stories?type=${filter}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to fetch')
        setStories(result.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [filter])

  return (
    <div className="space-y-8">
      <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
        {['All', 'Life Event', 'Achievement', 'Hardship', 'Tradition', 'Migration', 'Lesson'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === t ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100">
          <p className="font-bold">Error loading stories</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-4">📜</p>
          <h3 className="text-lg font-bold text-gray-800">No stories found</h3>
          <p className="text-gray-500 mt-1">Every voice matters. Be the first to record a family story.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          {stories.map((story) => (
            <div key={story.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-bold uppercase rounded-full border border-blue-100">
                  {story.story_type}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {story.event_date ? new Date(story.event_date).getFullYear() : 'Unknown'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{story.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-6 leading-relaxed italic">
                "{story.story_text}"
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-200">
                    {story.storyteller?.charAt(0) || 'U'}
                  </div>
                  <p className="text-xs font-bold text-gray-600">Narrated by {story.storyteller || 'Unknown'}</p>
                </div>
                {story.ai_processed && (
                  <span title="AI Summarized" className="text-lg grayscale hover:grayscale-0 transition-all cursor-help">🤖</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
