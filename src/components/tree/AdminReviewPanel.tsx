"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { X, Check, Edit2, AlertCircle, Trash2, Clock } from 'lucide-react'
import { useTreeStore } from './store'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function AdminReviewPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const showNotification = useTreeStore(state => state.showNotification)
  const [pendingChanges, setPendingChanges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const fetchPendingChanges = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('inbox')
      .select('*')
      .eq('status', 'Pending')
      .order('submission_date', { ascending: false })
    
    if (data) setPendingChanges(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen && supabase) {
      fetchPendingChanges()
    }
  }, [isOpen, fetchPendingChanges])

  const handleApprove = async (change: any) => {
    try {
      if (!supabase) return

      // 1. If it's a new member, insert into family_members
      if (change.submission_type === 'New Member') {
        const { error: insertError } = await supabase
          .from('family_members')
          .insert(change.raw_data)
        if (insertError) throw insertError
      } 
      // 2. If it's an update, update family_members
      else if (change.submission_type === 'Update Member' && change.linked_record_id) {
        const { error: updateError } = await supabase
          .from('family_members')
          .update(change.raw_data)
          .eq('id', change.linked_record_id)
        if (updateError) throw updateError
      }

      // 3. Mark as Approved in inbox
      const { error: approveError } = await supabase
        .from('inbox')
        .update({ status: 'Approved', review_date: new Date().toISOString() })
        .eq('id', change.id)
      if (approveError) throw approveError

      showNotification('Change approved and applied!', 'success')
      fetchPendingChanges()
    } catch (error: any) {
      showNotification(error.message, 'error')
    }
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
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <h2 className="font-bold text-lg text-gray-800">Pending Changes ({pendingChanges.length})</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingChanges.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Check size={48} className="text-green-200" />
            <p className="font-medium">All caught up!</p>
          </div>
        ) : (
          pendingChanges.map((change) => (
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
          ))
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
