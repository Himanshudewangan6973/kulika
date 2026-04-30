'use client'

interface MemberStoriesProps {
  stories: any[]
}

export default function MemberStories({ stories }: MemberStoriesProps) {
  if (!stories || stories.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 animate-in fade-in duration-500">
        <p className="text-4xl mb-4">📜</p>
        <p className="text-lg font-medium text-gray-600">No stories recorded yet</p>
        <p className="text-sm text-gray-400 mt-1">Preserve a memory of this member for future generations.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {stories.map((story) => (
        <div key={story.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <span className="px-4 py-1.5 bg-blue-50 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100/50">
              {story.story_type}
            </span>
            {story.event_date && (
              <span className="text-xs font-bold text-gray-400">
                {new Date(story.event_date).getFullYear()}
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors leading-tight">
            {story.title}
          </h3>
          
          <p className="text-gray-600 leading-relaxed italic mb-8 line-clamp-4 flex-1">
            "{story.story_text}"
          </p>
          
          <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                {story.storyteller?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Narrated by</p>
                <p className="text-sm font-bold text-gray-700">{story.storyteller || 'Unknown'}</p>
              </div>
            </div>
            {story.ai_summary && (
              <div className="group/ai relative">
                <span className="text-xl cursor-help opacity-50 hover:opacity-100 transition-opacity">🤖</span>
                <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-gray-900 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 group-hover/ai:opacity-100 transition-all pointer-events-none z-10 border border-gray-800">
                  <p className="font-bold text-blue-400 mb-2 uppercase tracking-widest">AI Summary</p>
                  <p className="leading-relaxed opacity-90">{story.ai_summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
