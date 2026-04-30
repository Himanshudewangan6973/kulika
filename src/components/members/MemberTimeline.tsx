'use client'

interface MemberTimelineProps {
  member: any
  events: any[]
  marriages: any[]
}

export default function MemberTimeline({ member, events, marriages }: MemberTimelineProps) {
  // Combine and sort all events for this member
  const timelineItems = [
    // 1. Birth
    ...(member.date_of_birth ? [{
      date: new Date(member.date_of_birth),
      title: `${member.full_name} Born`,
      type: 'Birth',
      location: member.birth_place || 'Unknown',
      description: 'The start of this journey.'
    }] : []),
    
    // 2. Marriages
    ...marriages.map(m => ({
      date: m.marriage_date ? new Date(m.marriage_date) : null,
      title: `Married to ${m.spouse1?.full_name === member.full_name ? m.spouse2?.full_name : m.spouse1?.full_name}`,
      type: 'Marriage',
      location: m.marriage_location || 'Unknown',
      description: m.notes || 'A new union formed.'
    })),
    
    // 3. General Events
    ...events.map(e => ({
      date: e.event_date ? new Date(e.event_date) : null,
      title: e.name,
      type: e.event_type,
      location: e.location || 'Unknown',
      description: e.description || ''
    })),
    
    // 4. Death
    ...(member.date_of_death ? [{
      date: new Date(member.date_of_death),
      title: `${member.full_name} Passed Away`,
      type: 'Legacy',
      location: member.current_location || 'Unknown',
      description: 'Leaving behind a lasting heritage.'
    }] : [])
  ]
  .filter(item => item.date !== null)
  .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  if (timelineItems.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 animate-in fade-in duration-500">
        <p className="text-4xl mb-4">⏳</p>
        <p className="text-lg font-medium text-gray-600">No timeline data available</p>
        <p className="text-sm text-gray-400 mt-1">Help build this member's journey by adding life events.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/0 before:via-primary/20 before:to-primary/0 animate-in fade-in slide-in-from-left-4 duration-700">
      {timelineItems.map((item, i) => (
        <div key={i} className="relative flex items-center group">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary text-white shadow-lg shrink-0 z-10 group-hover:scale-110 transition-transform">
            <span className="text-[10px] font-bold">{item.date?.getFullYear()}</span>
          </div>
          
          {/* Card */}
          <div className="ml-10 w-full p-6 rounded-2xl bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div className="font-bold text-gray-900 text-lg">{item.title}</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded border border-primary/10">
                  {item.type}
                </span>
                <time className="font-mono text-xs font-bold text-gray-400">
                  {item.date?.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                </time>
              </div>
            </div>
            
            {item.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-4 italic">
                "{item.description}"
              </p>
            )}
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] bg-gray-50 text-gray-500 px-3 py-1 rounded-full font-bold border border-gray-100 flex items-center gap-1">
                <span className="text-xs">📍</span> {item.location}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
