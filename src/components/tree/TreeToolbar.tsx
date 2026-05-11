'use client';

import React, { useState } from 'react';
import { 
  GitCommit, 
  CornerDownRight, 
  Spline, 
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  Users,
  Eye, 
  EyeOff,
  PlusCircle
  } from 'lucide-react';
  import { useTreeStore } from './store';
  import { EdgeStyle, TreeDirection } from './types';

  export default function TreeToolbar({ onReviewClick }: { onReviewClick: () => void }) {
  const edgeStyle = useTreeStore(state => state.edgeStyle);
  const setEdgeStyle = useTreeStore(state => state.setEdgeStyle);
  const direction = useTreeStore(state => state.layoutDirection);
  const setDirection = useTreeStore(state => state.setLayoutDirection);
  const showUnlinked = useTreeStore(state => state.showUnlinked);
  const setShowUnlinked = useTreeStore(state => state.setShowUnlinked);
  const setZoomCommand = useTreeStore(state => state.setZoomCommand);
  const searchQuery = useTreeStore(state => state.searchQuery);
  const setSearchQuery = useTreeStore(state => state.setSearchQuery);
  const fetchMoreGenerations = useTreeStore(state => state.fetchMoreGenerations);
  const isCalculating = useTreeStore(state => state.isCalculating);
  const nodes = useTreeStore(state => state.nodes);

  const handleExpand = () => {
    // Determine current max generation and fetch 3 more
    const maxGen = Math.max(...nodes.map((n: any) => n.data.generation || 0), 0);
    fetchMoreGenerations(maxGen + 3);
  };
  const styles: { id: EdgeStyle; icon: any; label: string }[] = [
    { id: 'straight', icon: GitCommit, label: 'Straight' },
    { id: 'bezier', icon: Spline, label: 'Curved' },
    { id: 'orthogonal', icon: CornerDownRight, label: 'Elbow' },
    { id: 'custom', icon: Maximize2, label: 'Custom' },
  ];

  const directions: { id: TreeDirection; icon: any; label: string }[] = [
    { id: 'TB', icon: ArrowDown, label: 'Top to Bottom' },
    { id: 'BT', icon: ArrowUp, label: 'Bottom to Top' },
    { id: 'LR', icon: ArrowRight, label: 'Left to Right' },
    { id: 'RL', icon: ArrowLeft, label: 'Right to Left' },
  ];

  return (
    <div className="absolute top-6 left-6 flex flex-col gap-4 z-[200] max-w-sm">
      {/* Search Bar */}
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-2xl shadow-2xl flex items-center gap-2 ring-1 ring-black/5">
        <Search size={18} className="text-gray-400 ml-2" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search person..."
          className="bg-transparent border-none outline-none text-sm text-gray-700 w-48 placeholder:text-gray-400"
        />
      </div>

      <div className="flex gap-4">
        {/* Navigation & Layout Controls */}
        <div className="flex flex-col gap-4">
          {/* Zoom Controls */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-1.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 ring-1 ring-black/5">
            <button 
              onClick={() => setZoomCommand('IN')}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all hover:scale-110 active:scale-95"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button 
              onClick={() => setZoomCommand('OUT')}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all hover:scale-110 active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={() => setZoomCommand('FIT')}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all hover:scale-110 active:scale-95 border-t border-gray-100 mt-1"
              title="Fit to Screen"
            >
              <Maximize size={20} />
            </button>
          </div>

          {/* Visibility Toggles */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-1.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 ring-1 ring-black/5">
            <button 
              onClick={() => setShowUnlinked(!showUnlinked)}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                showUnlinked ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={showUnlinked ? "Hide Unlinked" : "Show Unlinked"}
            >
              {showUnlinked ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button 
              onClick={handleExpand}
              disabled={isCalculating}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 text-green-600 hover:bg-green-50 disabled:opacity-50`}
              title="Expand Lineage (+3 Gen)"
            >
              <PlusCircle size={20} className={isCalculating ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={onReviewClick}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 text-amber-600 hover:bg-amber-50 border-t border-gray-100 mt-1`}
              title="Review Submissions"
            >
              <Users size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Edge Style Selector */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-1.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 ring-1 ring-black/5">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setEdgeStyle(s.id)}
                title={s.label}
                className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                  edgeStyle === s.id 
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-100' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <s.icon size={20} />
              </button>
            ))}
          </div>

          {/* Direction Selector */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-1.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 ring-1 ring-black/5">
            {directions.map((d) => (
              <button
                key={d.id}
                onClick={() => setDirection(d.id)}
                title={d.label}
                className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                  direction === d.id 
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-100' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <d.icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
