'use client';

import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  UserPlus,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { FamilyMember } from './types';
import { useTreeStore } from './store';
import AddRelativeDropdown from './AddRelativeDropdown';
import AddRelativeModal from './AddRelativeModal';

export type NodeUIState = 'collapsed' | 'hover' | 'expanded';

interface FamilyNodeProps {
  member: FamilyMember;
}

const FamilyNode = ({ member }: FamilyNodeProps) => {
  const [uiState, setUiState] = useState<NodeUIState>('collapsed');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // High-Performance Selector: Only listen to the specific expanded state for this node
  const isSelected = useTreeStore(state => state.expandedNode === member.id);
  const toggleSelection = useTreeStore(state => state.setExpandedNode);
  const setMode = useTreeStore(state => state.setMode);

  // Sync expanded state with global selection
  useEffect(() => {
    setUiState(isSelected ? 'expanded' : 'collapsed');
  }, [isSelected]);

  const handleMouseEnter = useCallback(() => {
    if (uiState === 'expanded') return;
    
    // 150ms Debounce to prevent flickering when moving mouse rapidly over multiple nodes
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setUiState('hover');
    }, 150);
  }, [uiState]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (uiState === 'hover') {
      setUiState('collapsed');
    }
  }, [uiState]);

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent D3 zoom/pan from triggering
    toggleSelection(member.id);
  }, [member.id, toggleSelection]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelection(member.id);
    setUiState('collapsed');
  }, [member.id, toggleSelection]);

  // Dynamic Z-Index: Active nodes must stay on top of the stack
  const zIndex = uiState === 'expanded' ? 100 : uiState === 'hover' ? 50 : 10;

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
      style={{ 
        width: 0, height: 0, // Pivot point
        zIndex 
      }}
    >
      <motion.div
        layout
        className="absolute bg-white shadow-xl border border-gray-100 overflow-hidden"
        initial={false}
        animate={{
          width: uiState === 'expanded' ? 200 : uiState === 'hover' ? 180 : 30,
          height: uiState === 'expanded' ? 250 : uiState === 'hover' ? 40 : 30,
          borderRadius: uiState === 'collapsed' ? 30 : 12,
          x: uiState === 'collapsed' ? 0 : 0,
          y: uiState === 'collapsed' ? 0 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto' // Re-enable pointer events for the node content
        }}
      >
        {/* 1. COLLAPSED CONTENT */}
        {uiState === 'collapsed' && (
          <div className="w-full h-full relative">
            {member.avatarUrl ? (
              <Image 
                src={member.avatarUrl} 
                alt="" 
                fill 
                className="object-cover"
                sizes="30px"
              />
            ) : (
              <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                {member.firstName[0]}
              </div>
            )}
          </div>
        )}

        {/* 2. HOVER CONTENT (Quick Actions) */}
        <AnimatePresence>
          {uiState === 'hover' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center px-2 gap-2"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-100">
                {member.avatarUrl ? (
                  <Image src={member.avatarUrl} alt="" width={24} height={24} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[8px] font-bold text-blue-600">
                    {member.firstName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold truncate text-gray-900">
                  {member.firstName} {member.lastName}
                </div>
              </div>
              <div className="flex gap-1 pr-1">
                <AddRelativeDropdown onSelect={(type) => setActiveModal(type)}>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Plus size={10} />
                  </button>
                </AddRelativeDropdown>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* action */ }}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-500 transition-colors"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. EXPANDED CONTENT (Full Card) */}
        <AnimatePresence>
          {uiState === 'expanded' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col p-4 relative"
            >
              <button 
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X size={14} />
              </button>

              <div className="flex flex-col items-center mb-4 pt-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 mb-2 relative shadow-inner">
                  {member.avatarUrl ? (
                    <Image src={member.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xl font-bold text-blue-600">
                      {member.firstName[0]}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{member.firstName} {member.lastName}</h3>
                <p className="text-[10px] text-gray-500 italic">Generation {member.generation}</p>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {/* Case 4: Same-sex Parent Labeling (Generic Parents) */}
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Parents / Guardians</span>
                  <div className="flex gap-2">
                    {member.parent1Id ? (
                      <div className="px-2 py-1 bg-gray-100 rounded text-[9px] text-gray-600 truncate max-w-[80px]">Member ID: {member.parent1Id.substring(0,6)}</div>
                    ) : <div className="px-2 py-1 bg-gray-50 rounded text-[9px] text-gray-400 italic">Unknown</div>}
                    {member.parent2Id && (
                      <div className="px-2 py-1 bg-gray-100 rounded text-[9px] text-gray-600 truncate max-w-[80px]">Member ID: {member.parent2Id.substring(0,6)}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded-lg">
                  <MapPin size={12} className="text-orange-400" />
                  <span className="truncate">Raipur, Chhattisgarh</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-blue-50 p-1.5 rounded-lg">
                    <Users size={12} className="text-blue-400" />
                    <span>4 Children</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-purple-50 p-1.5 rounded-lg">
                    <FileText size={12} className="text-purple-400" />
                    <span>12 Stories</span>
                  </div>
                </div>

                {/* Case 8: Large Family Hint */}
                {member.children_count && member.children_count >= 10 && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-600" />
                    <span className="text-[8px] text-amber-700 font-medium">Large family: branch auto-condensed</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-auto border-t border-gray-50 flex flex-col gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setMode('ADD'); }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  <UserPlus size={12} /> Add Family Member
                </button>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-colors"
                >
                  View Profile <ExternalLink size={10} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Relative Modals */}
      <AddRelativeModal 
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        targetMember={member}
        type={activeModal as any}
      />
    </div>
  );
};

export default memo(FamilyNode);
