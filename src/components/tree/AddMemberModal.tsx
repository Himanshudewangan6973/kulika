'use client'

import React, { useState } from 'react'
import { useTreeStore } from './store'
import { X, Upload, Save } from 'lucide-react'

export default function AddMemberModal() {
  const mode = useTreeStore(state => state.mode)
  const setMode = useTreeStore(state => state.setMode)
  const submitChange = useTreeStore(state => state.submitChange)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    gender: 'Male',
    date_of_birth: '',
    birth_place: '',
    is_deceased: false,
    date_of_death: '',
    father_id: '',
    mother_id: '',
    bio: '',
  })
  
  if (mode !== 'ADD') return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target
    const name = id.replace('add-', '')
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.full_name) {
      alert('Full Name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await submitChange({
        change_type: 'new_member',
        proposed_data: formData,
        submitted_by: 'Current User'
      })
      
      if (success) {
        setFormData({
          full_name: '',
          nickname: '',
          gender: 'Male',
          date_of_birth: '',
          birth_place: '',
          is_deceased: false,
          date_of_death: '',
          father_id: '',
          mother_id: '',
          bio: '',
        })
        setMode('VIEW')
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Add New Family Member</h2>
          <button onClick={() => setMode('VIEW')} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <Upload size={32} className="text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Upload Photo or drag here</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input id="add-full_name" type="text" value={formData.full_name} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ramesh Dewangan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input id="add-nickname" type="text" value={formData.nickname} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ramu" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select id="add-gender" value={formData.gender} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Birth & Death Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input id="add-date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                <input id="add-birth_place" type="text" value={formData.birth_place} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Raipur" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="add-is_deceased" checked={formData.is_deceased} onChange={handleInputChange} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
              <label htmlFor="add-is_deceased" className="text-sm font-medium text-gray-700">Deceased</label>
            </div>

            {formData.is_deceased && (
              <div className="animate-in slide-in-from-top duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                <input id="add-date_of_death" type="date" value={formData.date_of_death} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Family Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father</label>
                <input id="add-father_id" type="text" value={formData.father_id} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search existing or add new" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother</label>
                <input id="add-mother_id" type="text" value={formData.mother_id} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search existing or add new" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Bio (Optional)</h3>
            <textarea id="add-bio" rows={4} value={formData.bio} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief summary of their life..."></textarea>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
          <button 
            onClick={() => setMode('VIEW')} 
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Submitting...
              </span>
            ) : (
              <>
                <Save size={18} /> Submit for Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
