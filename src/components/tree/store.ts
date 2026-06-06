/**
 * @file src/components/tree/store.ts
 * @description Root Zustand store for the Family Tree module.
 * Requirement: Orchestrates multiple slices (Data, UI, Config) into a unified state management system.
 */

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
