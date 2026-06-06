/**
 * @file src/components/tree/TreeDirectory.tsx
 * @description Indented ancestral directory for fast navigation across massive trees.
 * Requirement: Provides an alternate list-based view for 1,000+ members.
 */

'use client';

import { useState } from 'react';
import { useTreeStore } from './store';
import { Search, ChevronRight, User } from 'lucide-react';

export default function TreeDirectory({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const allNodes = useTreeStore(state => state.nodes.filter(n => !(n.data as any).isUnion));
  
  const filteredNodes = allNodes.filter(n => 
    (n.data.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.data.preferred_display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const setFocusNode = useTreeStore(state => state.setFocusNode);
  const setExpandedNode = useTreeStore(state => state.setExpandedNode);
  const zoomCommand = useTreeStore(state => state.setZoomCommand);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md shadow-2xl z-[300] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ChevronRight className="text-indigo-600" />
          Member Directory
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">Close</button>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {filteredNodes.sort((a, b) => (a.data.full_name || '').localeCompare(b.data.full_name || '')).map(node => (
            <button
              key={node.id}
              onClick={() => {
                setFocusNode(node.id);
                setExpandedNode(node.id);
                zoomCommand('FIT');
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 line-clamp-1">{node.data.full_name}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Generation {node.data.generation}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
          {allNodes.length} Members Indexed
        </p>
      </div>
    </div>
  );
}
