"use client"

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

import { useFamilySpaceStore } from '@/store/familySpaceStore'

const PAGE_SIZE = 5

// Fetcher using standardized API
const fetchEvents = async (page: number, communityId?: string) => {
  const url = `/api/events?page=${page}&limit=${PAGE_SIZE}${communityId ? `&communityId=${communityId}` : ''}`;
  const response = await fetch(url);
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Unable to load events (Status: ${response.status})`);
  }

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error?.message || result.error || 'Failed to fetch events');
  }
  
  return result.data;
}

export default function TimelineView() {
  const { currentSpace } = useFamilySpaceStore()
  const [events, setEvents] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const { data: newEvents, error, isValidating } = useSWR(
    ['events', page, currentSpace?.id],
    () => fetchEvents(page, currentSpace?.id),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 300000 // Cache for 5 minutes
    }
  )

  useEffect(() => {
    if (newEvents) {
      setEvents(prev => page === 0 ? newEvents : [...prev, ...newEvents])
      setHasMore(newEvents.length === PAGE_SIZE)
    }
  }, [newEvents, page])

  const isLoading = isValidating && events.length === 0
  const isFetchingMore = isValidating && events.length > 0

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

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
      <ErrorState title="Error loading timeline" message={error?.message || 'Something went wrong'} />
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState 
        icon="⏳" 
        title="The journey awaits" 
        description="Start building the family timeline by adding historical events." 
      />
    )
  }

  return (
    <div className="space-y-12">
      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {events.map((event, _i) => (
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

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isFetchingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Loading More...
              </>
            ) : (
              'Load Older Events'
            )}
          </button>
        </div>
      )}

      {!hasMore && events.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-8 italic">You&apos;ve reached the beginning of our recorded history.</p>
      )}
    </div>
  )
}
