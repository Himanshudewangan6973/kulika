'use client'

import React from 'react'
import { useTreeStore } from './store'
import { Edit3, Plus, Link as LinkIcon, UserCheck, Search, Users, Trash2, Tag, Upload } from 'lucide-react'

export default function TreeToolbar({ onReviewClick }: { onReviewClick: () => void }) {
  const mode = useTreeStore(state => state.mode)
  const setMode = useTreeStore(state => state.setMode)
  const selectedNodes = useTreeStore(state => state.selectedNodes)
  const clearSelection = useTreeStore(state => state.clearSelection)
  const setSearchQuery = useTreeStore(state => state.setSearchQuery)
  const pendingChangesCount = useTreeStore(state => state.pendingChangesCount)
  const fetchPendingCount = useTreeStore(state => state.fetchPendingCount)

  React.useEffect(() => {
    fetchPendingCount()
  }, [fetchPendingCount])

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="bg-white p-2 rounded-lg shadow-md border flex items-center gap-2">
          <button 
            onClick={() => setMode('VIEW')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'VIEW' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            View
          </button>
          <button 
            onClick={() => setMode('EDIT')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${mode === 'EDIT' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Edit3 size={16} /> Edit Tree
          </button>
          <button 
            onClick={() => setMode('ADD')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${mode === 'ADD' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Plus size={16} /> Add Member
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <button className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1">
            <LinkIcon size={16} /> Connect
          </button>
        </div>

        {selectedNodes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg shadow-md flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-800">{selectedNodes.length} selected</span>
            <div className="w-px h-4 bg-blue-200"></div>
            <button className="text-gray-600 hover:text-blue-600" title="Edit Common Fields"><Edit3 size={16} /></button>
            <button className="text-gray-600 hover:text-blue-600" title="Add Same Tags"><Tag size={16} /></button>
            <button className="text-gray-600 hover:text-blue-600" title="Add to Same Photo"><Upload size={16} /></button>
            <div className="w-px h-4 bg-blue-200"></div>
            <button className="text-gray-600 hover:text-red-600" title="Delete All"><Trash2 size={16} /></button>
            <button onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700 ml-2">Clear</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 pointer-events-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search tree..." 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm w-64"
          />
        </div>
        <button onClick={onReviewClick} className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center gap-2 hover:bg-orange-200 transition-colors">
          <UserCheck size={16} /> Review ({pendingChangesCount})
        </button>
      </div>
    </div>
  )
}
