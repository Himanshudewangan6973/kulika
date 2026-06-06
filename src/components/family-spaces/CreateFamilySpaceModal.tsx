/**
 * @file src/components/family-spaces/CreateFamilySpaceModal.tsx
 * @description Modal for creating a new family space/tree.
 * Requirement: Allows users to bootstrap new heritage documentation environments.
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Globe, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { useTreeStore } from '@/components/tree/store';

interface CreateFamilySpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFamilySpaceModal({ isOpen, onClose }: CreateFamilySpaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadMyFamilySpaces } = useFamilySpaceStore();
  const setActiveWork = useTreeStore(state => state.setActiveWork);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setActiveWork({ id: 'create-tree', type: 'SUBMISSION', message: `Initializing "${name}" tree...` });

    try {
      if (!supabase) throw new Error('Database not configured');

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const { data: _data, error: insertError } = await supabase
        .from('communities')
        .insert({
          name,
          slug,
          description,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadMyFamilySpaces();
      onClose();
    } catch (err: any) {
      console.error('Create space error:', err);
      setError(err.message || 'Failed to create family space');
    } finally {
      setIsSubmitting(false);
      setActiveWork(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[3000] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <Plus className="text-white mx-auto mb-4" size={40} />
              <h2 className="text-2xl font-black text-white tracking-tight">New Family Tree</h2>
              <p className="text-indigo-100 text-sm">Start a new branch of heritage documentation.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Family Name</label>
                  <input
                    autoFocus
                    disabled={isSubmitting}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 disabled:opacity-50"
                    placeholder="e.g. Dewangan Lineage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Description (Optional)</label>
                  <textarea
                    disabled={isSubmitting}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 disabled:opacity-50"
                    placeholder="Briefly describe this family group..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <FeatureMini icon={<Globe size={14} />} label="Global" />
                 <FeatureMini icon={<Users size={14} />} label="Shared" />
                 <FeatureMini icon={<Shield size={14} />} label="Secure" />
              </div>

              <div className="flex gap-3 pt-2">
                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className={`${isSubmitting ? 'flex-1' : 'flex-[2]'} py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Initializing...
                    </>
                  ) : 'Create Tree'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FeatureMini({ icon, label }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="text-indigo-500 mb-1">{icon}</div>
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{label}</span>
    </div>
  );
}
