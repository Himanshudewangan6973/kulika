import { StateCreator } from 'zustand';
import { EdgeStyle, TreeDirection } from '../types';
import { TreeStoreState } from '../store';

export interface ConfigSlice {
  edgeStyle: EdgeStyle;
  layoutDirection: TreeDirection;
  showUnlinked: boolean;

  setEdgeStyle: (style: EdgeStyle) => void;
  setLayoutDirection: (dir: TreeDirection) => void;
  setShowUnlinked: (show: boolean) => void;
}

export const createConfigSlice: any = (set: any) => ({
  edgeStyle: 'orthogonal',
  layoutDirection: 'TB',
  showUnlinked: true,

  setEdgeStyle: (edgeStyle: EdgeStyle) => set({ edgeStyle }, false, 'config/setEdgeStyle'),

  setLayoutDirection: (layoutDirection: TreeDirection) => set({ layoutDirection }, false, 'config/setLayoutDirection'),

  setShowUnlinked: (showUnlinked: boolean) => set({ showUnlinked }, false, 'config/setShowUnlinked'),
} as any);
