import { useState, useEffect } from 'react'

export default function TimelineView() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/events')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to fetch')
        setEvents(result.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-8">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-32 bg-gray-100 rounded-2xl"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-700 border border-red-200 rounded-3xl text-center font-bold">
        Error loading timeline: {error}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <p className="text-4xl mb-4">⏳</p>
        <h3 className="text-lg font-bold text-gray-800">The journey awaits</h3>
        <p className="text-gray-500 mt-1">Start building the family timeline by adding historical events.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {events.map((event, i) => (
        <div key={event.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shadow-primary/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:scale-110 transition-transform">
            <span className="text-[10px] font-bold">{new Date(event.event_date).getFullYear()}</span>
          </div>
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[45%] p-6 rounded-3xl bg-white border border-gray-100 shadow-sm group-hover:shadow-xl transition-all group-hover:border-primary/20 transform group-hover:-translate-y-1">
            <div className="flex items-center justify-between space-x-2 mb-2">
              <div className="font-bold text-gray-900 text-lg">{event.name}</div>
              <time className="font-mono text-[10px] font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{event.event_type}</time>
            </div>
            <div className="text-gray-500 text-sm leading-relaxed mb-4">
              {event.description}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-gray-50 text-gray-400 px-3 py-1 rounded-full font-bold border border-gray-100 uppercase tracking-widest">
                📍 {event.location || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
