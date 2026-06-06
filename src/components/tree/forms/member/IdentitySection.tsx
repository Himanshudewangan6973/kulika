/**
 * @file src/components/tree/forms/member/IdentitySection.tsx
 * @description Identity section for the member submission form.
 */

import React from 'react'

interface IdentitySectionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function IdentitySection({ formData, onChange }: IdentitySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2 text-gray-800">Basic Identity</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
        <input 
          name="full_name" 
          type="text" 
          value={formData.full_name} 
          onChange={onChange} 
          className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" 
          placeholder="e.g. Ramesh Kumar Dewangan" 
          required 
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Given Name</label>
          <input name="given_name" type="text" value={formData.given_name} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="e.g. Ramesh" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Middle Names</label>
          <input name="middle_names" type="text" value={formData.middle_names} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="e.g. Kumar" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
          <input name="surname" type="text" value={formData.surname} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="e.g. Dewangan" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Display Name</label>
          <input name="preferred_display_name" type="text" value={formData.preferred_display_name} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="e.g. Ramu" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Native Name (Hindi/local script)</label>
          <input name="native_name" type="text" value={formData.native_name} onChange={onChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="e.g. रमेश देवांगन" />
        </div>
      </div>
    </div>
  )
}
