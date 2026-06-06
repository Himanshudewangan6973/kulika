'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Heart, Info, AlertTriangle, Users } from 'lucide-react';
import { RelationshipType, FamilyMember } from './types';
import { useTreeStore } from './store';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMember: FamilyMember;
  targetMember?: FamilyMember;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; icon: any; color: string }[] = [
  { value: 'parent', label: 'Parent/Child', icon: Users, color: 'text-slate-600' },
  { value: 'spouse', label: 'Spouse/Partner', icon: Heart, color: 'text-pink-500' },
  { value: 'adoptive-parent', label: 'Adoptive Parent', icon: Users, color: 'text-green-600' },
  { value: 'step-parent', label: 'Step Parent', icon: Users, color: 'text-orange-600' },
  { value: 'guardian', label: 'Legal Guardian', icon: Info, color: 'text-blue-600' },
  { value: 'foster', label: 'Foster Parent', icon: Users, color: 'text-purple-600' },
  { value: 'in-law', label: 'In-Law', icon: Users, color: 'text-gray-500' },
  { value: 'unknown', label: 'Unknown Relationship', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'custom', label: 'Custom Connection', icon: Info, color: 'text-slate-400' },
];

export default function AddRelationshipModal({ isOpen, onClose, sourceMember, targetMember }: AddRelationshipModalProps) {
  const [type, setType] = useState<RelationshipType>('parent');
  const [notes, setNotes] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const submitChange = useTreeStore(state => state.submitChange);

  const sourceDisplayName = sourceMember.preferred_display_name || sourceMember.full_name;
  const targetDisplayName = targetMember ? (targetMember.preferred_display_name || targetMember.full_name) : 'Select Member';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMember) return;

    const success = await submitChange({
      change_type: 'new_relationship',
      proposed_data: {
        source_id: sourceMember.id,
        target_id: targetMember.id,
        relationship_type: type,
        notes,
        custom_description: type === 'custom' ? customDesc : null
      }
    });

    if (success) onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-[301] border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-gray-900">Define Relationship</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </Dialog.Close>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600">
                {sourceDisplayName.charAt(0) || '?'}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{sourceDisplayName}</span>
            </div>
            <div className="flex-1 h-px bg-dashed bg-gray-200 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <Users size={16} className="text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-400 italic">
                {targetMember ? (targetDisplayName.charAt(0) || '?') : '?'}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{targetMember ? targetDisplayName : 'Select Member'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    type === opt.value 
                      ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <opt.icon size={18} className={opt.color} />
                  <span className="text-xs font-semibold text-gray-700">{opt.label}</span>
                </button>
              ))}
            </div>

            {type === 'custom' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Custom Description</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="e.g. Godparent, Family Friend"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Relationship Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context about this connection..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Submit for Review
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
