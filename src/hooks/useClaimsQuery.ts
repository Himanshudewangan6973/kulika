import { useEffect, useState } from 'react';
import { useClaimsStore } from '@/store/claimsStore';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { claimsEngine } from '@/lib/claims-engine';
export function useClaimsQuery(memberId: string) {
  const { currentSpace } = useFamilySpaceStore();
  const { setClaims, setLoading } = useClaimsStore();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memberId || !currentSpace) return;

    const fetchClaims = async () => {
      setLoading(true);
      try {
        const claims = await claimsEngine.getClaimsForMember(
          currentSpace.id,
          memberId
        );
        setClaims(memberId, claims);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [memberId, currentSpace, setClaims, setLoading]);

  return { error };
}
