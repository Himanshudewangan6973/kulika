import create from 'zustand'
import { devtools } from 'zustand/middleware'
import { createDataSlice, DataSlice } from './slices/dataSlice'
import { createUISlice, UISlice } from './slices/uiSlice'
import { createConfigSlice, ConfigSlice } from './slices/configSlice'

// Unified store type
export type TreeStoreState = DataSlice & UISlice & ConfigSlice;

/**
 * Root Zustand Store
 * Combines modular slices for Data, UI, and Configuration.
 * Uses DevTools for debugging and follows an atomic update pattern.
 */
export const useTreeStore = create<TreeStoreState>(
  devtools((...a) => ({
    ...createDataSlice(...a),
    ...createUISlice(...a),
    ...createConfigSlice(...a),
  }))
);

// High-performance memoized selectors
export const selectNodes = (state: TreeStoreState) => state.nodes;
export const selectEdges = (state: TreeStoreState) => state.edges;
export const selectViewport = (state: TreeStoreState) => state.viewport;
export const selectExpandedNode = (state: TreeStoreState) => state.expandedNode;
export const selectHoveredNode = (state: TreeStoreState) => state.hoveredNode;
export const selectEdgeStyle = (state: TreeStoreState) => state.edgeStyle;
export const selectLayoutDirection = (state: TreeStoreState) => state.layoutDirection;
export const selectIsCalculating = (state: TreeStoreState) => state.isCalculating;
export const selectShowUnlinked = (state: TreeStoreState) => state.showUnlinked;
export const selectSearchQuery = (state: TreeStoreState) => state.searchQuery;
export const selectNotification = (state: TreeStoreState) => state.notification;
export const selectZoomCommand = (state: TreeStoreState) => state.zoomCommand;
