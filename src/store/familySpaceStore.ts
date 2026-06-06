import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { FamilySpace, FamilyRole } from '@/types/kulika';

interface FamilySpaceState {
  // Current space
  currentSpace: FamilySpace | null;
  setCurrentSpace: (space: FamilySpace) => void;
  
  // Available spaces
  myFamilySpaces: FamilySpace[];
  setMyFamilySpaces: (spaces: FamilySpace[]) => void;
  loadMyFamilySpaces: () => Promise<void>;
  
  // My role & permissions
  myRole: FamilyRole;
  canApproveMembers: boolean;
  canModerateBranch: (branchId: string) => boolean;
  canMergeMembers: () => boolean;
  canAccessSensitiveData: boolean;
  
  // Loading state
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useFamilySpaceStore = create<FamilySpaceState>(
  devtools(
    persist(
      (set: any, get: any): FamilySpaceState => ({
        currentSpace: null,
        myFamilySpaces: [],
        myRole: 'visitor',
        canApproveMembers: false,
        canAccessSensitiveData: false,
        loading: false,
        
        setCurrentSpace: (space) => {
          const role = (space as FamilySpace & { myRole?: FamilyRole }).myRole || 'visitor';
          const permissions = calculatePermissions(role);
          set({
            currentSpace: space,
            myRole: role,
            canApproveMembers: permissions.canApprove,
            canAccessSensitiveData: permissions.canAccessSensitive,
          });
        },
        
        setMyFamilySpaces: (spaces) => set({ myFamilySpaces: spaces }),

        loadMyFamilySpaces: async () => {
          set({ loading: true });
          try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            if (!supabase) return;

            const { data, error } = await supabase
              .from('communities')
              .select('*')
              .order('name');

            if (error) throw error;
            
            // Map communities to FamilySpace type
            const spaces: FamilySpace[] = (data || []).map(comm => ({
              id: comm.id,
              name: comm.name,
              slug: comm.slug,
              description: comm.description || '',
              privacyLevel: 'public', // Default to public
              createdAt: comm.created_at || new Date().toISOString(),
              updatedAt: comm.updated_at || new Date().toISOString(),
            }));

            set({ myFamilySpaces: spaces });
          } catch (err: any) {
            console.error('❌ Error loading family spaces:', {
              message: err.message,
              details: err.details,
              hint: err.hint,
              code: err.code
            });
            set({ myFamilySpaces: [] });
          } finally {
            set({ loading: false });
          }
        },
        
        canModerateBranch: (branchId: string) => {
          const state = get();
          if (state.myRole === 'family_owner' || state.myRole === 'family_admin') {
            return true;
          }
          if (state.myRole === 'branch_moderator') {
            return (state.currentSpace as any)?.myBranchScope === branchId;
          }
          return false;
        },

        canMergeMembers: () => {
          const state = get();
          return state.myRole === 'family_owner' || state.myRole === 'family_admin';
        },
        
        setLoading: (loading) => set({ loading }),
      }),
      {
        name: 'family-space-storage',
      }
    )
  ) as any
);

function calculatePermissions(role: FamilyRole) {
  const permissions = {
    canApprove: ['family_owner', 'family_admin', 'branch_moderator'].includes(role),
    canAccessSensitive: ['family_owner', 'family_admin'].includes(role),
  };
  return permissions;
}
