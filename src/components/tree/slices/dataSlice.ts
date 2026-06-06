/**
 * @file src/components/tree/slices/dataSlice.ts
 * @description Zustand slice for managing family tree data, layout, and persistence.
 * Requirement: Provides a centralized state for nodes, edges, and tree manipulation actions.
 */

import { LayoutNode, LayoutEdge, BendPoint } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  submitChangeToInbox, 
  fetchGenerations, 
  saveEdgeCustomization 
} from './dataPersistence';

export interface DataSlice {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  pendingRelationships: any[];
  isCalculating: boolean;
  
  setNodes: (nodes: LayoutNode[] | ((nds: LayoutNode[]) => LayoutNode[])) => void;
  setEdges: (edges: LayoutEdge[] | ((eds: LayoutEdge[]) => LayoutEdge[])) => void;
  setIsCalculating: (is: boolean) => void;
  addNodesAndEdges: (newNodes: LayoutNode[], newEdges: LayoutEdge[]) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  markPendingMemberApproved: (inboxId: string, approvedMemberId: string) => void;
  markLocalMemberApproved: (nodeId: string) => void;
  
  // Persistence Actions
  submitChange: (change: any) => Promise<boolean>;
  fetchRelatives: (memberId: string) => Promise<void>;
  fetchMoreGenerations: (maxGeneration: number) => Promise<number>;
  persistEdgeCustomization: (edgeId: string, relationshipId: string, lineStyle?: string) => Promise<boolean>;
  
  // Edge Manipulation
  addEdgeBendPoint: (edgeId: string, point: { x: number, y: number }) => void;
  updateEdgeBendPoint: (edgeId: string, pointId: string, x: number, y: number) => void;
  removeEdgeBendPoint: (edgeId: string, pointId: string) => void;
}

export const createDataSlice: any = (set: any, get: any) => ({
  nodes: [],
  edges: [],
  pendingRelationships: [],
  isCalculating: false,

  setNodes: (update: LayoutNode[] | ((nds: LayoutNode[]) => LayoutNode[])) => set((state: any) => ({
    nodes: typeof update === 'function' ? update(state.nodes) : update
  }), false, 'data/setNodes'),

  setEdges: (update: LayoutEdge[] | ((eds: LayoutEdge[]) => LayoutEdge[])) => set((state: any) => ({
    edges: typeof update === 'function' ? update(state.edges) : update
  }), false, 'data/setEdges'),

  setIsCalculating: (isCalculating: boolean) => set({ isCalculating }, false, 'data/setIsCalculating'),

  addNodesAndEdges: (newNodes: LayoutNode[], newEdges: LayoutEdge[]) => {
    set((state: any) => {
      const existingNodeIds = new Set(state.nodes.map((n: LayoutNode) => n.id));
      const filteredNewNodes = newNodes.filter((n: LayoutNode) => !existingNodeIds.has(n.id));
      const existingEdgeIds = new Set(state.edges.map((e: LayoutEdge) => e.id));
      const filteredNewEdges = newEdges.filter((e: LayoutEdge) => !existingEdgeIds.has(e.id));
      
      return {
        nodes: [...state.nodes, ...filteredNewNodes],
        edges: [...state.edges, ...filteredNewEdges]
      }
    }, false, 'data/addNodesAndEdges');
  },

  moveNode: (nodeId: string, x: number, y: number) => {
    set((state: any) => ({
      nodes: state.nodes.map((node: LayoutNode) =>
        node.id === nodeId ? { ...node, x, y } : node
      ),
      edges: state.edges.map((edge: LayoutEdge) => {
        if (edge.sourceId === nodeId) return { ...edge, source: { x, y } };
        if (edge.targetId === nodeId) return { ...edge, target: { x, y } };
        return edge;
      }),
    }), false, 'data/moveNode');
  },

  markPendingMemberApproved: (inboxId: string, approvedMemberId: string) => {
    const pendingId = `pending-${inboxId}`;
    set((state: any) => {
      const nextNodes = state.nodes.map((node: LayoutNode) =>
        node.id === pendingId
          ? {
              ...node,
              id: approvedMemberId,
              data: { ...node.data, id: approvedMemberId, status: 'Approved', isTemporary: false },
            }
          : node
      );

      const pos = nextNodes.find((n: LayoutNode) => n.id === approvedMemberId);
      const nextEdges = state.edges.map((edge: LayoutEdge) => {
        const sId = edge.sourceId === pendingId ? approvedMemberId : edge.sourceId;
        const tId = edge.targetId === pendingId ? approvedMemberId : edge.targetId;
        return {
          ...edge,
          id: edge.id.replace(pendingId, approvedMemberId),
          sourceId: sId,
          targetId: tId,
          source: sId === approvedMemberId && pos ? { x: pos.x, y: pos.y } : edge.source,
          target: tId === approvedMemberId && pos ? { x: pos.x, y: pos.y } : edge.target,
          isPending: false,
        };
      });
      return { nodes: nextNodes, edges: nextEdges };
    }, false, 'data/markPendingMemberApproved');
  },

  markLocalMemberApproved: (nodeId: string) => {
    set((state: any) => ({
      nodes: state.nodes.map((node: LayoutNode) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, status: 'Approved', isTemporary: false, isLocalPreview: true } }
          : node
      ),
      edges: state.edges.map((edge: LayoutEdge) =>
        edge.sourceId === nodeId || edge.targetId === nodeId ? { ...edge, isPending: false } : edge
      ),
    }), false, 'data/markLocalMemberApproved');
  },

  addEdgeBendPoint: (edgeId: string, point: { x: number, y: number }) => set((state: any) => ({
    edges: state.edges.map((edge: LayoutEdge) => 
      edge.id === edgeId 
        ? { ...edge, bendPoints: [...edge.bendPoints, { id: uuidv4(), ...point }] }
        : edge
    )
  }), false, 'data/addEdgeBendPoint'),

  updateEdgeBendPoint: (edgeId: string, pointId: string, x: number, y: number) => set((state: any) => ({
    edges: state.edges.map((edge: LayoutEdge) => 
      edge.id === edgeId 
        ? { ...edge, bendPoints: edge.bendPoints.map((p: BendPoint) => p.id === pointId ? { ...p, x, y } : p) }
        : edge
    )
  }), false, 'data/updateEdgeBendPoint'),

  removeEdgeBendPoint: (edgeId: string, pointId: string) => set((state: any) => ({
    edges: state.edges.map((edge: LayoutEdge) => 
      edge.id === edgeId 
        ? { ...edge, bendPoints: edge.bendPoints.filter((p: BendPoint) => p.id !== pointId) }
        : edge
    )
  }), false, 'data/removeEdgeBendPoint'),

  // --- ASYNC ACTIONS (Delegated to dataPersistence) ---
  
  submitChange: (change: any) => 
    submitChangeToInbox(change, get, get().addNodesAndEdges, get().showNotification),

  fetchRelatives: async (_memberId: string) => { /* Placeholder */ },

  fetchMoreGenerations: (maxGeneration: number) => 
    fetchGenerations(maxGeneration, get().nodes, get().addNodesAndEdges, get().setIsCalculating, get().showNotification),

  persistEdgeCustomization: (edgeId: string, relationshipId: string, lineStyle: string = 'bezier') => 
    saveEdgeCustomization(edgeId, relationshipId, lineStyle, get().edges, get().showNotification)
});
