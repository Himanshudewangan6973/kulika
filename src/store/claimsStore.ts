import create from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Claim, ClaimWithEvidence } from '@/types/kulika';

interface ClaimsState {
  // Data
  claims: Record<string, Claim[]>; // memberId -> claims[]
  selectedClaim: ClaimWithEvidence | null;
  conflictingClaims: Claim[];
  
  // UI
  loading: boolean;
  filter: {
    claimType?: string;
    status?: string;
    minConfidence?: number;
  };
  
  // Actions
  addClaim: (memberId: string, claim: Claim) => void;
  setClaims: (memberId: string, claims: Claim[]) => void;
  setSelectedClaim: (claim: ClaimWithEvidence | null) => void;
  setConflictingClaims: (claims: Claim[]) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: any) => void;
  updateClaimStatus: (claimId: string, status: string) => void;
  removeClaim: (memberId: string, claimId: string) => void;
  
  // Computed
  getClaimsForMember: (memberId: string) => Claim[];
  getApprovedClaims: (memberId: string) => Claim[];
  getDisputedClaims: (memberId: string) => Claim[];
  getAverageConfidence: (memberId: string) => number;
}

export const useClaimsStore = create<ClaimsState>(
  devtools(
    (set: any, get: any): ClaimsState => ({
      claims: {},
      selectedClaim: null,
      conflictingClaims: [],
      loading: false,
      filter: {},
      
      addClaim: (memberId, claim) =>
        set((state: ClaimsState) => ({
          claims: {
            ...state.claims,
            [memberId]: [...(state.claims[memberId] || []), claim],
          },
        })),
      
      setClaims: (memberId, claims) =>
        set((state: ClaimsState) => ({
          claims: {
            ...state.claims,
            [memberId]: claims,
          },
        })),
      
      setSelectedClaim: (claim) =>
        set({ selectedClaim: claim }),
      
      setConflictingClaims: (claims) =>
        set({ conflictingClaims: claims }),
      
      setLoading: (loading) =>
        set({ loading }),
      
      setFilter: (filter) =>
        set({ filter }),
      
      updateClaimStatus: (claimId, status) =>
        set((state: ClaimsState) => ({
          claims: Object.fromEntries(
            Object.entries(state.claims).map(([memberId, claims]: [string, Claim[]]) => [
              memberId,
              claims.map((claim: Claim) =>
                claim.id === claimId ? { ...claim, status: status as Claim['status'] } : claim
              ),
            ])
          ),
        })),
      
      removeClaim: (memberId, claimId) =>
        set((state: ClaimsState) => ({
          claims: {
            ...state.claims,
            [memberId]: (state.claims[memberId] || []).filter((c: Claim) => c.id !== claimId),
          },
        })),
      
      getClaimsForMember: (memberId) => {
        return get().claims[memberId] || [];
      },
      
      getApprovedClaims: (memberId) => {
        return (get().claims[memberId] || []).filter((c: Claim) => c.status === 'approved');
      },
      
      getDisputedClaims: (memberId) => {
        return (get().claims[memberId] || []).filter((c: Claim) => c.status === 'disputed');
      },
      
      getAverageConfidence: (memberId) => {
        const memberClaims = get().claims[memberId] || [];
        if (memberClaims.length === 0) return 0;
        const sum = memberClaims.reduce((acc: number, c: Claim) => acc + c.confidenceScore, 0);
        return sum / memberClaims.length;
      },
    })
  ) as any
);
