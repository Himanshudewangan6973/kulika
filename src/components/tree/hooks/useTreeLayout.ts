"use client"

import { useEffect, useCallback, useRef } from 'react';
import { useTreeStore } from '../store';

export const useTreeLayout = () => {
  const nodes = useTreeStore(state => state.nodes);
  const edges = useTreeStore(state => state.edges);
  const layoutDirection = useTreeStore(state => state.layoutDirection);
  const setNodes = useTreeStore(state => state.setNodes);
  const setEdges = useTreeStore(state => state.setEdges);
  const setIsCalculating = useTreeStore(state => state.setIsCalculating);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Optimization: Offload expensive D3 stratification and layout to a Web Worker.
    workerRef.current = new Worker(new URL('../engine/layout.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (event) => {
      if (event.data.error) {
        console.error('Worker layout error:', event.data.error);
        setIsCalculating(false);
        return;
      }
      
      setNodes(event.data.nodes);
      setEdges(event.data.edges);
      setIsCalculating(false); // Calculation finished
    };

    return () => {
      // Memory Leak Prevention: Strictly terminate the worker on unmount.
      workerRef.current?.terminate();
    };
  }, [setNodes, setEdges, setIsCalculating]); 

  const calculateLayout = useCallback(() => {
    if (nodes.length === 0 || !workerRef.current) return;
    
    setIsCalculating(true); // Signal start of async calculation
    workerRef.current.postMessage({ nodes, edges, direction: layoutDirection });
  }, [nodes, edges, layoutDirection, setIsCalculating]);

  useEffect(() => {
    calculateLayout();
  }, [layoutDirection, nodes.length, calculateLayout]); // Recalculate on direction change or node addition

  return { calculateLayout };
};
