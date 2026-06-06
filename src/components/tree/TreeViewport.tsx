'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useTreeStore } from './store';
import TreeSVG from './TreeSVG';
import TreeCanvas from './TreeCanvas';
import TreeToolbar from './TreeToolbar';
import TreeErrorBoundary from './TreeErrorBoundary';
import AdminReviewPanel from './AdminReviewPanel';
import AddMemberModal from './AddMemberModal';
import AddRelationshipModal from './AddRelationshipModal';
import TreeDirectory from './TreeDirectory';
import MemberBottomSheet from './MemberBottomSheet';
import HeritageNotification from './HeritageNotification';
import NodeActionOverlay from './NodeActionOverlay';
import { useTreeLayout } from './hooks/useTreeLayout';
import { useImageCache } from './hooks/useImageCache';
import { Loader2, ChevronRight, X } from 'lucide-react';

const RENDER_THRESHOLD = 1000;

function TreeViewportContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<any>(null);
  const nodes = useTreeStore(state => state.nodes);
  const setViewport = useTreeStore(state => state.setViewport);
  const zoomCommand = useTreeStore(state => state.zoomCommand);
  const isCalculating = useTreeStore(state => state.isCalculating);
  const mode = useTreeStore(state => state.mode);
  const setMode = useTreeStore(state => state.setMode);
  const selectedNode = useTreeStore(state => state.nodes.find(n => n.id === state.expandedNode));
  const setExpandedNode = useTreeStore(state => state.setExpandedNode);
  const setLayoutDirection = useTreeStore(state => state.setLayoutDirection);
  const setPathfinderOriginNode = useTreeStore(state => state.setPathfinderOriginNode);
  const setRelationshipPath = useTreeStore(state => state.setRelationshipPath);
  const relationshipPath = useTreeStore(state => state.relationshipPath);
  
  // 1. Mobile-First Default: Set direction to LR on smaller screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setLayoutDirection('LR');
    }
  }, [setLayoutDirection]);

  // Initialize layout worker and image cache
  useTreeLayout();
  const avatarUrls = useMemo(() => nodes.map(n => n.data?.avatarUrl), [nodes]);
  useImageCache(avatarUrls);

  // Performance Strategy: Hybrid Rendering
  // Small trees (<1000) use interactive SVG. Large trees use high-perf Canvas.
  const isLargeGraph = nodes.length > RENDER_THRESHOLD;

  useEffect(() => {
    if (!containerRef.current) return;

    // Orchestrate Zoom & Pan using D3-Zoom
    const zoom = d3.zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.05, 3]) // Aggressive zoom range for 5000+ nodes
      .tapDistance(30) // Improve mobile touch responsiveness
      .on('zoom', (event) => {
        setViewport({
          x: event.transform.x,
          y: event.transform.y,
          zoom: event.transform.k
        });
      });

    zoomRef.current = zoom;
    const selection = d3.select(containerRef.current);
    selection.call(zoom);

    // Center the viewport initially
    selection.call(zoom.transform, d3.zoomIdentity.translate(window.innerWidth / 2, 100).scale(1));

    return () => {
      // Memory Leak Prevention: Clear listeners on unmount
      selection.on('.zoom', null);
    };
  }, [setViewport]);

  // Handle Synchronized Zoom Commands from the UI Toolbar
  useEffect(() => {
    if (!zoomRef.current || !containerRef.current || !zoomCommand) return;
    const selection = d3.select(containerRef.current);
    
    switch (zoomCommand.type) {
      case 'IN': 
        selection.transition().duration(300).call(zoomRef.current.scaleBy, 1.4); 
        break;
      case 'OUT': 
        selection.transition().duration(300).call(zoomRef.current.scaleBy, 0.7); 
        break;
      case 'FIT':
        const bounds = containerRef.current.getBoundingClientRect();
        if (nodes.length > 0) {
          const xEx = d3.extent(nodes, n => n.x) as [number, number];
          const yEx = d3.extent(nodes, n => n.y) as [number, number];
          const w = (xEx[1] - xEx[0]) || 400;
          const h = (yEx[1] - yEx[0]) || 400;
          const padding = 150;
          
          // Limit minimum scale to 0.4 so it doesn't get too small if there's only 1-2 nodes
          const s = Math.max(Math.min(bounds.width / (w + padding), bounds.height / (h + padding), 1), 0.4);
          
          const t = d3.zoomIdentity
            .translate(bounds.width / 2, bounds.height / 2)
            .scale(s)
            .translate(-(xEx[0] + xEx[1]) / 2, -(yEx[0] + yEx[1]) / 2);
          selection.transition().duration(800).ease(d3.easeCubicOut).call(zoomRef.current.transform, t);
        }
        break;
    }
  }, [zoomCommand, nodes]);

  const handleContainerClick = () => {
    if (mode === 'PATHFINDER') {
      setMode('VIEW');
      setPathfinderOriginNode(null);
      setRelationshipPath(null);
    }
    setExpandedNode(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing touch-none"
      onClick={handleContainerClick}
    >
      {/* Background Grid Pattern for spatial awareness */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Primary Rendering Layers */}
      {isLargeGraph ? <TreeCanvas /> : <TreeSVG />}
      
      <TreeToolbar onReviewClick={() => setMode('REVIEW')} />

      {/* Overlays & Modals */}
      {mode === 'PATHFINDER' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-sm animate-bounce">
          Select target member to find relation...
        </div>
      )}

      {relationshipPath && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[400] bg-white border border-slate-100 p-4 rounded-3xl shadow-2xl flex flex-col gap-2 min-w-[300px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bloodline Path</span>
            <button onClick={() => setRelationshipPath(null)} className="text-slate-300 hover:text-slate-500"><X size={16} /></button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {relationshipPath.map((step: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                   <span className="text-xs font-bold text-slate-800">{nodes.find(n => n.id === step.memberId)?.data.full_name.split(' ')[0]}</span>
                   <span className="text-[8px] font-black uppercase text-indigo-500">{step.relation}</span>
                </div>
                {i < relationshipPath.length - 1 && <ChevronRight size={14} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <HeritageNotification />
      <TreeDirectory isOpen={mode === 'EDIT'} onClose={() => setMode('VIEW')} />
      <MemberBottomSheet 
        member={selectedNode?.data || null} 
        onClose={() => setExpandedNode(null)} 
      />
      <AdminReviewPanel isOpen={mode === 'REVIEW'} onClose={() => setMode('VIEW')} />
      <AddMemberModal />
      {selectedNode && (
        <AddRelationshipModal 
          isOpen={mode === 'RELATIONSHIP'} 
          onClose={() => setMode('VIEW')}
          sourceMember={selectedNode.data}
        />
      )}
      <NodeActionOverlay />
      {isCalculating && (
        <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Recalculating Layout...</span>
        </div>
      )}
    </div>
  );
}

/**
 * TreeViewport Entry Point
 * Wrapped in an ErrorBoundary to prevent entire app failure during layout math crashes.
 */
export default function TreeViewport() {
  return (
    <TreeErrorBoundary>
      <TreeViewportContent />
    </TreeErrorBoundary>
  );
}
