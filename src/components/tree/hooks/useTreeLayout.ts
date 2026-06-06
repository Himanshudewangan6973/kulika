"use client"

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useTreeStore } from '../store';

export const useTreeLayout = () => {
  const nodes = useTreeStore(state => state.nodes);
  const edges = useTreeStore(state => state.edges);
  const layoutDirection = useTreeStore(state => state.layoutDirection);
  const focusNodeId = useTreeStore(state => state.focusNode);
  const setNodes = useTreeStore(state => state.setNodes);
  const setEdges = useTreeStore(state => state.setEdges);
  const setIsCalculating = useTreeStore(state => state.setIsCalculating);
  
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const layoutSignature = useMemo(() => {
    // Only include real family members in the signature
    const realNodes = nodes.filter(n => !(n.data as any)?.isUnion);
    
    const nodeSignature = realNodes
      .map(node => `${node.id}:${node.data?.parent1Id || ''}:${node.data?.parent2Id || ''}`)
      .sort()
      .join('|');
    const edgeSignature = edges
      .map(edge => `${edge.id}:${edge.sourceId}:${edge.targetId}:${edge.type}`)
      .sort()
      .join('|');

    return `${layoutDirection}:${focusNodeId}:${nodeSignature}:${edgeSignature}`;
  }, [nodes, edges, layoutDirection, focusNodeId]);

  useEffect(() => {
    // Optimization: Offload expensive D3 stratification and layout to a Web Worker.
    workerRef.current = new Worker(new URL('../engine/layout.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (event) => {
      if (event.data.requestId !== requestIdRef.current) {
        return;
      }

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
    const state = useTreeStore.getState();
    const currentNodes = state.nodes;
    const currentEdges = state.edges;
    const currentDirection = state.layoutDirection;

    if (currentNodes.length === 0 || !workerRef.current) return;
    
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsCalculating(true); // Signal start of async calculation
    workerRef.current.postMessage({ 
      requestId,
      nodes: currentNodes, 
      edges: currentEdges, 
      direction: currentDirection,
      focusNodeId
    });
  }, [setIsCalculating, focusNodeId]);

  useEffect(() => {
    calculateLayout();
  }, [layoutSignature, calculateLayout]); // Recalculate on structural relationship changes

  return { calculateLayout };
};
