import { StateCreator } from 'zustand';
import { ViewportState } from '../types';
import { TreeStoreState } from '../store';

export interface UISlice {
  expandedNode: string | null;
  hoveredNode: string | null;
  editingNodeId: string | null;
  mode: 'VIEW' | 'ADD' | 'EDIT' | 'REVIEW';
  viewport: ViewportState;
  searchQuery: string;
  notification: { message: string, type: 'success' | 'error' } | null;
  zoomCommand: { type: 'IN' | 'OUT' | 'FIT', timestamp: number } | null;

  setExpandedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  setMode: (mode: 'VIEW' | 'ADD' | 'EDIT' | 'REVIEW') => void;
  setViewport: (vp: ViewportState) => void;
  setSearchQuery: (query: string) => void;
  setZoomCommand: (cmd: 'IN' | 'OUT' | 'FIT') => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

export const createUISlice: any = (set: any, get: any) => ({
  expandedNode: null,
  hoveredNode: null,
  editingNodeId: null,
  mode: 'VIEW',
  viewport: { x: 0, y: 0, zoom: 1 },
  searchQuery: '',
  notification: null,
  zoomCommand: null,

  setExpandedNode: (expandedNode: string | null) => set({ expandedNode }, false, 'ui/setExpandedNode'),
  
  setHoveredNode: (hoveredNode: string | null) => set({ hoveredNode }, false, 'ui/setHoveredNode'),

  setEditingNodeId: (editingNodeId: string | null) => set({ editingNodeId }, false, 'ui/setEditingNodeId'),

  setMode: (mode: 'VIEW' | 'ADD' | 'EDIT' | 'REVIEW') => set({ mode }, false, 'ui/setMode'),

  setViewport: (viewport: ViewportState) => set({ viewport }, false, 'ui/setViewport'),

  setSearchQuery: (searchQuery: string) => set({ searchQuery }, false, 'ui/setSearchQuery'),

  setZoomCommand: (type: 'IN' | 'OUT' | 'FIT') => set({ zoomCommand: { type, timestamp: Date.now() } }, false, 'ui/setZoomCommand'),

  showNotification: (message: string, type: 'success' | 'error' = 'success') => {
    set({ notification: { message, type } }, false, 'ui/showNotification');
    setTimeout(() => set({ notification: null }), 3000);
  }
} as any);
