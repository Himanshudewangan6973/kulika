/**
 * @file src/components/tree/forms/member/PersonalSection.tsx
 * @description Personal information section for the member submission form.
 */

import React from 'react'

interface PersonalSectionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function PersonalSection({ formData, onChange }: PersonalSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2 text-gray-800">Personal Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <select name="gender" value={formData.gender} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Place of Birth</label>
        <input name="birthPlace" type="text" value={formData.birthPlace} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="e.g. Raipur, Chhattisgarh" />
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          name="isDeceased" 
          id="isDeceased"
          checked={formData.isDeceased} 
          onChange={onChange} 
          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
        />
        <label htmlFor="isDeceased" className="text-sm font-medium text-slate-700">Deceased</label>
      </div>

      {formData.isDeceased && (
        <div className="animate-in slide-in-from-top duration-200">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Death</label>
          <input name="dateOfDeath" type="date" value={formData.dateOfDeath} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" />
        </div>
      )}
    </div>
  )
}
