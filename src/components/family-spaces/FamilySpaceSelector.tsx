'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import type { FamilySpace } from '@/types/kulika';
import { ChevronDown, Plus } from 'lucide-react';
import CreateFamilySpaceModal from './CreateFamilySpaceModal';

export default function FamilySpaceSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentSpace, myFamilySpaces, setCurrentSpace, loadMyFamilySpaces, myRole } =
    useFamilySpaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadMyFamilySpaces().finally(() => setIsLoading(false));
  }, [loadMyFamilySpaces]);

  if (!mounted || isLoading) {
    return (
      <div className="h-10 w-40 bg-slate-100 rounded-2xl animate-pulse" />
    );
  }

  const handleSelectSpace = (space: FamilySpace) => {
    setCurrentSpace(space);
    setIsOpen(false);
    
    // Update URL if on a page that supports community filtering
    if (['/tree', '/stories', '/media', '/timeline', '/search'].includes(pathname)) {
      router.push(`${pathname}?communityId=${space.id}`);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
      >
        <div className="text-left">
          <div className="font-black text-[10px] text-slate-900 leading-tight">
            {currentSpace?.name || 'Select Family'}
          </div>
          <div className="text-[8px] font-black uppercase tracking-tighter text-indigo-500 mt-0.5 bg-indigo-50 px-1 rounded flex items-center justify-center">
            {myRole}
          </div>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {myFamilySpaces.map((space) => (
              <button
                key={space.id}
                onClick={() => handleSelectSpace(space)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  currentSpace?.id === space.id ? 'bg-indigo-50/50' : ''
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{space.name}</div>
                <div className="text-[10px] text-slate-400 font-medium">{space.slug}</div>
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setIsCreateModalOpen(true); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-indigo-600 hover:bg-indigo-50 border-t border-slate-50 font-black text-[10px] uppercase tracking-wider transition-colors"
          >
            <Plus size={14} />
            <span>Create New Tree</span>
          </button>
        </div>
      )}

      <CreateFamilySpaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
