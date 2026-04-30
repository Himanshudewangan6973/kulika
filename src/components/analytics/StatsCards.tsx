interface StatsCardsProps {
  stats: {
    total_members: number
    living_members: number
    deceased_members: number
    total_media: number
    total_stories: number
    max_generation: number
    avg_lifespan: number
    college_educated_count: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: 'Total Members', value: stats.total_members, icon: '👥', color: 'blue' },
    { label: 'Generations', value: stats.max_generation, icon: '🌳', color: 'green' },
    { label: 'Preserved Stories', value: stats.total_stories, icon: '✍️', color: 'amber' },
    { label: 'Media Items', value: stats.total_media, icon: '🖼️', color: 'purple' },
    { label: 'Education Rate', value: `${((stats.college_educated_count / stats.total_members) * 100).toFixed(0)}%`, icon: '🎓', color: 'indigo' },
    { label: 'Avg Lifespan', value: `${stats.avg_lifespan?.toFixed(1) || 'N/A'}y`, icon: '⏳', color: 'rose' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">{card.icon}</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
