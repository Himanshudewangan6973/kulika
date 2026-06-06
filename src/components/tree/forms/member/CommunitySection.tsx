/**
 * @file src/components/tree/forms/member/CommunitySection.tsx
 * @description Community section for the member submission form.
 */

import React from 'react'

interface CommunitySectionProps {
  formData: any;
  communities: any[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CommunitySection({ formData, communities, onChange }: CommunitySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2 text-gray-800">Community</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Community</label>
        <select 
          name="community_id" 
          value={formData.community_id} 
          onChange={onChange} 
          className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
        >
          <option value="">Select Community...</option>
          <option value="dewangan">Dewangan (suggested)</option>
          {communities.map(community => (
            <option key={community.id} value={community.id}>{community.name}</option>
          ))}
          <option value="other">Other...</option>
        </select>
      </div>
      
      {formData.community_id === 'other' && (
        <div className="animate-in slide-in-from-top duration-200">
          <label className="block text-sm font-medium text-slate-700 mb-1">Specify Community</label>
          <input 
            name="community_override" 
            type="text" 
            value={formData.community_override} 
            onChange={onChange} 
            className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" 
            placeholder="e.g. Sharma" 
          />
        </div>
      )}
    </div>
  )
}
