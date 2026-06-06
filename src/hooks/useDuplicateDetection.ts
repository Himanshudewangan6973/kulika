import { useState } from 'react';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import type { PotentialDuplicate } from '@/types/kulika';

export function useDuplicateDetection() {
  const { currentSpace } = useFamilySpaceStore();
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const detectForNewMember = async (memberData: any) => {
    if (!currentSpace) return;

    setLoading(true);
    try {
      const response = await fetch('/api/duplicates/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: currentSpace.id,
          newMember: memberData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setDuplicates(result.data.potentialDuplicates || []);
      } else {
        throw new Error(result.error?.message || 'Detection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return { duplicates, loading, error, detectForNewMember };
}
