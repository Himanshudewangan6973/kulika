'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

const ITEMS_PER_PAGE = 12

// SWR Fetcher
const fetchMedia = async ([filter, page]: [string, number]) => {
  const supabase = createClient()
  if (!supabase) throw new Error("Supabase not configured")

  const from = page * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('media')
    .select('*', { count: 'exact' })
    .order('upload_date', { ascending: false })
    .range(from, to)

  if (filter !== 'All') {
    const dbType = filter.endsWith('s') ? filter.slice(0, -1) : filter
    query = query.eq('file_type', dbType)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export default function MediaGallery() {
  const [filter, setFilter] = useState('All')
  const [media, setMedia] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // Use SWR for caching and revalidation
  const { data: newItems, error, isValidating } = useSWR(
    [filter, page],
    fetchMedia,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  )

  // Merge new items into local state for infinite scroll
  useEffect(() => {
    if (newItems) {
      setMedia(prev => page === 0 ? newItems : [...prev, ...newItems])
      setHasMore(newItems.length === ITEMS_PER_PAGE)
    }
  }, [newItems, page])

  const observer = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isValidating) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1)
      }
    })
    
    if (node) observer.current.observe(node)
  }, [isValidating, hasMore])

  // Reset when filter changes
  useEffect(() => {
    setMedia([])
    setPage(0)
    setHasMore(true)
  }, [filter])

  const isLoading = isValidating && media.length === 0

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
        <ErrorState title="Error loading gallery" message={error} />
      ) : media.length === 0 ? (
        <EmptyState 
          icon="📸" 
          title="No memories found" 
          description="Start preserving family history by uploading your first photo." 
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {media.map((item, index) => (
              <div 
                key={item.id} 
                ref={index === media.length - 1 ? lastElementRef : null}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 transform hover:-translate-y-1"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <Image
                    src={item.r2_url || item.thumbnail_url}
                    alt={item.description || item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center z-10">
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
          
          {isLoading && page > 0 && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {!hasMore && media.length > 0 && (
            <p className="text-center text-gray-400 text-sm py-12 italic">You&apos;ve reached the end of the archive.</p>
          )}
        </>
      )}
    </div>
  )
}
