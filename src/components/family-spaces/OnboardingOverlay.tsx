/**
 * @file src/components/family-spaces/OnboardingOverlay.tsx
 * @description Force-selection overlay for users without an active family space.
 * Requirement: Ensures every user is anchored to a community before exploring heritage data.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { Plus, Users, Search, ChevronRight } from 'lucide-react';
import CreateFamilySpaceModal from './CreateFamilySpaceModal';

export default function OnboardingOverlay() {
  const { currentSpace, myFamilySpaces, loading } = useFamilySpaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // If already have a space or still loading, or not mounted, don't show
  if (!mounted || loading || currentSpace || myFamilySpaces.length > 0) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        <div className="flex-1 p-10 md:p-12">
          <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-8">
            <Users size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Welcome to Kulika</h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 font-medium">
            To begin preserving your heritage, you must first join or create a family space. This will be your collaborative sanctuary.
          </p>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="w-full group flex items-center justify-between p-6 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Plus size={24} />
                 </div>
                 <span>Create New Tree</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              className="w-full group flex items-center justify-between p-6 bg-slate-50 text-slate-700 rounded-3xl font-black text-lg hover:bg-slate-100 transition-all border border-slate-100"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500">
                    <Search size={24} />
                 </div>
                 <span>Find My Family</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="hidden md:block w-64 bg-indigo-50 p-12 flex flex-col justify-center gap-8">
           <OnboardingStep step="1" text="Create your family branch" />
           <OnboardingStep step="2" text="Invite relatives to collaborate" />
           <OnboardingStep step="3" text="Document oral traditions" />
        </div>

        <CreateFamilySpaceModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
        />
      </motion.div>
    </div>
  );
}

function OnboardingStep({ step, text }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm shrink-0">{step}</div>
      <p className="text-sm font-bold text-slate-600 leading-tight">{text}</p>
    </div>
  );
}
