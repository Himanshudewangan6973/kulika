import create from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Revision } from '@/types/kulika';

interface RevisionState {
  // Data
  revisions: Revision[];
  selectedRevision: Revision | null;
  
  // UI
  loading: boolean;
  entityFilter?: string;
  canUndoFilter?: boolean;
  
  // Actions
  setRevisions: (revisions: Revision[]) => void;
  addRevision: (revision: Revision) => void;
  setSelectedRevision: (revision: Revision | null) => void;
  setLoading: (loading: boolean) => void;
  setEntityFilter: (entityType: string) => void;
  setCanUndoFilter: (canUndo: boolean) => void;
  
  // Computed
  getRevisions: () => Revision[];
  getUndoableRevisions: () => Revision[];
  getRevisionsByEntity: (entityId: string) => Revision[];
  canUndo: (revisionId: string) => boolean;
}

export const useRevisionStore = create<RevisionState>(
  devtools(
    (set: any, get: any): RevisionState => ({
      revisions: [],
      selectedRevision: null,
      loading: false,
      
      setRevisions: (revisions) =>
        set({ revisions }),
      
      addRevision: (revision) =>
        set((state: RevisionState) => ({ revisions: [revision, ...state.revisions] })),
      
      setSelectedRevision: (revision) =>
        set({ selectedRevision: revision }),
      
      setLoading: (loading) =>
        set({ loading }),
      
      setEntityFilter: (entityType) =>
        set({ entityFilter: entityType }),
      
      setCanUndoFilter: (canUndo) =>
        set({ canUndoFilter: canUndo }),
      
      getRevisions: () => {
        const state = get() as RevisionState;
        let revisions = state.revisions;
        
        if (state.entityFilter) {
          revisions = revisions.filter((r: Revision) => r.entityType === state.entityFilter);
        }
        
        if (state.canUndoFilter !== undefined) {
          revisions = revisions.filter((r: Revision) => r.canUndo === state.canUndoFilter);
        }
        
        return revisions;
      },
      
      getUndoableRevisions: () => {
        return (get() as RevisionState).revisions.filter((r: Revision) => r.canUndo && !r.undoneAt);
      },
      
      getRevisionsByEntity: (entityId) => {
        return (get() as RevisionState).revisions.filter((r: Revision) => r.entityId === entityId);
      },
      
      canUndo: (revisionId) => {
        const revision = (get() as RevisionState).revisions.find((r: Revision) => r.id === revisionId);
        return revision?.canUndo ?? false;
      },
    })
  ) as any
);
