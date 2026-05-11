'use client';

import React, { useEffect, useRef, memo } from 'react';
import * as d3 from 'd3';
import { useTreeStore } from './store';
import TreeSVG from './TreeSVG';
import TreeCanvas from './TreeCanvas';
import TreeToolbar from './TreeToolbar';
import TreeErrorBoundary from './TreeErrorBoundary';
import AdminReviewPanel from './AdminReviewPanel';
import AddMemberModal from './AddMemberModal';
import NodeActionOverlay from './NodeActionOverlay';
import { useTreeLayout } from './hooks/useTreeLayout';
import { useImageCache } from './hooks/useImageCache';
import { Loader2 } from 'lucide-react';

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
  
  // Initialize layout worker and image cache
  useTreeLayout();
  const avatarUrls = React.useMemo(() => nodes.map(n => n.data?.avatarUrl), [nodes]);
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
          const w = (xEx[1] - xEx[0]) || 1;
          const h = (yEx[1] - yEx[0]) || 1;
          const padding = 100;
          const s = Math.min(bounds.width / (w + padding), bounds.height / (h + padding), 1);
          const t = d3.zoomIdentity
            .translate(bounds.width / 2, bounds.height / 2)
            .scale(s)
            .translate(-(xEx[0] + xEx[1]) / 2, -(yEx[0] + yEx[1]) / 2);
          selection.transition().duration(800).ease(d3.easeCubicOut).call(zoomRef.current.transform, t);
        }
        break;
    }
  }, [zoomCommand, nodes]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Background Grid Pattern for spatial awareness */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Primary Rendering Layers */}
      {isLargeGraph ? <TreeCanvas /> : <TreeSVG />}
      
      <TreeToolbar onReviewClick={() => setMode('REVIEW')} />

      {/* Overlays & Modals */}
      <AdminReviewPanel isOpen={mode === 'REVIEW'} onClose={() => setMode('VIEW')} />
      <AddMemberModal />
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
