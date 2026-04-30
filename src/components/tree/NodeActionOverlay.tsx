'use client'

import React from 'react'
import { useTreeStore } from './store'
import { X, Save, Trash2, Camera, UserPlus } from 'lucide-react'

export default function NodeActionOverlay() {
  const editingNodeId = useTreeStore(state => state.editingNodeId)
  const nodes = useTreeStore(state => state.nodes)
  const setEditingNodeId = useTreeStore(state => state.setEditingNodeId)
  const submitChange = useTreeStore(state => state.submitChange)
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    full_name: '',
    nickname: '',
    date_of_birth: '',
    date_of_death: '',
  })
  
  const node = React.useMemo(() => nodes.find(n => n.id === editingNodeId), [nodes, editingNodeId])

  React.useEffect(() => {
    if (node) {
      setFormData({
        full_name: node.data.full_name || '',
        nickname: node.data.nickname || '',
        date_of_birth: node.data.date_of_birth || '',
        date_of_death: node.data.date_of_death || '',
      })
    }
  }, [node])
  
  if (!editingNodeId || !node) return null

  const handleUpdate = async () => {
    setIsSubmitting(true)
    await submitChange({
      change_type: 'edit_member',
      target_id: editingNodeId,
      proposed_data: formData,
      original_data: node.data,
      submitted_by: 'Current User'
    })
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const field = id.replace('edit-', '')
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-[100] backdrop-blur-[1px]" onClick={() => setEditingNodeId(null)}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-80 border-2 border-blue-500 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-blue-600 p-3 text-white flex justify-between items-center">
          <h3 className="font-bold text-sm">Edit Family Member</h3>
          <button onClick={() => setEditingNodeId(null)} className="hover:bg-blue-700 p-1 rounded transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                {node.data.profile_photo_url ? (
                  <img src={node.data.profile_photo_url} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  <Camera size={24} />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400">Full Name</label>
              <input id="edit-full_name" type="text" value={formData.full_name} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400">Nickname</label>
              <input id="edit-nickname" type="text" value={formData.nickname} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Born</label>
                <input id="edit-date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-xs outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Died</label>
                <input id="edit-date_of_death" type="date" value={formData.date_of_death} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-xs outline-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <button 
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <><Save size={14} /> Update</>
              )}
            </button>
            <button className="p-2 text-red-500 hover:bg-red-50 rounded border border-red-100" title="Delete Member">
              <Trash2 size={16} />
            </button>
          </div>
          
          <button className="w-full py-1.5 text-[10px] font-bold text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1">
            <UserPlus size={12} /> Add Relative...
          </button>
        </div>
      </div>
    </div>
  )
}
