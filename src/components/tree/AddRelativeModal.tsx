'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UserPlus, Calendar, MapPin, Info } from 'lucide-react';
import { unifiedMemberSchema, UnifiedMember } from '@/lib/schemas/memberSchema';
import { useTreeStore } from './store';
import { FamilyMember, RelationshipType } from './types';

interface AddRelativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: FamilyMember;
  type: RelationshipType | 'child' | 'sibling'; // Extended for UI logic
}

export default function AddRelativeModal({ isOpen, onClose, targetMember, type }: AddRelativeModalProps) {
  const submitChange = useTreeStore(state => state.submitChange);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UnifiedMember>({
    resolver: zodResolver(unifiedMemberSchema),
    defaultValues: {
      gender: 'Other',
      isDeceased: false
    }
  });

  const onSubmit = async (data: UnifiedMember) => {
    // Map internal UI types to domain relationship types

    const success = await submitChange({
      change_type: 'new_member_with_relation',
      proposed_data: {
        ...data,
        base_member_id: targetMember.id,
        relationship_to_base: type,
        status: 'Pending'
      }
    });

    if (success) {
      reset();
      onClose();
    }
  };

  const getTitle = () => {
    const displayName = targetMember.preferred_display_name || targetMember.full_name
    switch(type) {
      case 'parent': return `Add Parent for ${displayName}`;
      case 'spouse': return `Add Spouse for ${displayName}`;
      case 'child': return `Add Child for ${displayName}`;
      case 'sibling': return `Add Sibling for ${displayName}`;
      default: return 'Add New Relative';
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[400]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 z-[401] overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <UserPlus size={20} />
              </div>
              <Dialog.Title className="text-xl font-bold text-gray-900">{getTitle()}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name *</label>
              <input 
                {...register('full_name')}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none transition-all ${errors.full_name ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
              />
              {errors.full_name && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender</label>
                <select 
                  {...register('gender')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Custom</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                  <Calendar size={12} /> Birth Date
                </label>
                <input 
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                <MapPin size={12} /> Birth Place
              </label>
              <input 
                {...register('birthPlace')}
                placeholder="City, Country"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
              <Info size={16} className="shrink-0" />
              <p className="text-[10px] leading-relaxed">
                Adding a <strong>{type}</strong> will create a pending record in the genealogy database. It will appear on the tree with a pulse animation until verified by an administrator.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
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
                Submit New Member
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
