/**
 * @file src/components/tree/AddMemberModal.tsx
 * @description Modal component for adding new family members to the tree.
 * Requirement: Provides a comprehensive form for member identity, community, and personal details.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTreeStore } from './store'
import { X, Upload, Save, AlertCircle } from 'lucide-react'
import { fetchCommunities, Community } from '@/lib/supabase/communities'
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection'
import { IdentitySection } from './forms/member/IdentitySection'
import { CommunitySection } from './forms/member/CommunitySection'
import { PersonalSection } from './forms/member/PersonalSection'

const INITIAL_FORM_DATA = {
  full_name: '',
  given_name: '',
  middle_names: '',
  surname: '',
  preferred_display_name: '',
  native_name: '',
  community_id: '',
  community_override: '',
  name_notes: '',
  bio: '',
  gender: 'Other',
  dateOfBirth: '',
  birthPlace: '',
  isDeceased: false,
  dateOfDeath: '',
  parent1Id: '',
  parent2Id: '',
  nickname: '',
  profilePhotoUrl: '',
};

export default function AddMemberModal() {
  const mode = useTreeStore(state => state.mode)
  const setMode = useTreeStore(state => state.setMode)
  const submitChange = useTreeStore(state => state.submitChange)
  const setActiveWork = useTreeStore(state => state.setActiveWork)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [communities, setCommunities] = useState<Community[]>([])
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [lastAdded, setLastAdded] = useState<any>(null)
  
  const { duplicates, detectForNewMember } = useDuplicateDetection()
  
  useEffect(() => {
    if (mode === 'ADD') {
      fetchCommunities().then(setCommunities)
    }
  }, [mode])

  // Debounced duplicate detection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.full_name.length > 3) {
        detectForNewMember(formData).catch(console.error)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [formData.full_name, detectForNewMember])
  
  if (mode !== 'ADD') return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      alert('Full Name is required')
      return
    }

    setIsSubmitting(true)
    setActiveWork({ id: 'add-member-modal', type: 'SUBMISSION', message: `Adding ${formData.full_name} to the family registry...` })

    try {
      const success = await submitChange({
        change_type: 'new_member',
        proposed_data: formData,
        submitted_by: 'Current User'
      })
      
      if (success) {
        setLastAdded({ ...formData })
        setFormData(INITIAL_FORM_DATA)
        // Keep modal open briefly to show success
        setTimeout(() => {
          setLastAdded(null)
          setMode('VIEW')
        }, 4000)
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
      setActiveWork(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Upload size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Add Family Member</h2>
          </div>
          <button 
            disabled={isSubmitting}
            onClick={() => setMode('VIEW')} 
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-30"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
          {/* Duplicate Warnings */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="text-amber-500 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Potential Duplicates Found</h4>
                <p className="text-amber-700 text-xs mt-1">
                  We found {duplicates.length} member(s) with similar names. Please ensure you&apos;re not adding a duplicate record.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {duplicates.slice(0, 3).map((dup: any) => (
                    <div key={dup.id} className="bg-white/50 border border-amber-100 rounded-lg px-2 py-1 text-[10px] font-bold text-amber-800">
                      {dup.member2?.fullName || 'Similar Member'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Photo Dropzone Placeholder */}
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-all group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 mb-3 shadow-sm group-hover:text-indigo-500 transition-colors">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700">Upload Profile Photo</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
          </div>

          <IdentitySection formData={formData} onChange={handleInputChange} />
          <CommunitySection formData={formData} communities={communities} onChange={handleInputChange} />
          
          {/* NOTES SECTION - Inline for now as it's simple */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-gray-800">Stories & Notes</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name Notes</label>
              <textarea 
                name="name_notes" 
                rows={2} 
                disabled={isSubmitting}
                value={formData.name_notes} 
                onChange={handleInputChange} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50" 
                placeholder="Ambiguity about names, historical changes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brief Bio</label>
              <textarea 
                name="bio" 
                rows={3} 
                disabled={isSubmitting}
                value={formData.bio} 
                onChange={handleInputChange} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50" 
                placeholder="Summary of their life and journey..."
              />
            </div>
          </div>

          <PersonalSection formData={formData} onChange={handleInputChange} />

          {/* Family Position - Simplified */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-gray-800">Family Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent 1</label>
                <input name="parent1Id" type="text" disabled={isSubmitting} value={formData.parent1Id} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50" placeholder="Search ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent 2</label>
                <input name="parent2Id" type="text" disabled={isSubmitting} value={formData.parent2Id} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50" placeholder="Search ID" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4">
          {lastAdded && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                Member Submitted Successfully!
              </div>
              <p className="text-[10px] text-emerald-600 font-medium">
                {lastAdded.full_name} has been added to the review queue for the {lastAdded.community_id || 'Global'} community.
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            {!isSubmitting && (
              <button 
                onClick={() => setMode('VIEW')} 
                disabled={isSubmitting || !!lastAdded}
                className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !!lastAdded}
              className={`${isSubmitting ? 'w-full' : 'px-8'} py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing Contribution...
                </>
              ) : (
                <>
                  <Save size={18} /> Submit for Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
