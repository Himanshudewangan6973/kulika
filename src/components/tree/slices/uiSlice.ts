
/**
 * @file src/components/tree/slices/uiSlice.ts
 * @description Zustand slice for managing UI state (modals, selection, viewport) for the family tree.
 * Requirement: Decouples UI state from data state for performance and modularity.
 */

export interface UISlice {
  expandedNode: string | null;
  focusNode: string | null;
  hoveredNode: string | null;
  editingNodeId: string | null;
  pathfinderOriginNode: string | null;
  mode: 'VIEW' | 'ADD' | 'EDIT' | 'REVIEW' | 'RELATIONSHIP' | 'PATHFINDER';
  viewport: { x: number; y: number; zoom: number };
  searchQuery: string;
  notification: { message: string, type: 'success' | 'error' } | null;
  activeWork: { id: string, type: 'SUBMISSION' | 'UPLOAD', message: string } | null;
  railExpanded: boolean;
  zoomCommand: { type: 'IN' | 'OUT' | 'FIT', timestamp: number } | null;
  relationshipPath: any[] | null;

  setExpandedNode: (id: string | null) => void;
  setFocusNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  setPathfinderOriginNode: (id: string | null) => void;
  setMode: (mode: 'VIEW' | 'ADD' | 'EDIT' | 'REVIEW' | 'RELATIONSHIP' | 'PATHFINDER') => void;
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;
  setSearchQuery: (query: string) => void;
  setActiveWork: (work: { id: string, type: 'SUBMISSION' | 'UPLOAD', message: string } | null) => void;
  setRailExpanded: (expanded: boolean) => void;
  setZoomCommand: (cmd: 'IN' | 'OUT' | 'FIT') => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  setRelationshipPath: (path: any[] | null) => void;
}

export const createUISlice: any = (set: any, _get: any) => ({
  expandedNode: null,
  focusNode: null,
  hoveredNode: null,
  editingNodeId: null,
  pathfinderOriginNode: null,
  mode: 'VIEW',
  viewport: { x: 0, y: 0, zoom: 1 },
  searchQuery: '',
  notification: null,
  activeWork: null,
  railExpanded: false,
  zoomCommand: null,
  relationshipPath: null,

  setExpandedNode: (expandedNode: string | null) => set({ expandedNode }, false, 'ui/setExpandedNode'),
  
  setFocusNode: (focusNode: string | null) => set({ focusNode }, false, 'ui/setFocusNode'),

  setHoveredNode: (hoveredNode: string | null) => set({ hoveredNode }, false, 'ui/setHoveredNode'),

  setEditingNodeId: (editingNodeId: string | null) => set({ editingNodeId }, false, 'ui/setEditingNodeId'),

  setPathfinderOriginNode: (pathfinderOriginNode: string | null) => set({ pathfinderOriginNode }, false, 'ui/setPathfinderOriginNode'),

  setMode: (mode: 'VIEW' | 'ADD' | 'EDIT' | 'REVIEW' | 'RELATIONSHIP' | 'PATHFINDER') => set({ mode }, false, 'ui/setMode'),

  setViewport: (viewport: { x: number; y: number; zoom: number }) => set({ viewport }, false, 'ui/setViewport'),

  setSearchQuery: (searchQuery: string) => set({ searchQuery }, false, 'ui/setSearchQuery'),

  setActiveWork: (activeWork: { id: string, type: 'SUBMISSION' | 'UPLOAD', message: string } | null) => set({ activeWork }, false, 'ui/setActiveWork'),

  setRailExpanded: (railExpanded: boolean) => set({ railExpanded }, false, 'ui/setRailExpanded'),

  setZoomCommand: (type: 'IN' | 'OUT' | 'FIT') => set({ zoomCommand: { type, timestamp: Date.now() } }, false, 'ui/setZoomCommand'),

  showNotification: (message: string, type: 'success' | 'error' = 'success') => {
    set({ notification: { message, type } }, false, 'ui/showNotification');
    setTimeout(() => set({ notification: null }), 3000);
  },

  setRelationshipPath: (relationshipPath: any[] | null) => set({ relationshipPath }, false, 'ui/setRelationshipPath')
} as any);
