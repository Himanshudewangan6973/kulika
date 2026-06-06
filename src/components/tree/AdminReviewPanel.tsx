"use client"

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Clock } from 'lucide-react'
import { useTreeStore } from './store'
import { useFamilySpaceStore } from '@/store/familySpaceStore'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function AdminReviewPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentSpace } = useFamilySpaceStore()
  const showNotification = useTreeStore(state => state.showNotification)
  const markPendingMemberApproved = useTreeStore(state => state.markPendingMemberApproved)
  const markLocalMemberApproved = useTreeStore(state => state.markLocalMemberApproved)
  const localPendingNodes = useTreeStore(state =>
    state.nodes.filter(node => node.data.isTemporary && node.data.isLocalPreview)
  )
  const [pendingChanges, setPendingChanges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const fetchPendingChanges = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    
    let query = supabase
      .from('inbox')
      .select('*')
      .eq('status', 'Pending')
      .order('submission_date', { ascending: false })
      
    if (currentSpace?.id) {
      query = query.eq('community_id', currentSpace.id)
    }

    const { data, error: _error } = await query
    
    if (data) setPendingChanges(data)
    setLoading(false)
  }, [currentSpace?.id])

  useEffect(() => {
    if (isOpen && supabase) {
      fetchPendingChanges()
    }
  }, [isOpen, fetchPendingChanges])

  const handleApprove = async (change: any) => {
    try {
      const response = await fetch(`/api/admin/inbox/${change.id}/approve`, {
        method: 'POST',
      })

      const result = await response.json()
      if (!response.ok) {
        const errorMsg = result.error?.message || result.error || 'Approval failed'
        throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg)
      }

      if (change.submission_type === 'New Member' && result.record?.id) {
        markPendingMemberApproved(change.id, result.record.id)
      }

      showNotification('Change approved and applied!', 'success')
      fetchPendingChanges()
    } catch (error: any) {
      showNotification(error.message, 'error')
    }
  }

  const handleApproveLocal = (nodeId: string) => {
    markLocalMemberApproved(nodeId)
    showNotification('Preview member approved locally. Live data is unchanged.', 'success')
  }

  const handleReject = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase
      .from('inbox')
      .update({ status: 'Rejected', review_date: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      showNotification(error.message, 'error')
    } else {
      showNotification('Change rejected', 'success')
      fetchPendingChanges()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l z-[301] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
        <h2 className="font-black text-lg text-slate-900 tracking-tight">Pending Changes ({pendingChanges.length})</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingChanges.length === 0 && localPendingNodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Check size={48} className="text-green-200" />
            <p className="font-medium">All caught up!</p>
          </div>
        ) : (
          <>
            {localPendingNodes.map((node) => (
              <div key={node.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center justify-between bg-amber-50">
                  <span className="text-sm font-semibold flex items-center gap-1 text-amber-800">
                    <Clock size={14} /> Preview Member
                  </span>
                  <span className="text-[10px] text-amber-700">Local only</span>
                </div>
                <div className="p-3">
                  <div className="mb-3">
                    <p className="text-sm font-bold text-gray-800">{node.data.full_name}</p>
                    <p className="text-[10px] text-gray-500">Created while live database was unavailable</p>
                  </div>
                  <button
                    onClick={() => handleApproveLocal(node.id)}
                    className="w-full py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 transition flex items-center justify-center gap-1"
                  >
                    <Check size={14} /> Approve Locally
                  </button>
                </div>
              </div>
            ))}

            {pendingChanges.map((change) => (
              <div key={change.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
                <div className={`px-3 py-2 border-b flex items-center justify-between ${change.submission_type === 'New Member' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  <span className={`text-sm font-semibold flex items-center gap-1 ${change.submission_type === 'New Member' ? 'text-blue-800' : 'text-purple-800'}`}>
                    <Clock size={14} /> {change.submission_type}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(change.submission_date).toLocaleDateString()}</span>
                </div>
                <div className="p-3">
                  <div className="mb-3">
                    <p className="text-sm font-bold text-gray-800">{change.raw_data.full_name}</p>
                    <p className="text-[10px] text-gray-500">Submitted by: {change.submitter_name}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(change)}
                      className="flex-1 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => handleReject(change.id)}
                      className="flex-1 py-1.5 bg-white border border-red-300 text-red-600 rounded text-xs font-medium hover:bg-red-50 transition flex items-center justify-center gap-1"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {pendingChanges.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <button 
            onClick={() => {
              pendingChanges.forEach(c => handleApprove(c))
            }}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Approve All ({pendingChanges.length})
          </button>
        </div>
      )}
    </div>
  )
}
