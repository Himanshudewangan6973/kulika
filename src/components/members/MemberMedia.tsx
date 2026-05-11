'use client'

import Image from 'next/image'
import EmptyState from '@/components/ui/EmptyState'

interface MemberMediaProps {
  media: any[]
}

export default function MemberMedia({ media }: MemberMediaProps) {
  if (!media || media.length === 0) {
    return (
      <EmptyState
        icon="📸"
        title="No photos tagged yet"
        description="Be the first to upload and tag this family member."
        className="animate-in fade-in duration-500"
      />
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {media.map((item) => (
        <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 transform hover:-translate-y-1">
          <div className="aspect-square bg-gray-100 relative">
            <Image
              src={item.r2_url || item.thumbnail_url}
              alt={item.description || 'Family memory'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center z-10">
              <button className="opacity-0 group-hover:opacity-100 bg-white text-primary px-4 py-2 rounded-xl shadow-lg transform scale-90 group-hover:scale-100 transition-all font-bold text-xs">
                View Details
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.description || 'No description'}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {item.date_taken ? new Date(item.date_taken).toLocaleDateString() : 'Unknown Date'}
              </p>
              {item.location && (
                <span className="text-[10px] text-primary font-bold">📍 {item.location}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
