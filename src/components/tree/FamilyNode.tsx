'use client';

import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  MapPin, 
  Globe,
  Plus, 
  Edit2, 
  X,
  UserPlus,
  AlertTriangle,
  ExternalLink,
  Image as ImageIcon,
  ScrollText,
  Heart,
  GitBranch
} from 'lucide-react';
import { FamilyMember } from './types';
import { useTreeStore } from './store';
import AddRelativeDropdown from './AddRelativeDropdown';
import AddRelativeModal from './AddRelativeModal';
import { findRelationshipPath } from './engine/pathfinder';

export type NodeUIState = 'collapsed' | 'hover' | 'expanded';

interface FamilyNodeProps {
  member: FamilyMember;
}

const FamilyNode: React.FC<FamilyNodeProps> = ({ member }) => {
  const [uiState, setUiState] = useState<NodeUIState>('collapsed');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const router = useRouter();
  const displayName = member.preferred_display_name || member.full_name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member';
  
  // High-Performance Selector: Only listen to the specific expanded state for this node
  const isSelected = useTreeStore(state => state.expandedNode === member.id);
  const toggleSelection = useTreeStore(state => state.setExpandedNode);
  const setMode = useTreeStore(state => state.setMode);
  const setEditingNodeId = useTreeStore(state => state.setEditingNodeId);
  const setFocusNode = useTreeStore(state => state.setFocusNode);
  const focusNodeId = useTreeStore(state => state.focusNode);
  const setPathfinderOriginNode = useTreeStore(state => state.setPathfinderOriginNode);
  const pathfinderOriginNode = useTreeStore(state => state.pathfinderOriginNode);
  const moveNode = useTreeStore(state => state.moveNode);
  const setRelationshipPath = useTreeStore(state => state.setRelationshipPath);
  const nodes = useTreeStore(state => state.nodes);
  const edges = useTreeStore(state => state.edges);
  const mode = useTreeStore(state => state.mode);
  const zoom = useTreeStore(state => state.viewport.zoom);
  const nodePosition = useTreeStore(state => {
    const node = state.nodes.find(n => n.id === member.id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  });

  const isFocus = focusNodeId === member.id;

  if ((member as any).isUnion) {
    return (
      <div 
        className="w-2 h-2 bg-slate-300 rounded-full shadow-sm"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    );
  }

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
    
    if (mode === 'PATHFINDER' && pathfinderOriginNode) {
       const path = findRelationshipPath(nodes, edges, pathfinderOriginNode, member.id);
       setRelationshipPath(path);
       setMode('VIEW');
       setPathfinderOriginNode(null);
       return;
    }

    if (dragStateRef.current?.moved) {
      dragStateRef.current = null;
      return;
    }
    toggleSelection(member.id);
  }, [member.id, toggleSelection, mode, pathfinderOriginNode, nodes, edges, setRelationshipPath, setMode, setPathfinderOriginNode]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelection(null);
    setUiState('collapsed');
  }, [toggleSelection]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: nodePosition.x,
      startY: nodePosition.y,
      moved: false,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  }, [nodePosition.x, nodePosition.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const viewport = useTreeStore.getState().viewport;
    const dx = (e.clientX - drag.startClientX) / viewport.zoom;
    const dy = (e.clientY - drag.startClientY) / viewport.zoom;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      drag.moved = true;
      moveNode(member.id, drag.startX + dx, drag.startY + dy);
    }
  }, [member.id, moveNode]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture can already be released by the browser.
    }

    if (!drag.moved) {
      dragStateRef.current = null;
    }
  }, []);

  // Dynamic Z-Index: Active nodes must stay on top of the stack
  const zIndex = uiState === 'expanded' ? 100 : uiState === 'hover' ? 50 : 10;
  const isLiving = !member.is_deceased && !member.dateOfDeath;

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ 
        width: 0, height: 0, // Pivot point
        zIndex 
      }}
    >
      <motion.div
        layout
        className={`absolute bg-white shadow-xl border overflow-hidden transition-colors ${
          member.status === 'Deceased' ? 'border-slate-300' : 'border-gray-100'
        }`}
        initial={false}
        animate={{
          width: uiState === 'expanded' ? 200 : uiState === 'hover' ? 180 : (zoom < 0.4 ? 12 : 30),
          height: uiState === 'expanded' ? 250 : uiState === 'hover' ? 40 : (zoom < 0.4 ? 12 : 30),
          borderRadius: uiState === 'collapsed' ? (zoom < 0.4 ? 6 : 30) : 12,
          x: uiState === 'collapsed' ? 0 : 0,
          y: uiState === 'collapsed' ? 0 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
        style={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto'
        }}
      >
        {/* VITAL STATUS INDICATOR (Top-Right Dot) */}
        {zoom > 0.6 && uiState === 'collapsed' && (
          <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full z-20 ${
            isLiving ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]' : 'bg-slate-300'
          }`} />
        )}

        {/* GENERATION RIBBON (Bottom) */}
        {zoom > 0.8 && uiState === 'collapsed' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500/20" />
        )}

        {/* 1. COLLAPSED CONTENT */}
        {uiState === 'collapsed' && (
          <div className="w-full h-full relative group">
            {zoom >= 0.4 ? (
              <>
                {member.avatarUrl ? (
                  <Image 
                    src={member.avatarUrl} 
                    alt="" 
                    fill 
                    className="object-cover"
                    sizes="30px"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${
                    member.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {displayName[0]}
                  </div>
                )}

                {/* Story/Media Badges (Semantic Zooming: only show when visible) */}
                {zoom > 0.8 && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5">
                    {(member.media_count || 0) > 0 && (
                      <div className="bg-amber-500 text-white p-0.5 rounded-full shadow-sm">
                        <ImageIcon size={6} />
                      </div>
                    )}
                    {(member.stories_count || 0) > 0 && (
                      <div className="bg-indigo-500 text-white p-0.5 rounded-full shadow-sm">
                        <ScrollText size={6} />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Spouse Indicator */}
                {member.spouseIds?.length > 0 && zoom > 0.8 && (
                  <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full shadow-sm">
                    <Heart size={6} fill="currentColor" />
                  </div>
                )}
              </>
            ) : (
              /* High-Zoom Out View: Minimal Dot */
              <div className={`w-full h-full ${
                member.gender === 'Female' ? 'bg-rose-400' : 'bg-blue-400'
              }`} />
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
                    {displayName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold truncate text-gray-900">
                  {displayName}
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
                  onClick={(e) => { e.stopPropagation(); setEditingNodeId(member.id); }}
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
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 mb-2 relative shadow-inner ${
                  isFocus ? 'border-indigo-500 ring-4 ring-indigo-100' : 'border-blue-100'
                }`}>
                  {member.avatarUrl ? (
                    <Image src={member.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xl font-bold text-blue-600">
                      {displayName[0]}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{displayName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-gray-500 italic">Generation {member.generation}</p>
                  {member.status === 'Pending' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-bold uppercase">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {/* Case 4: Same-sex Parent Labeling (Generic Parents) */}
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Parents / Guardians</span>
                  <div className="flex flex-col gap-1.5">
                    {member.parent1Id ? (
                      <div className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                        <span className="text-[9px] text-gray-600 truncate max-w-[80px]">ID: {member.parent1Id.substring(0,6)}</span>
                        {member.lineage_type_p1 && member.lineage_type_p1 !== 'biological' && (
                          <span className="text-[7px] font-black uppercase text-indigo-500 bg-indigo-50 px-1 rounded">{member.lineage_type_p1}</span>
                        )}
                      </div>
                    ) : <div className="px-2 py-1 bg-gray-50 rounded text-[9px] text-gray-400 italic">Unknown</div>}
                    
                    {member.parent2Id && (
                      <div className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                        <span className="text-[9px] text-gray-600 truncate max-w-[80px]">ID: {member.parent2Id.substring(0,6)}</span>
                        {member.lineage_type_p2 && member.lineage_type_p2 !== 'biological' && (
                          <span className="text-[7px] font-black uppercase text-indigo-500 bg-indigo-50 px-1 rounded">{member.lineage_type_p2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded-lg">
                  <MapPin size={12} className="text-orange-400" />
                  <span className="truncate">Raipur, Chhattisgarh</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded-lg mb-2">
                  <Globe size={12} className="text-gray-400" />
                  <span className="font-bold">Community:</span>
                  <span className="truncate">{member.community_id || member.community_override || 'Global'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-blue-50 p-1.5 rounded-lg">
                    <Users size={12} className="text-blue-400" />
                    <span>{member.children_count || 0} Children</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-purple-50 p-1.5 rounded-lg">
                    <FileText size={12} className="text-purple-400" />
                    <span>{member.stories_count || 0} Stories</span>
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
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFocusNode(isFocus ? null : member.id); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold transition-all shadow-sm ${
                      isFocus ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={12} /> {isFocus ? 'Reset' : 'Focus'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMode('ADD'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-bold hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <UserPlus size={12} /> Add
                  </button>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/members/${member.id}`); }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[9px] font-bold hover:bg-gray-200 transition-colors"
                >
                  Full Profile <ExternalLink size={10} />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPathfinderOriginNode(member.id); 
                    setMode('PATHFINDER');
                    toggleSelection(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg text-[9px] font-bold hover:bg-indigo-50 transition-colors"
                >
                  Find Relation <GitBranch size={10} />
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
