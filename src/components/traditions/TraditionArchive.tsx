'use client'

interface Tradition {
  name: string
  type: string
  description: string
  icon: string
  color: string
}

const MOCK_TRADITIONS: Tradition[] = [
  { name: 'Diwali Celebration', type: 'Festival', description: 'Annual gathering at the ancestral home with 50+ members.', icon: '🪔', color: 'bg-amber-50 text-amber-700' },
  { name: 'Special Rice Recipe', type: 'Recipe', description: 'Grandmother\'s secret recipe passed down for 3 generations.', icon: '🍲', color: 'bg-green-50 text-green-700' },
  { name: 'Heritage Song', type: 'Music', description: 'Traditional folk song performed during family weddings.', icon: '🎵', color: 'bg-blue-50 text-blue-700' },
]

export default function TraditionArchive() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🎭</span> Cultural Archive
          </h3>
          <p className="text-sm text-gray-500 mt-1">Preserving our traditions, recipes, and rituals.</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
          + Add Tradition
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_TRADITIONS.map((item, i) => (
          <div key={i} className="group p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${item.color}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.type}</span>
            <h4 className="text-md font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">{item.name}</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
              {item.description}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400">12 Contributions</span>
              <span className="text-primary text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Read More →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
