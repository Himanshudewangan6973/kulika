'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'react-flow-renderer'
import { Users, FileText, MapPin, Search } from 'lucide-react'
import { useTreeStore } from './store'

const FamilyNode = ({ id, data, selected }: NodeProps) => {
  const searchQuery = useTreeStore(state => state.searchQuery)
  const isPending = data.status === 'Pending'

  // Determine if this node matches the search query
  const isMatch = React.useMemo(() => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      data.full_name?.toLowerCase().includes(query) ||
      data.nickname?.toLowerCase().includes(query) ||
      data.birth_place?.toLowerCase().includes(query)
    )
  }, [data.full_name, data.nickname, data.birth_place, searchQuery])

  // Optimization: use opacity for non-matches
  const opacity = isMatch ? 1 : 0.2

  return (
    <div 
      style={{ opacity, transition: 'opacity 0.2s ease-in-out' }}
      className={`group relative px-3 py-2 shadow-sm rounded-lg bg-white border transition-all hover:shadow-xl hover:z-[100] ${
        selected 
          ? 'border-blue-500 ring-2 ring-blue-100' 
          : isPending 
            ? 'border-orange-500 ring-2 ring-orange-100' 
            : 'border-gray-200'
      } w-48`}
    >
      {isPending && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 animate-pulse">
          PENDING
        </div>
      )}

      {/* Search Match Highlight */}
      {searchQuery && isMatch && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-10">
          <Search size={10} />
        </div>
      )}

      {/* Standard State */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 overflow-hidden">
          {data.profile_photo_url ? (
            <img src={data.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            data.full_name?.charAt(0) || '?'
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-900 truncate">{data.full_name}</div>
          <div className="text-[10px] text-gray-500 truncate">
            {data.date_of_birth?.substring(0,4) || '?'} - {data.date_of_death?.substring(0,4) || 'Pres'}
          </div>
        </div>
      </div>
      
      {/* Expanded State (Tooltip style on hover instead of width change) */}
      <div className="absolute top-full left-0 w-64 mt-2 p-3 bg-white border border-blue-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none">
        <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
          <div className="flex items-center gap-1 text-gray-600">
            <Users size={12} className="text-blue-400" />
            <span>{data.children_count || 0} Children</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <FileText size={12} className="text-blue-400" />
            <span>{data.story_count || 0} Stories</span>
          </div>
        </div>
        
        {data.birth_place && (
          <div className="flex items-start gap-1 text-[10px] text-gray-500 mb-2">
            <MapPin size={12} className="text-orange-400 shrink-0 mt-0.5" />
            <span>{data.birth_place}</span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase">
            <span>Profile Completeness</span>
            <span>85%</span>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visible in standard state) */}
      <div className="mt-1.5 h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400" style={{ width: '85%' }}></div>
      </div>

      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-blue-300 border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-blue-300 border-none" />
    </div>
  )
}

export default memo(FamilyNode)
